import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function WaitlistedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const STAFF_ROLES = ['admin', 'admissions_head', 'admissions_associate'];
    if (!profile || STAFF_ROLES.includes(profile.role)) redirect('/admin');

    const { data: app } = await supabase
        .from('applications')
        .select('status, full_name, program')
        .eq('applicant_id', user.id)
        .eq('status', 'waitlisted')
        .single();

    if (!app) redirect('/dashboard');

    const firstName = (profile.first_name || profile.full_name?.split(' ')[0] || 'you').toLowerCase();

    return (
        <div className="decision-page decision-page-waitlist">
            <section className="decision-hero">
                <div className="decision-pill decision-pill-waitlist">hold tight.</div>
                <h1 className="decision-headline">
                    {firstName}, you&apos;re on<br />
                    <em className="decision-highlight decision-highlight-waitlist">the waitlist.</em>
                </h1>
                <p className="decision-subtext">
                    we loved your application. our cohort capacity is limited,<br />
                    and we&apos;re reviewing every application carefully.<br />
                    you&apos;ll hear from us soon — stay close.
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                    <Link href="/dashboard" className="decision-cta decision-cta-dark">
                        check your dashboard <span>→</span>
                    </Link>
                </div>
            </section>

            <section className="decision-stats">
                {[
                    { value: '🕐', label: 'Status' },
                    { value: 'WL', label: 'Waitlisted' },
                    { value: '📩', label: 'Watch Email' },
                    { value: '💪', label: 'Keep Going' },
                ].map(s => (
                    <div key={s.label} className="decision-stat">
                        <div className="decision-stat-value">{s.value}</div>
                        <div className="decision-stat-label">{s.label}</div>
                    </div>
                ))}
            </section>

            <section style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
                <div className="card" style={{ padding: '40px 32px' }}>
                    <h2 style={{ fontSize: '1.3rem', marginBottom: 16, textTransform: 'lowercase' }}>what happens next?</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
                        {[
                            { step: '01', text: 'We will notify you by email the moment a spot opens up.' },
                            { step: '02', text: 'In the meantime, keep working on your projects and ideas.' },
                            { step: '03', text: 'Check your dashboard for any status updates.' },
                        ].map(item => (
                            <div key={item.step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--amber-dark)', letterSpacing: '2px', paddingTop: 2 }}>{item.step}</span>
                                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
