import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function RejectedPage() {
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
        .eq('status', 'rejected')
        .single();

    if (!app) redirect('/dashboard');

    const firstName = (profile.first_name || profile.full_name?.split(' ')[0] || 'you').toLowerCase();

    return (
        <div className="decision-page decision-page-rejected">
            <section className="decision-hero">
                <div className="decision-pill decision-pill-rejected">not this time.</div>
                <h1 className="decision-headline" style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}>
                    {firstName}, keep<br />
                    <em className="decision-highlight decision-highlight-rejected">dreaming loud.</em>
                </h1>
                <p className="decision-subtext">
                    we reviewed your application with care.<br />
                    this cycle wasn&apos;t the right fit — but that&apos;s not the end of your story.<br />
                    every no is practice for the most important yes.
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                    <Link href="https://www.restlessdreamers.in" target="_blank" rel="noopener noreferrer" className="decision-cta decision-cta-dark">
                        explore what we do <span>→</span>
                    </Link>
                    <Link href="/dashboard" className="decision-cta" style={{ background: 'transparent', border: '2px solid var(--text-primary)' }}>
                        back to dashboard
                    </Link>
                </div>
            </section>

            <section style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px', textAlign: 'center' }}>
                <div className="card" style={{ padding: '40px 32px' }}>
                    <div style={{ fontSize: 36, marginBottom: 16 }}>💌</div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: 16, textTransform: 'lowercase' }}>a note from us</h2>
                    <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 24 }}>
                        competition was fierce and seats were scarce. please know this reflects the cohort constraints, not the depth of your potential. we genuinely hope to see you apply again next cycle — and we mean that.
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        — the restless dreamers admissions team
                    </p>
                </div>
            </section>
        </div>
    );
}
