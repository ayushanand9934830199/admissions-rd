'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '', whatsapp: '',
        linkedin_url: '', password: '', confirm_password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    function update(field: string, value: string) {
        setForm(p => ({ ...p, [field]: value }));
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return; }
        if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (!form.whatsapp.trim()) { setError('WhatsApp Number is required.'); return; }
        if (!form.linkedin_url.trim()) { setError('LinkedIn Profile URL is required.'); return; }
        setLoading(true);

        const full_name = `${form.first_name.trim()} ${form.last_name.trim()}`.trim();

        const { error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: {
                    full_name,
                    first_name: form.first_name.trim(),
                    last_name: form.last_name.trim(),
                    whatsapp: form.whatsapp.trim(),
                    linkedin_url: form.linkedin_url.trim(),
                },
            },
        });

        if (error) { setError(error.message); setLoading(false); return; }

        toast.success('account created! check your email to confirm, or sign in directly.');
        router.push('/login');
    }

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: 500 }}>
                <div className="auth-logo">
                    <div className="auth-logo-mark">✨</div>
                    <h1 className="auth-title">create account</h1>
                    <p className="auth-subtitle">join the restless dreamers admissions portal</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

                <form onSubmit={handleRegister} className="auth-form">
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">First Name *</label>
                            <input type="text" className="form-input" placeholder="Ayush" value={form.first_name} onChange={e => update('first_name', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name *</label>
                            <input type="text" className="form-input" placeholder="Anand" value={form.last_name} onChange={e => update('last_name', e.target.value)} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">WhatsApp Number *</label>
                        <input type="tel" className="form-input" placeholder="+91 98765 43210" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">LinkedIn Profile URL *</label>
                        <input type="url" className="form-input" placeholder="https://linkedin.com/in/yourname" value={form.linkedin_url} onChange={e => update('linkedin_url', e.target.value)} required />
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Password *</label>
                            <input type="password" className="form-input" placeholder="min. 8 chars" value={form.password} onChange={e => update('password', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password *</label>
                            <input type="password" className="form-input" placeholder="repeat password" value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)} required />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
                        {loading ? <><span className="spinner" /> creating account...</> : 'create account →'}
                    </button>
                </form>

                <p className="auth-footer">
                    already have an account? <Link href="/login">sign in</Link>
                </p>
            </div>
        </div>
    );
}
