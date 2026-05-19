import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '@/lib/trpc/init';
import { loginSchema, registerSchema, updateProfileSchema } from '@/lib/validations/auth';
import { logActivity } from '@/lib/audit';

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) throw new TRPCError({ code: 'UNAUTHORIZED', message: error.message });

      await logActivity({
        userId: data.user.id,
        action: 'user.login',
        entityType: 'user',
        entityId: data.user.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return { session: data.session, user: data.user };
    }),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { full_name: input.fullName },
        },
      });

      if (error) throw new TRPCError({ code: 'BAD_REQUEST', message: error.message });

      return { user: data.user, session: data.session };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase.auth.signOut();
    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return { success: true };
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, string> = {};
      if (input.fullName) updates.full_name = input.fullName;
      if (input.avatarUrl) updates.avatar_url = input.avatarUrl;

      const { data, error } = await ctx.supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', ctx.user.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'user.profile_updated',
        entityType: 'user',
        entityId: ctx.user.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),

  listUsers: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data;
  }),

  updateUserRole: adminProcedure
    .input(z.object({ userId: z.string().uuid(), role: z.enum(['admin', 'agent']) }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabaseAdmin
        .from('users')
        .update({ role: input.role })
        .eq('id', input.userId)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      await logActivity({
        userId: ctx.user.id,
        action: 'user.role_changed',
        entityType: 'user',
        entityId: input.userId,
        metadata: { newRole: input.role },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return data;
    }),
});
