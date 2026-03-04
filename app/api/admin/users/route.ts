import { createClient } from '@/lib/supabase/server';
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
