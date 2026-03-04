'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type DecisionTab = 'accepted' | 'waitlisted' | 'rejected';

interface App {
    id: string;
    full_name: string;
    email: string;
    program: string;
    status: string;
    decision: string;
    decided_at: string;
    decision_notes?: string;
}

interface Template { id: string; name: string; }
interface ReleaseEvent { id: string; scheduled_at: string; status: string; }

interface Props {
    applications: App[];
    templates: Template[];
    releaseEvent: ReleaseEvent | null;
    canRelease: boolean;
    userRole: string;
}

const DECISION_LABELS: Record<string, string> = {
    accepted: 'accepted',
    waitlisted: 'waitlisted',
    rejected: 'rejected',
};

const DECISION_COLOR: Record<string, string> = {
    accepted: 'var(--green)',
    waitlisted: 'var(--yellow)',
    rejected: 'var(--red)',
};

export default function DecisionsClient({ applications, templates, releaseEvent, canRelease }: Props) {
    const [activeTab, setActiveTab] = useState<DecisionTab>('accepted');
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [releaseLoading, setReleaseLoading] = useState(false);
    const [scheduleMode, setScheduleMode] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');
    const [templateId, setTemplateId] = useState('');

    const filtered = applications.filter(a => a.decision === activeTab);
    const counts = {
        accepted: applications.filter(a => a.decision === 'accepted').length,
        waitlisted: applications.filter(a => a.decision === 'waitlisted').length,
        rejected: applications.filter(a => a.decision === 'rejected').length,
    };

    async function handleRelease(immediate: boolean) {
        if (immediate) {
            if (!confirm(`Release decisions for ALL ${applications.length} decided applicants? This will send emails immediately.`)) return;
        }
        setReleaseLoading(true);
        try {
            const body: Record<string, unknown> = { immediate, templateId: templateId || undefined };
            if (!immediate) body.scheduled_at = scheduledAt;

            const res = await fetch('/api/decisions/release', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error); return; }
            if (immediate) {
                toast.success(`Released! ${data.released} emails sent.`);
            } else {
                toast.success('Release scheduled!');
            }
            setShowReleaseModal(false);
            window.location.reload();
        } finally {
            setReleaseLoading(false);
        }
    }

    const TABS: DecisionTab[] = ['accepted', 'waitlisted', 'rejected'];

    return (
        <>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">decisions</h1>
                    <p className="page-subtitle">internal decisions — not yet visible to applicants until released</p>
                </div>
                {canRelease && (
                    <div style={{ display: 'flex', gap: 10 }}>
                        {releaseEvent && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--amber-light)', border: '1.5px solid #f5d97a', borderRadius: 'var(--radius-pill)', fontSize: 13 }}>
                                <span>⏰</span>
                                <span style={{ fontWeight: 600 }}>
                                    Scheduled: {new Date(releaseEvent.scheduled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )}
                        <button className="btn btn-dark" onClick={() => setShowReleaseModal(true)}>
                            🚀 release decisions
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Strip */}
            <div className="stats-grid" style={{ marginBottom: 28, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {TABS.map(tab => (
                    <div key={tab} className="stat-card" style={{ cursor: 'pointer', borderColor: activeTab === tab ? DECISION_COLOR[tab] : undefined }} onClick={() => setActiveTab(tab)}>
                        <div className="stat-value" style={{ color: DECISION_COLOR[tab] }}>{counts[tab]}</div>
                        <div className="stat-label">{tab}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={activeTab === tab ? 'btn btn-dark btn-sm' : 'btn btn-ghost btn-sm'}
                    >
                        {DECISION_LABELS[tab]} ({counts[tab]})
                    </button>
                ))}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">{activeTab === 'accepted' ? '✅' : activeTab === 'waitlisted' ? '⏸' : '❌'}</div>
                    <h3>no {activeTab} decisions yet</h3>
                    <p>Go to an application and record a decision.</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Applicant</th>
                                <th>Program</th>
                                <th>Decision</th>
                                <th>Decided At</th>
                                <th>Notes</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(app => (
                                <tr key={app.id}>
                                    <td>
                                        <strong>{app.full_name}</strong><br />
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.email}</span>
                                    </td>
                                    <td>{app.program}</td>
                                    <td>
                                        <span className={`badge badge-${app.decision}`}>{DECISION_LABELS[app.decision] || app.decision}</span>
                                    </td>
                                    <td style={{ fontSize: 13 }}>
                                        {app.decided_at ? new Date(app.decided_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                    </td>
                                    <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 200 }}>
                                        {app.decision_notes ? app.decision_notes.slice(0, 60) + (app.decision_notes.length > 60 ? '…' : '') : '—'}
                                    </td>
                                    <td>
                                        <Link href={`/admin/application/${app.id}`} className="btn btn-secondary btn-sm">
                                            Review →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Release Modal */}
            {showReleaseModal && (
                <div className="modal-overlay" onClick={() => !releaseLoading && setShowReleaseModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h2 className="modal-title">🚀 release decisions</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowReleaseModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ background: 'var(--amber-light)', border: '1.5px solid #f5d97a', borderRadius: 'var(--radius-md)', padding: '14px 18px', fontSize: 14 }}>
                                <strong>⚠️ This will release decisions for {applications.length} applicant{applications.length !== 1 ? 's' : ''}:</strong>
                                <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <span className="badge badge-accepted">{counts.accepted} accepted</span>
                                    <span className="badge badge-waitlisted">{counts.waitlisted} waitlisted</span>
                                    <span className="badge badge-rejected">{counts.rejected} rejected</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Template (optional)</label>
                                <select
                                    className="form-select"
                                    value={templateId}
                                    onChange={e => setTemplateId(e.target.value)}
                                >
                                    <option value="">Default template</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                                <button
                                    className={`btn btn-sm ${!scheduleMode ? 'btn-dark' : 'btn-ghost'}`}
                                    onClick={() => setScheduleMode(false)}
                                >
                                    Release Now
                                </button>
                                <button
                                    className={`btn btn-sm ${scheduleMode ? 'btn-dark' : 'btn-ghost'}`}
                                    onClick={() => setScheduleMode(true)}
                                >
                                    Schedule
                                </button>
                            </div>

                            {scheduleMode && (
                                <div className="form-group">
                                    <label className="form-label">Release Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={scheduledAt}
                                        onChange={e => setScheduledAt(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowReleaseModal(false)} disabled={releaseLoading}>
                                cancel
                            </button>
                            {scheduleMode ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleRelease(false)}
                                    disabled={releaseLoading || !scheduledAt}
                                >
                                    {releaseLoading ? <><span className="spinner" /> scheduling...</> : '⏰ schedule release'}
                                </button>
                            ) : (
                                <button
                                    className="btn btn-dark"
                                    onClick={() => handleRelease(true)}
                                    disabled={releaseLoading}
                                >
                                    {releaseLoading ? <><span className="spinner" /> releasing...</> : '🚀 release now'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
