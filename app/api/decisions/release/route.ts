import { createClient } from '@/lib/supabase/server';
import { sendStatusEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

const RELEASE_ROLES = ['admin', 'admissions_head'];

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || !RELEASE_ROLES.includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden — only admissions head can release decisions' }, { status: 403 });
        }

        const { immediate, scheduled_at, templateId } = await request.json();

        if (!immediate) {
            // Schedule a release event
            if (!scheduled_at) return NextResponse.json({ error: 'scheduled_at required' }, { status: 400 });
            const { data: existing } = await supabase
                .from('release_events')
                .select('id')
                .eq('status', 'scheduled')
                .single();

            if (existing) {
                await supabase.from('release_events').update({
                    scheduled_at,
                    email_template_id: templateId ?? null,
                }).eq('id', existing.id);
            } else {
                await supabase.from('release_events').insert({
                    scheduled_at,
                    created_by: user.id,
                    email_template_id: templateId ?? null,
                    status: 'scheduled',
                });
            }
            return NextResponse.json({ success: true, scheduled: true });
        }

        // Immediate release: update status for all decided applications and send emails
        const { data: apps } = await supabase
            .from('applications')
            .select('*')
            .not('decision', 'is', null)
            .eq('is_deleted', false);

        if (!apps || apps.length === 0) {
            return NextResponse.json({ success: true, released: 0 });
        }

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

        // Load SMTP
        const { data: smtp } = await supabase.from('smtp_settings').select('*').eq('id', 1).single();

        let released = 0;
        const errors: string[] = [];

        for (const app of apps) {
            try {
                // Update public status to match decision
                await supabase.from('applications').update({
                    status: app.decision,
                    updated_at: new Date().toISOString(),
                }).eq('id', app.id);

                // Log status change
                await supabase.from('status_updates').insert({
                    application_id: app.id,
                    old_status: app.status,
                    new_status: app.decision,
                    message: `Decision released: ${app.decision}`,
                    sent_by: user.id,
                });

                // Send email only for accepted applicants (or all if you want)
                const message = app.decision === 'accepted'
                    ? "Congratulations! We're thrilled to welcome you to the C2: Summer Program 2025."
                    : app.decision === 'waitlisted'
                        ? "Thank you for applying. You've been placed on our waitlist — we'll be in touch soon."
                        : "Thank you for applying. After careful consideration, we're unable to offer you a spot this cycle.";

                await sendStatusEmail({
                    to: app.email,
                    applicantName: app.full_name,
                    program: app.program,
                    newStatus: app.decision,
                    message,
                    templateHtml,
                    templateSubject,
                    smtp: smtp ?? undefined,
                });

                released++;
            } catch (e) {
                errors.push(`${app.email}: ${e instanceof Error ? e.message : 'failed'}`);
            }
        }

        // Mark release event as done
        await supabase.from('release_events').update({
            status: 'released',
            released_at: new Date().toISOString(),
        }).eq('status', 'scheduled');

        // Also create a released record if no scheduled one existed
        await supabase.from('release_events').insert({
            scheduled_at: new Date().toISOString(),
            released_at: new Date().toISOString(),
            created_by: user.id,
            email_template_id: templateId ?? null,
            status: 'released',
        });

        return NextResponse.json({ success: true, released, errors });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
