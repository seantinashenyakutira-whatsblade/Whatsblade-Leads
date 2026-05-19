import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const createServerClient = () =>
  createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

let _adminClient: ReturnType<typeof createServerClient> | null = null;

export function getSupabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createServerClient();
  }
  return _adminClient;
}
