import { getSupabaseAdmin } from '@/lib/db/client';

interface LogActivityParams {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logActivity(params: LogActivityParams) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from('activities').insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
  });

  if (error) {
    console.error('[AUDIT] Failed to log activity:', error.message);
  }
}
