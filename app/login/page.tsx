'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }
        toast.success('welcome back!');
        // Hard redirect so the server gets a fresh request with auth cookies set,
        // allowing the root page to correctly read the role and send admins to /admin.
        window.location.href = '/';
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-mark">🎓</div>
                    <h1 className="auth-title">welcome back</h1>
                    <p className="auth-subtitle">sign in to your admissions account</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

                <form onSubmit={handleLogin} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                        <div style={{ textAlign: 'right', marginTop: 2 }}>
                            <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--amber-dark)', fontWeight: 600, textDecoration: 'none' }}>
                                forgot password?
                            </Link>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 4, width: '100%' }}>
                        {loading ? <><span className="spinner" /> signing in...</> : 'sign in →'}
                    </button>
                </form>

                <p className="auth-footer">
                    don&apos;t have an account? <Link href="/register">create one</Link>
                </p>
            </div>
        </div>
    );
}
