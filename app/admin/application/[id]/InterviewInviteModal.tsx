'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Template {
    id: string;
    title: string;
}

interface Props {
    applicationId: string;
    applicantName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function InterviewInviteModal({ applicationId, applicantName, onClose, onSuccess }: Props) {
    const supabase = createClient();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchTemplates() {
            const { data } = await supabase.from('interview_templates').select('id, title').order('created_at', { ascending: false });
            if (data) {
                setTemplates(data);
                if (data.length > 0) setSelectedTemplate(data[0].id);
            }
        }
        fetchTemplates();
    }, [supabase]);

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedTemplate) return;

        setLoading(true);
        try {
            const res = await fetch('/api/interviews/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, templateId: selectedTemplate })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Interview invitation sent to applicant!');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to send invite');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999
        }}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{
                background: 'var(--bg-card)', padding: '32px', borderRadius: '16px',
                width: '100%', maxWidth: '500px', border: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <h2 style={{ margin: 0, fontSize: 20 }}>Invite to Video Interview</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                </div>

                <form onSubmit={handleInvite}>
                    <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 14 }}>
                        Select an interview template for <strong>{applicantName}</strong>. This will generate a unique link and email it to them instantly.
                    </p>

                    <div className="form-group">
                        <label className="form-label">Interview Template</label>
                        {templates.length === 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--amber-dark)' }}>No templates found. Please create one in the Admin Dashboard first.</p>
                        ) : (
                            <select
                                className="form-input"
                                value={selectedTemplate}
                                onChange={e => setSelectedTemplate(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select a template...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading || templates.length === 0 || !selectedTemplate}>
                            {loading ? 'Sending...' : 'Send Invite email →'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
