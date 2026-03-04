'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
    { value: 'under_review', label: '🔍 under review' },
    { value: 'interview_scheduled', label: '📅 interview scheduled' },
    { value: 'accepted', label: '✅ accepted' },
    { value: 'rejected', label: '❌ rejected' },
];

interface Template {
    id: string;
    name: string;
    subject: string;
    is_default: boolean;
}

interface Props {
    applicationId: string;
    applicantName: string;
    currentStatus: string;
    onClose: () => void;
    onSuccess: (newStatus: string) => void;
}

export default function StatusUpdateModal({ applicationId, applicantName, currentStatus, onClose, onSuccess }: Props) {
    const [newStatus, setNewStatus] = useState('');
    const [message, setMessage] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('/api/email-templates')
            .then(r => r.json())
            .then(d => {
                if (d.data) {
                    setTemplates(d.data);
                    const def = d.data.find((t: Template) => t.is_default);
                    if (def) setTemplateId(def.id);
                }
            })
            .catch(() => { });
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!newStatus) { toast.error('please select a new status.'); return; }
        if (!message.trim()) { toast.error('please provide a message for the applicant.'); return; }

        setLoading(true);
        const res = await fetch('/api/send-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId, newStatus, message, templateId: templateId || undefined }),
        });

        const data = await res.json();
        if (!res.ok) {
            toast.error(data.error || 'something went wrong.');
            setLoading(false);
            return;
        }

        toast.success('status updated & email sent!');
        onSuccess(newStatus);
        onClose();
    }

    return (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">send status update</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose} type="button">✕</button>
                </div>

                <div className="alert alert-info" style={{ marginBottom: 20, fontSize: 13 }}>
                    updating status for <strong>{applicantName}</strong> — an email will be sent automatically.
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">New Status *</label>
                        <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)} required>
                            <option value="">— select new status —</option>
                            {STATUS_OPTIONS.filter(o => o.value !== currentStatus).map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {templates.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Email Template</label>
                            <select className="form-select" value={templateId} onChange={e => setTemplateId(e.target.value)}>
                                <option value="">— use default template —</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} {t.is_default ? '(default)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Message to Applicant * <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(injected as <code>{'{{message}}'}</code> in template)</span></label>
                        <textarea
                            className="form-textarea"
                            placeholder="write a personalized message for the applicant..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            style={{ minHeight: 130 }}
                            required
                        />
                    </div>

                    <div className="modal-footer" style={{ marginTop: 0 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><span className="spinner" /> sending...</> : '📧 send update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
