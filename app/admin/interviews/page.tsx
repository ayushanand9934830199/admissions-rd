import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default async function InterviewsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'admissions_head', 'admissions_associate'].includes(profile.role)) {
        redirect('/dashboard');
    }

    const { data: templates } = await supabase
        .from('interview_templates')
        .select('*, interview_questions(count)')
        .order('created_at', { ascending: false });

    return (
        <div className="page-wrapper">
            <Navbar userName={profile.full_name} role={profile.role} />
            <main className="container" style={{ padding: '40px 24px' }}>
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 className="page-title">Video Interview Templates</h1>
                        <p className="page-subtitle">Manage questions and templates for asynchronous video interviews</p>
                    </div>
                    <Link href="/admin/interviews/new" className="btn btn-primary">
                        + New Template
                    </Link>
                </div>

                {(!templates || templates.length === 0) ? (
                    <div className="card empty-state">
                        <div className="empty-state-icon">🎥</div>
                        <h3>No templates yet</h3>
                        <p>Create an interview template to start inviting candidates.</p>
                        <Link href="/admin/interviews/new" className="btn btn-secondary" style={{ marginTop: 16 }}>
                            Create your first template
                        </Link>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Questions</th>
                                    <th>Created At</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map(tmpl => (
                                    <tr key={tmpl.id}>
                                        <td><strong>{tmpl.title}</strong></td>
                                        <td>{tmpl.interview_questions[0]?.count || 0}</td>
                                        <td style={{ fontSize: 13 }}>{new Date(tmpl.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <Link href={`/admin/interviews/${tmpl.id}`} className="btn btn-secondary btn-sm">
                                                Edit →
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
