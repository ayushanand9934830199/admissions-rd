import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default async function EmailTemplatesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') redirect('/dashboard');

    const { data: templates } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: true });

    return (
        <div className="page-wrapper">
            <Navbar userName={profile.full_name} role="admin" />
            <main className="container" style={{ padding: '40px 24px' }}>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">email templates</h1>
                        <p className="page-subtitle">customize the emails sent to applicants when their status changes</p>
                    </div>
                    <Link href="/admin/email-templates/new" className="btn btn-primary">+ new template</Link>
                </div>

                {/* Variables Reference */}
                <div className="card" style={{ marginBottom: 28, background: 'var(--amber-light)', borderColor: '#f5d97a' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Available Variables</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {['{{full_name}}', '{{first_name}}', '{{last_name}}', '{{username}}', '{{email}}', '{{status}}', '{{program}}', '{{message}}'].map(v => (
                            <code key={v} className="variable-pill">{v}</code>
                        ))}
                    </div>
                </div>

                {(!templates || templates.length === 0) ? (
                    <div className="card empty-state">
                        <div className="empty-state-icon">📧</div>
                        <h3>no templates yet</h3>
                        <p style={{ marginBottom: 24 }}>create your first email template to customize notifications.</p>
                        <Link href="/admin/email-templates/new" className="btn btn-primary">create template</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {templates.map(t => (
                            <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                        <strong style={{ fontSize: 15 }}>{t.name}</strong>
                                        {t.is_default && (
                                            <span style={{ background: 'var(--bg-dark)', color: 'var(--amber)', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>default</span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>subject: {t.subject}</p>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        updated {new Date(t.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <Link href={`/admin/email-templates/${t.id}`} className="btn btn-secondary btn-sm">edit →</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
