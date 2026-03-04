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

function StatusBadge({ status }: { status: string }) {
    return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>;
}

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || !STAFF_ROLES.includes(profile.role)) redirect('/dashboard');

    const { data: applications } = await supabase
        .from('applications')
        .select('*')
        .eq('is_deleted', false)
        .order('submitted_at', { ascending: false });

    const stats = {
        total: applications?.length || 0,
        pending: applications?.filter(a => a.status === 'pending').length || 0,
        under_review: applications?.filter(a => a.status === 'under_review').length || 0,
        interview: applications?.filter(a => a.status === 'interview_scheduled').length || 0,
        accepted: applications?.filter(a => a.status === 'accepted').length || 0,
        rejected: applications?.filter(a => a.status === 'rejected').length || 0,
    };

    return (
        <div className="page-wrapper">
            <Navbar userName={profile.full_name} role="admin" />
            <main className="container" style={{ padding: '40px 24px' }}>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Admissions Dashboard</h1>
                        <p className="page-subtitle">Review and manage all applicant submissions</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: 32 }}>
                    <div className="stat-card"><div className="stat-value">{stats.total}</div><div className="stat-label">Total Applications</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--yellow)' }}>{stats.pending}</div><div className="stat-label">Pending Review</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--blue)' }}>{stats.under_review}</div><div className="stat-label">Under Review</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--purple)' }}>{stats.interview}</div><div className="stat-label">Interview Scheduled</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--green)' }}>{stats.accepted}</div><div className="stat-label">Accepted</div></div>
                    <div className="stat-card"><div className="stat-value" style={{ color: 'var(--red)' }}>{stats.rejected}</div><div className="stat-label">Rejected</div></div>
                </div>

                {/* Table */}
                {(!applications || applications.length === 0) ? (
                    <div className="card empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3>No applications yet</h3>
                        <p>Applications will appear here once submitted by applicants.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Applicant</th>
                                    <th>Program</th>
                                    <th>Phone</th>
                                    <th>Submitted</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map(app => (
                                    <tr key={app.id}>
                                        <td>
                                            <strong>{app.full_name}</strong><br />
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.email}</span>
                                        </td>
                                        <td>{app.program}</td>
                                        <td>{app.phone}</td>
                                        <td style={{ fontSize: 13 }}>{new Date(app.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td><StatusBadge status={app.status} /></td>
                                        <td>
                                            <Link href={`/admin/application/${app.id}`} className="btn btn-secondary btn-sm">
                                                Review →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
