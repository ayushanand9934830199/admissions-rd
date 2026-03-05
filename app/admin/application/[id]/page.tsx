import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ApplicationDetailClient from './ApplicationDetailClient';

const STAFF_ROLES = ['admin', 'admissions_head', 'admissions_associate'];

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !STAFF_ROLES.includes(profile.role)) redirect('/dashboard');

    const { data: application } = await supabase.from('applications').select('*').eq('id', id).single();
    if (!application) notFound();

    const { data: statusHistory } = await supabase
        .from('status_updates')
        .select('*')
        .eq('application_id', id)
        .order('sent_at', { ascending: false });

    const { data: templates } = await supabase
        .from('email_templates')
        .select('id, name')
        .order('created_at', { ascending: true });

    const { data: invitations } = await supabase
        .from('interview_invitations')
        .select(`
            *,
            interview_templates (
                title
            ),
            video_submissions (
                *,
                interview_questions (
                    question_text,
                    order
                ),
                interview_feedback (
                    *
                )
            )
        `)
        .eq('application_id', id)
        .order('invited_at', { ascending: false });

    return (
        <div className="page-wrapper">
            <Navbar userName={profile.full_name} role={profile.role} />
            <main className="container" style={{ padding: '40px 24px', maxWidth: 860 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
                    <Link href="/admin" style={{ color: 'var(--amber-dark)', textDecoration: 'none' }}>← All Applications</Link>
                    <span>/</span>
                    <span>{application.full_name}</span>
                </div>

                <div className="page-header" style={{ marginBottom: 8 }}>
                    <div>
                        <h1 className="page-title" style={{ fontSize: '1.8rem' }}>{application.full_name}</h1>
                        <p className="page-subtitle">{application.program}</p>
                    </div>
                </div>

                <ApplicationDetailClient
                    application={application}
                    statusHistory={statusHistory || []}
                    userRole={profile.role}
                    templates={templates || []}
                    invitations={invitations || []}
                />
            </main>
        </div>
    );
}
