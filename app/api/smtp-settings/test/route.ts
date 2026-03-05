import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!p || p.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: 'RESEND_API_KEY is not set' }, { status: 400 });

    try {
        // Validate the key by listing domains — a lightweight read-only call
        const resend = new Resend(apiKey);
        const { error } = await resend.domains.list();
        if (error) throw new Error(error.message);
        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ ok: false, error: message });
    }
}
