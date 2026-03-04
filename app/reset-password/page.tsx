'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [ready, setReady] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        // Supabase sends code in URL for PKCE flow
        const code = searchParams.get('code');
        if (code) {
            supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
                if (error) setError('Invalid or expired reset link. Please request a new one.');
                else setReady(true);
            });
        } else {
            setReady(true);
        }
    }, [searchParams, supabase.auth]);

    async function handleReset(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

        setLoading(true);
        setError('');
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        toast.success('password updated! please sign in.');
        router.push('/login');
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-mark">🔒</div>
                    <h1 className="auth-title">set new password</h1>
                    <p className="auth-subtitle">choose a strong password for your account</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

                {!ready ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                        <span className="spinner" style={{ marginRight: 8 }} />
                        verifying your reset link...
                    </p>
                ) : (
                    <form onSubmit={handleReset} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input type="password" className="form-input" placeholder="min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input type="password" className="form-input" placeholder="repeat new password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
                            {loading ? <><span className="spinner" /> updating...</> : 'update password →'}
                        </button>
                    </form>
                )}

                <p className="auth-footer">
                    <Link href="/login">← back to sign in</Link>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="auth-page"><div className="auth-card" style={{ textAlign: 'center' }}>loading...</div></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
