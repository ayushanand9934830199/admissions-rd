import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import InterviewRecorder from './InterviewRecorder';

export default async function InterviewPortalPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect(`/login?returnTo=/interview/${id}`);
    }

    // 2. Get the invitation details. 
    const { data: invitation } = await supabase
        .from('interview_invitations')
        .select(`
            *,
            applications (
                applicant_id,
                full_name,
                program
            )
        `)
        .eq('id', id)
        .single();

    if (!invitation) notFound();

    const apps: any = invitation.applications;
    const application = Array.isArray(apps) ? apps[0] : apps;

    // 3. Ensure the user is the applicant who owns this invitation
    // Or an admin/staff (for previewing)
    if (application.applicant_id !== user.id) {
        // Check if user is admin
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || !['admin', 'admissions_head', 'admissions_associate'].includes(profile.role)) {
            return (
                <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                    <div className="card" style={{ maxWidth: 500, textAlign: 'center', padding: 32 }}>
                        <p>Unauthorized: This interview link is not assigned to your account.</p>
                    </div>
                </div>
            );
        }
    }

    if (invitation.status === 'completed') {
        return (
            <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#E8E6D9' }}>
                <div className="card" style={{ maxWidth: 500, textAlign: 'center', padding: '48px 32px' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                    <h1 style={{ fontSize: 24, marginBottom: 12 }}>Interview Completed</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>You have already submitted your video responses for this interview. The admissions team will review them shortly.</p>
                </div>
            </div>
        );
    }

    // Load the template and questions
    const { data: template } = await supabase
        .from('interview_templates')
        .select('*')
        .eq('id', invitation.template_id)
        .single();

    const { data: questions } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('template_id', invitation.template_id)
        .order('order', { ascending: true });

    if (!template || !questions || questions.length === 0) {
        return (
            <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="card" style={{ maxWidth: 500, textAlign: 'center', padding: 32 }}>
                    <p>Error: Interview template is not configured properly. Please contact support.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
            <main className="container" style={{ padding: '40px 24px', maxWidth: 1000 }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: 24, marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 28, margin: 0, fontWeight: 700, color: '#F2AE40' }}>restless dreamers</h1>
                        <p style={{ margin: '8px 0 0', opacity: 0.7, fontSize: 14 }}>admissions interview</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>{application?.full_name}</p>
                        <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: 13 }}>{application?.program}</p>
                    </div>
                </header>

                <InterviewRecorder
                    invitationId={invitation.id}
                    questions={questions.map(q => ({
                        id: q.id,
                        text: q.question_text,
                        timeLimit: q.time_limit_seconds
                    }))}
                />
            </main>
        </div>
    );
}
