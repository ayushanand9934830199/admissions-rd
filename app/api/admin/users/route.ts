import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { supabase: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!p || p.role !== 'admin') return { supabase: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    return { supabase, error: null };
}

// GET all users
export async function GET() {
    const { supabase, error } = await verifyAdmin();
    if (error) return error;
    const { data } = await supabase!.from('profiles').select('*').order('created_at', { ascending: false });
    return NextResponse.json({ data });
}

// POST — create a new user (admin only)
export async function POST(request: Request) {
    const { error: authError } = await verifyAdmin();
    if (authError) return authError;

    const body = await request.json();
    const { first_name, last_name, email, role = 'applicant', password } = body;

    if (!first_name || !email || !password) {
        return NextResponse.json({ error: 'first_name, email, and password are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const full_name = `${first_name.trim()} ${(last_name || '').trim()}`.trim();

    // Create the auth user using the admin API (email auto-confirmed, no verification email)
    const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, first_name, last_name },
    });

    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

    // Upsert the profile row in case trigger hasn't fired yet
    const { error: profileError } = await adminClient.from('profiles').upsert({
        id: authUser.user.id,
        email,
        full_name,
        first_name,
        last_name: last_name || '',
        role,
    });

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    return NextResponse.json({ success: true, id: authUser.user.id });
}

// PUT — update a user profile
export async function PUT(request: Request) {
    const { supabase, error } = await verifyAdmin();
    if (error) return error;

    const body = await request.json();
    const { id, first_name, last_name, whatsapp, linkedin_url, role } = body;

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const full_name = `${(first_name || '').trim()} ${(last_name || '').trim()}`.trim();

    const { error: updateError } = await supabase!
        .from('profiles')
        .update({ first_name, last_name, full_name, whatsapp, linkedin_url, role })
        .eq('id', id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
