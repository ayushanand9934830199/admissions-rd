import { createClient } from '@supabase/supabase-js';

// Uses the service role key — server-side only, never exposed to the client
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}
