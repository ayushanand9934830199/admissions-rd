'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface SmtpSettings {
    id: number;
    host: string;
    port: number;
    username: string;
    password: string;
    from_name: string;
    from_email: string;
    updated_at: string;
}

export default function SmtpSettingsClient({ smtp }: { smtp: SmtpSettings | null }) {
    const [form, setForm] = useState({
        host: smtp?.host || 'smtp.mailersend.net',
        port: String(smtp?.port || 587),
        username: smtp?.username || '',
        password: smtp?.password || '',
        from_name: smtp?.from_name || 'Admissions Team',
        from_email: smtp?.from_email || '',
    });
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);

    function update(field: string, value: string) {
        setForm(p => ({ ...p, [field]: value }));
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const res = await fetch('/api/smtp-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, port: Number(form.port) }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) toast.error(data.error || 'save failed');
        else toast.success('smtp settings saved!');
    }

    async function handleTest() {
        setTesting(true);
        const res = await fetch('/api/smtp-settings/test', { method: 'POST' });
        const data = await res.json();
        setTesting(false);
        if (data.ok) toast.success('✅ SMTP connection verified!');
        else toast.error(`❌ ${data.error}`);
    }

    return (
        <main className="container" style={{ padding: '40px 24px', maxWidth: 680 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
                <Link href="/admin" style={{ color: 'var(--amber-dark)', textDecoration: 'none' }}>dashboard</Link>
                <span>/</span>
                <span>smtp settings</span>
            </div>

            <div className="page-header">
                <div>
                    <h1 className="page-title">smtp settings</h1>
                    <p className="page-subtitle">configure the email server for applicant notifications</p>
                </div>
                <button className="btn btn-secondary" onClick={handleTest} disabled={testing}>
                    {testing ? <><span className="spinner" /> testing...</> : '🔌 test connection'}
                </button>
            </div>

            <div className="card">
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <p className="detail-section-title" style={{ marginBottom: 0 }}>Server Configuration</p>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">SMTP Host *</label>
                            <input type="text" className="form-input" placeholder="smtp.mailersend.net" value={form.host} onChange={e => update('host', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Port *</label>
                            <input type="number" className="form-input" placeholder="587" value={form.port} onChange={e => update('port', e.target.value)} required />
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>587 (STARTTLS) or 465 (SSL)</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">SMTP Username *</label>
                        <input type="text" className="form-input" placeholder="user@yourdomain.com" value={form.username} onChange={e => update('username', e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">SMTP Password / API Key *</label>
                        <input type="password" className="form-input" placeholder="••••••••••••••••" value={form.password} onChange={e => update('password', e.target.value)} required />
                    </div>

                    <div className="divider" />

                    <p className="detail-section-title" style={{ marginBottom: 0 }}>Sender Identity</p>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">From Name *</label>
                            <input type="text" className="form-input" placeholder="Admissions Team" value={form.from_name} onChange={e => update('from_name', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">From Email *</label>
                            <input type="email" className="form-input" placeholder="admissions@restlessdreamers.in" value={form.from_email} onChange={e => update('from_email', e.target.value)} required />
                        </div>
                    </div>

                    {smtp?.updated_at && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            last updated: {new Date(smtp.updated_at).toLocaleString('en-IN')}
                        </p>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
                        {loading ? <><span className="spinner" /> saving...</> : '💾 save settings'}
                    </button>
                </form>
            </div>
        </main>
    );
}
