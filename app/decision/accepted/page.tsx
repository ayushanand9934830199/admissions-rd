import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AcceptedPage() {
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
        .eq('status', 'accepted')
        .single();

    if (!app) redirect('/dashboard');

    const firstName = (profile.first_name || profile.full_name?.split(' ')[0] || 'you').toLowerCase();

    return (
        <div className="decision-page">
            {/* Hero */}
            <section className="decision-hero">
                <div className="decision-pill">you made it!</div>
                <h1 className="decision-headline">
                    congratulations! you&apos;re in a<br />
                    <em className="decision-highlight">summer</em> to remember.
                </h1>
                <p className="decision-subtext">
                    hey {firstName}, this is the summer where you will turn pretty —<br />
                    skilled, determined &amp; unstoppable.
                </p>
                <a
                    href="https://www.restlessdreamers.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="decision-cta"
                >
                    join your clan <span className="decision-cta-arrow">→</span>
                </a>
            </section>

            {/* Stats Strip */}
            <section className="decision-stats">
                {[
                    { value: '4', label: 'WEEKS' },
                    { value: '4.0', label: 'TRACKS' },
                    { value: '100', label: 'FOLKS' },
                    { value: '1', label: 'PROJECT' },
                ].map(s => (
                    <div key={s.label} className="decision-stat">
                        <div className="decision-stat-value">{s.value}</div>
                        <div className="decision-stat-label">{s.label}</div>
                    </div>
                ))}
            </section>

            {/* What Section */}
            <section className="decision-what">
                <div className="decision-what-pill">the what?</div>
                <h2 className="decision-what-heading">
                    &amp; you are{' '}
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}>here</span>
                    {' '}for:
                </h2>
            </section>

            {/* Feature columns */}
            <section className="decision-features">
                {[
                    'self-paced learning',
                    'experiential environment',
                    'peer led collaboration',
                    'cohesive curriculum',
                ].map(f => (
                    <div key={f} className="decision-feature-col">
                        <span className="decision-feature-text">{f}</span>
                    </div>
                ))}
            </section>

            {/* Share Section */}
            <section className="decision-share">
                <div className="decision-share-content">
                    <div className="decision-share-text">
                        <h3>share the news on linkedin?</h3>
                        <p>
                            won&apos;t you want to share this with your folks? feel free to<br />
                            tag us and use the hashtag — <strong>#Restless&amp;Rising</strong>
                        </p>
                        <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://www.restlessdreamers.in')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="decision-share-btn"
                        >
                            share it <span>→</span>
                        </a>
                    </div>
                    {/* Abstract circles illustration */}
                    <div className="decision-circles" aria-hidden="true">
                        <svg width="200" height="180" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="150" cy="40" r="35" stroke="#0a0a0a" strokeWidth="1.5" fill="none" />
                            <circle cx="150" cy="40" r="20" fill="#F2AE40" />
                            <circle cx="100" cy="110" r="30" stroke="#0a0a0a" strokeWidth="1.5" fill="none" />
                            <circle cx="100" cy="110" r="17" fill="#F2AE40" />
                            <circle cx="165" cy="140" r="22" stroke="#0a0a0a" strokeWidth="1.5" fill="none" />
                            <circle cx="165" cy="140" r="12" fill="#F2AE40" />
                            <path d="M120 30 Q140 80 130 140" stroke="#0a0a0a" strokeWidth="1" fill="none" />
                            <path d="M145 55 Q170 100 155 160" stroke="#0a0a0a" strokeWidth="1" fill="none" />
                            <path d="M160 50 Q190 100 180 165" stroke="#0a0a0a" strokeWidth="1" fill="none" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Ticket Section */}
            <section className="decision-ticket-section">
                <a href="/dashboard" className="decision-ticket-btn">
                    ← back to dashboard
                </a>
                <div className="decision-ticket">
                    <div className="decision-ticket-left">
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '3px', marginBottom: 12, opacity: 0.7 }}>SUMMER PROGRAM</div>
                        <div style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 180 }}>
                            this summer,<br />i am being<br />restless<br />and rising.
                        </div>
                        <div style={{ marginTop: 16, fontSize: 11, fontWeight: 700, letterSpacing: '2px' }}>JUNE 1 – JUNE 30, 2025</div>
                    </div>
                    <div className="decision-ticket-divider" />
                    <div className="decision-ticket-right">
                        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>www.restlessdreamers.in</div>
                        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '2px', marginBottom: 4 }}>FOUNDING COHORT</div>
                        <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>2025</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
