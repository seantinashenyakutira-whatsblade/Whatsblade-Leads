import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure, rateLimitedProcedure } from '@/lib/trpc/init';
import { apiKeySchema } from '@/lib/validations/api-key';
import { encrypt, decrypt } from '@/lib/encryption';
import { logActivity } from '@/lib/audit';

async function logApiUsage(userId: string, provider: string, success: boolean, responseTime: number, supabaseAdmin: unknown) {
  const sa = supabaseAdmin as Record<string, unknown>;
  const fromFn = sa.from as (table: string) => Record<string, unknown>;
  const insertFn = fromFn('api_usage_log').insert as (data: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: unknown; error: unknown }> } };
  await insertFn({
    user_id: userId,
    provider,
    status_code: success ? 200 : 0,
    response_time_ms: responseTime,
    success,
  });
}

const PROVIDER_TEST_CONFIG: Record<string, { test: (keyValue: string) => Promise<{ success: boolean; message: string }> }> = {
  google_places: {
    test: async (keyValue) => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=0,0&radius=1&type=restaurant&key=${keyValue}`,
          { signal: AbortSignal.timeout(10000) }
        );
        const data = await response.json();
        if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
          return { success: false, message: `Google Places API: ${data.error_message || data.status}` };
        }
        return { success: true, message: 'Google Places API connection successful' };
      } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? err.message : 'Connection failed' };
      }
    },
  },
  facebook_graph: {
    test: async (keyValue) => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/me?access_token=${keyValue}`,
          { signal: AbortSignal.timeout(10000) }
        );
        const data = await response.json();
        if (data.error) {
          return { success: false, message: `Facebook Graph API: ${data.error.message}` };
        }
        return { success: true, message: 'Facebook Graph API connection successful' };
      } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? err.message : 'Connection failed' };
      }
    },
  },
  instagram: {
    test: async (keyValue) => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${keyValue}`,
          { signal: AbortSignal.timeout(10000) }
        );
        const data = await response.json();
        if (data.error) {
          return { success: false, message: `Instagram API: ${data.error.message}` };
        }
        return { success: true, message: 'Instagram API connection successful' };
      } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? err.message : 'Connection failed' };
      }
    },
  },
  anthropic: {
    test: async (keyValue) => {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': keyValue,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (response.status === 401 || response.status === 403) {
          return { success: false, message: 'Anthropic API: Invalid API key' };
        }
        return { success: true, message: 'Anthropic API connection successful' };
      } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? err.message : 'Connection failed' };
      }
    },
  },
};

export const apiKeysRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .from('api_keys')
      .select('id, name, provider, last_used_at, expires_at, is_active, created_at, updated_at')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  create: rateLimitedProcedure
    .input(apiKeySchema)
    .mutation(async ({ ctx, input }) => {
      const { encrypted, iv, tag } = encrypt(input.keyValue);

      const { data, error } = await ctx.supabaseAdmin
        .from('api_keys')
        .insert({
          user_id: ctx.user.id,
          name: input.name,
          provider: input.provider,
          key_encrypted: encrypted,
          key_iv: iv,
          key_tag: tag,
          expires_at: input.expiresAt ?? null,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'api_key.created',
        entityType: 'api_key',
        entityId: data.id,
        metadata: { name: input.name, provider: input.provider },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { id: data.id, name: data.name, provider: data.provider };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabaseAdmin
        .from('api_keys')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'api_key.deleted',
        entityType: 'api_key',
        entityId: input.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { success: true };
    }),

  decrypt: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('api_keys')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'API key not found' });

      try {
        const keyValue = decrypt(
          data.key_encrypted as unknown as Buffer,
          data.key_iv as unknown as Buffer,
          data.key_tag as unknown as Buffer
        );

        await ctx.supabaseAdmin
          .from('api_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', input.id);

        return { keyValue };
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to decrypt API key' });
      }
    }),

  testConnection: rateLimitedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('api_keys')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'API key not found' });

      try {
        const keyValue = decrypt(
          data.key_encrypted as unknown as Buffer,
          data.key_iv as unknown as Buffer,
          data.key_tag as unknown as Buffer
        );

        const provider = data.provider.toLowerCase().replace(/[\s-]/g, '_');
        const testConfig = PROVIDER_TEST_CONFIG[provider];

        if (!testConfig) {
          return { success: false, message: `No test available for provider: ${data.provider}` };
        }

        const startTime = Date.now();
        const result = await testConfig.test(keyValue);
        const responseTime = Date.now() - startTime;

        await logApiUsage(ctx.user.id, data.provider, result.success, responseTime, ctx.supabaseAdmin);

        await ctx.supabaseAdmin
          .from('api_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', input.id);

        return result;
      } catch {
        return { success: false, message: 'Failed to decrypt API key' };
      }
    }),
});
