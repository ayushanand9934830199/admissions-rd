import { createClient } from '@/lib/supabase/server';
import { sendStatusEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { applicationId, newStatus, message, templateId } = await request.json();
        if (!applicationId || !newStatus || !message) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

        const { data: app } = await supabase.from('applications').select('*').eq('id', applicationId).single();
        if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

        // Update status
        await supabase.from('applications').update({ status: newStatus }).eq('id', applicationId);

        // Log status change
        await supabase.from('status_updates').insert({
            application_id: applicationId,
            old_status: app.status,
            new_status: newStatus,
            message,
            sent_by: user.id,
        });

        // Load email template
        let templateHtml: string | undefined;
        let templateSubject: string | undefined;
        if (templateId) {
            const { data: t } = await supabase.from('email_templates').select('subject, body_html').eq('id', templateId).single();
            if (t) { templateHtml = t.body_html; templateSubject = t.subject; }
        } else {
            const { data: t } = await supabase.from('email_templates').select('subject, body_html').eq('is_default', true).single();
            if (t) { templateHtml = t.body_html; templateSubject = t.subject; }
        }

        await sendStatusEmail({
            to: app.email,
            applicantName: app.full_name,
            program: app.program,
            newStatus,
            message,
            templateHtml,
            templateSubject,
        });

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('send-status error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
