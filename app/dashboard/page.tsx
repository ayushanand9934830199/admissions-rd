import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const STAFF_ROLES = ['admin', 'admissions_head', 'admissions_associate'];

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    under_review: 'Under Review',
    interview_scheduled: 'Interview Scheduled',
    accepted: 'Accepted',
    waitlisted: 'Waitlisted',
    rejected: 'Rejected',
};

const DECISION_PAGE: Record<string, string> = {
    accepted: '/decision/accepted',
    waitlisted: '/decision/waitlisted',
    rejected: '/decision/rejected',
};

const DECISION_CTA: Record<string, string> = {
    accepted: '🎉 view your offer →',
    waitlisted: '⏸ view waitlist status →',
    rejected: 'view decision →',
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`badge badge-${status}`}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile?.role && STAFF_ROLES.includes(profile.role)) redirect('/admin');

    const { data: applications } = await supabase
        .from('applications')
        .select('*')
        .eq('applicant_id', user.id)
        .eq('is_deleted', false)
        .order('submitted_at', { ascending: false });

    return (
        <div className="page-wrapper">
            <Navbar userName={profile?.full_name} role="applicant" />
            <main className="container" style={{ padding: '40px 24px' }}>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">My Applications</h1>
                        <p className="page-subtitle">Track the status of all your submitted applications</p>
                    </div>
                    <Link href="/apply" className="btn btn-primary">+ New Application</Link>
                </div>

                {(!applications || applications.length === 0) ? (
                    <div className="card empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3>No applications yet</h3>
                        <p style={{ marginBottom: 24 }}>Submit your first application to get started.</p>
                        <Link href="/apply" className="btn btn-primary">Start Application</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {applications.map(app => (
                            <div key={app.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                                        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>{app.program}</h3>
                                        <StatusBadge status={app.status} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                        <span className="text-muted" style={{ fontSize: 13 }}>📅 Submitted: {new Date(app.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        <span className="text-muted" style={{ fontSize: 13 }}>📧 {app.email}</span>
                                        <span className="text-muted" style={{ fontSize: 13 }}>📱 {app.phone}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                    {app.status === 'interview_scheduled' && (
                                        <a
                                            href="https://www.restlessdreamers.in/vid-int"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-video btn-sm"
                                        >
                                            🎥 Join Interview
                                        </a>
                                    )}
                                    {DECISION_PAGE[app.status] && (
                                        <Link
                                            href={DECISION_PAGE[app.status]}
                                            className="btn btn-primary btn-sm"
                                        >
                                            {DECISION_CTA[app.status]}
                                        </Link>
                                    )}
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        Last updated: {new Date(app.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
