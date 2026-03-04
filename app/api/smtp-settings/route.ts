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

export async function GET() {
    const { supabase, error } = await verifyAdmin();
    if (error) return error;
    const { data } = await supabase!.from('smtp_settings').select('*').eq('id', 1).single();
    return NextResponse.json({ data });
}

export async function PUT(request: Request) {
    const { supabase, error } = await verifyAdmin();
    if (error) return error;
    const body = await request.json();
    const { host, port, username, password, from_name, from_email } = body;
    const { error: updateError } = await supabase!
        .from('smtp_settings')
        .upsert({ id: 1, host, port, username, password, from_name, from_email });
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
