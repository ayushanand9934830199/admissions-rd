'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const supabase = createClient();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        setLoading(false);
        if (error) {
            toast.error(error.message);
            return;
        }
        setSent(true);
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-mark">🔑</div>
                    <h1 className="auth-title">forgot password?</h1>
                    <p className="auth-subtitle">we&apos;ll send a reset link to your email</p>
                </div>

                {sent ? (
                    <div>
                        <div className="alert alert-success" style={{ marginBottom: 24 }}>
                            ✅ reset link sent! check your email inbox (and spam folder).
                        </div>
                        <Link href="/login" className="btn btn-dark btn-lg" style={{ width: '100%', textAlign: 'center' }}>
                            ← back to sign in
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                            {loading ? <><span className="spinner" /> sending...</> : 'send reset link →'}
                        </button>
                    </form>
                )}

                <p className="auth-footer" style={{ marginTop: 20 }}>
                    remembered it? <Link href="/login">sign in</Link>
                </p>
            </div>
        </div>
    );
}
