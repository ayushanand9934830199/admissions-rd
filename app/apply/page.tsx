'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';

const PROGRAM = 'C2: Summer Program';

const QUESTIONS = [
    {
        id: 'answer_1',
        label: 'Question 1',
        text: "What's a problem in your community, country, or the world that truly bothers you? Why does it matter to you personally, and what would you do — even in a small way — to address it?",
        placeholder: 'Tell us about the problem and your perspective on it...',
        min: 150,
    },
    {
        id: 'answer_2',
        label: 'Question 2',
        text: "Tell us about a small decision you made that ended up having a big impact on you.",
        placeholder: 'Describe the decision and the impact it had...',
        min: 100,
    },
    {
        id: 'answer_3',
        label: 'Question 3',
        text: "Tell us about a hobby, habit, or random interest that makes you lose track of time.",
        placeholder: "What is it and why does it captivate you?",
        min: 80,
    },
];

// Create the client once — outside or via ref — to avoid re-creation on every render
// which would cause an infinite useEffect loop.
export default function ApplyPage() {
    const router = useRouter();
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const [profile, setProfile] = useState<{ full_name: string; email: string; whatsapp?: string; linkedin_url?: string; id: string } | null>(null);
    const [form, setForm] = useState({ answer_1: '', answer_2: '', answer_3: '' });
    const [loading, setLoading] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (p) setProfile({ ...p, id: user.id });
            // Check if already applied
            const { data: apps } = await supabase.from('applications').select('id').eq('applicant_id', user.id);
            if (apps && apps.length > 0) setHasApplied(true);
        }
        load();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    function update(field: string, value: string) {
        setForm(p => ({ ...p, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        for (const q of QUESTIONS) {
            const val = form[q.id as keyof typeof form];
            if (val.trim().length < q.min) {
                toast.error(`${q.label} must be at least ${q.min} characters.`);
                return;
            }
        }
        setLoading(true);
        const { error } = await supabase.from('applications').insert({
            applicant_id: profile!.id,
            full_name: profile!.full_name,
            email: profile!.email,
            phone: profile!.whatsapp || '',
            whatsapp: profile!.whatsapp || '',
            linkedin_url: profile!.linkedin_url || '',
            program: PROGRAM,
            date_of_birth: null,
            statement_of_purpose: null,
            answer_1: form.answer_1,
            answer_2: form.answer_2,
            answer_3: form.answer_3,
            status: 'pending',
        });
        setLoading(false);
        if (error) { toast.error(error.message); return; }
        toast.success('application submitted!');
        router.push('/dashboard');
    }

    if (!profile) {
        return <div className="page-wrapper"><div className="empty-state" style={{ paddingTop: 80 }}><span className="spinner" /></div></div>;
    }

    return (
        <div className="page-wrapper">
            <Navbar userName={profile.full_name} role="applicant" />
            <main className="container" style={{ padding: '40px 24px', maxWidth: 760 }}>
                {/* Program Header */}
                <div className="card" style={{ marginBottom: 28, background: 'var(--amber-light)', borderColor: '#f5d97a', padding: '28px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ fontSize: 36 }}>🌟</div>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, textTransform: 'lowercase' }}>{PROGRAM}</h1>
                            <p style={{ color: 'var(--yellow)', fontWeight: 600, margin: '4px 0 0', fontSize: 14 }}>restless dreamers · 2025 cohort</p>
                        </div>
                    </div>
                </div>

                {hasApplied ? (
                    <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                        <h2 style={{ textTransform: 'lowercase', marginBottom: 10 }}>application submitted!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>you have already applied for {PROGRAM}. track your status on the dashboard.</p>
                        <a href="/dashboard" className="btn btn-primary">go to dashboard →</a>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                            answer all three questions thoughtfully. there are no right or wrong answers — we want to understand who you really are.
                        </p>

                        {QUESTIONS.map((q, idx) => {
                            const val = form[q.id as keyof typeof form];
                            return (
                                <div key={q.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-dark)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                                            question {idx + 1} of {QUESTIONS.length}
                                        </p>
                                        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{q.text}</p>
                                    </div>
                                    <div className="form-group">
                                        <textarea
                                            className="form-textarea"
                                            placeholder={q.placeholder}
                                            value={val}
                                            onChange={e => update(q.id, e.target.value)}
                                            style={{ minHeight: 160 }}
                                            required
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                                            <span style={{ fontSize: 12, color: val.length < q.min ? 'var(--red)' : 'var(--text-muted)' }}>
                                                {val.length} / {q.min} min chars
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ alignSelf: 'flex-end' }}>
                            {loading ? <><span className="spinner" /> submitting...</> : 'submit application →'}
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
}
