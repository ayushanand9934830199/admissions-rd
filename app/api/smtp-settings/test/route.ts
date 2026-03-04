import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!p || p.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: smtp } = await supabase.from('smtp_settings').select('*').eq('id', 1).single();
    if (!smtp) return NextResponse.json({ error: 'No SMTP settings found' }, { status: 400 });

    const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,
        requireTLS: smtp.port === 587,
        auth: { user: smtp.username, pass: smtp.password },
    });

    try {
        await transporter.verify();
        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ ok: false, error: message });
    }
}
