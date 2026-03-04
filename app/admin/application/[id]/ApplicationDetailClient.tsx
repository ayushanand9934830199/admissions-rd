'use client';

import { useState } from 'react';
import StatusUpdateModal from '@/components/StatusUpdateModal';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
    pending: 'pending',
    under_review: 'under review',
    interview_scheduled: 'interview scheduled',
    accepted: 'accepted',
    waitlisted: 'waitlisted',
    rejected: 'rejected',
};

const DECISION_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
    accepted: { label: 'accepted', emoji: '✅', color: 'var(--green)' },
    waitlisted: { label: 'waitlisted', emoji: '⏸', color: 'var(--yellow)' },
    rejected: { label: 'rejected', emoji: '❌', color: 'var(--red)' },
};

const QUESTIONS = [
    "What's a problem in your community, country, or the world that truly bothers you? Why does it matter to you personally, and what would you do — even in a small way — to address it?",
    "Tell us about a small decision you made that ended up having a big impact on you.",
    "Tell us about a hobby, habit, or random interest that makes you lose track of time.",
];

interface Application {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    linkedin_url?: string;
    program: string;
    date_of_birth?: string;
    statement_of_purpose?: string;
    answer_1?: string;
    answer_2?: string;
    answer_3?: string;
    status: string;
    decision?: string;
    decision_notes?: string;
    decided_at?: string;
    submitted_at: string;
    updated_at: string;
}

interface StatusUpdate { id: string; old_status: string; new_status: string; message: string; sent_at: string; }
interface Template { id: string; name: string; }

interface Props {
    application: Application;
    statusHistory: StatusUpdate[];
    userRole: string;
    templates: Template[];
}

export default function ApplicationDetailClient({ application: initialApp, statusHistory: initialHistory, userRole, templates }: Props) {
    const [app, setApp] = useState(initialApp);
    const [history] = useState(initialHistory);
    const [modalOpen, setModalOpen] = useState(false);
    const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
    const [notes, setNotes] = useState(app.decision_notes || '');
    const [showNotes, setShowNotes] = useState(false);

    const isStaff = ['admin', 'admissions_head', 'admissions_associate'].includes(userRole);
    const canSendStatusUpdate = userRole === 'admin';

    async function recordDecision(decision: 'accepted' | 'waitlisted' | 'rejected') {
        if (app.decision === decision) return; // already set
        setDecisionLoading(decision);
        try {
            const res = await fetch('/api/decisions/set', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: app.id, decision, notes }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error); return; }
            setApp(prev => ({ ...prev, decision, decision_notes: notes, decided_at: new Date().toISOString() }));
            toast.success(`Decision recorded: ${decision}. Applicant will not be notified until release.`);
        } finally {
            setDecisionLoading(null);
        }
    }

    function handleSuccess(newStatus: string) {
        setApp(prev => ({ ...prev, status: newStatus }));
        toast.success(`Status updated to ${STATUS_LABELS[newStatus] || newStatus}`);
        window.location.reload();
    }

    const answers = [app.answer_1, app.answer_2, app.answer_3];
    const hasNewAnswers = answers.some(Boolean);
    const contactInfo = app.whatsapp || app.phone;

    return (
        <>
            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
                <span className={`badge badge-${app.status}`} style={{ padding: '8px 18px', fontSize: 13 }}>
                    {STATUS_LABELS[app.status] || app.status}
                </span>
                {app.decision && (
                    <span
                        className={`badge badge-${app.decision}`}
                        style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700 }}
                        title={`Decision recorded ${app.decided_at ? new Date(app.decided_at).toLocaleDateString('en-IN') : ''} — not visible to applicant yet`}
                    >
                        {DECISION_LABELS[app.decision]?.emoji} internal: {DECISION_LABELS[app.decision]?.label}
                    </span>
                )}
                <div style={{ flex: 1 }} />
                {app.status === 'interview_scheduled' && (
                    <a href="https://www.restlessdreamers.in/vid-int" target="_blank" rel="noopener noreferrer" className="btn btn-video">
                        🎥 launch video interview
                    </a>
                )}
                {canSendStatusUpdate && (
                    <button className="btn btn-secondary" onClick={() => setModalOpen(true)}>
                        📧 send status update
                    </button>
                )}
            </div>

            {/* Decision Panel — for all staff */}
            {isStaff && (
                <div className="card" style={{ marginBottom: 20, background: app.decision ? 'var(--bg-surface)' : 'var(--bg-card)', borderColor: app.decision ? DECISION_LABELS[app.decision]?.color + '55' : undefined }}>
                    <p className="detail-section-title" style={{ marginBottom: 14 }}>
                        Internal Decision
                        <span style={{ fontSize: 11, marginLeft: 8, color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>
                            — not visible to applicant until released
                        </span>
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                        {(['accepted', 'waitlisted', 'rejected'] as const).map(d => {
                            const info = DECISION_LABELS[d];
                            const isActive = app.decision === d;
                            return (
                                <button
                                    key={d}
                                    onClick={() => recordDecision(d)}
                                    disabled={!!decisionLoading}
                                    className="btn btn-sm"
                                    style={{
                                        background: isActive ? (d === 'accepted' ? 'rgba(45,122,79,0.12)' : d === 'waitlisted' ? 'rgba(160,114,10,0.12)' : 'rgba(181,37,37,0.12)') : 'transparent',
                                        color: info.color,
                                        borderColor: isActive ? info.color : 'var(--border-strong)',
                                        fontWeight: isActive ? 800 : 600,
                                    }}
                                >
                                    {decisionLoading === d ? <span className="spinner" /> : info.emoji} {info.label}
                                    {isActive && ' ✓'}
                                </button>
                            );
                        })}
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowNotes(!showNotes)}
                        >
                            📝 {showNotes ? 'hide' : 'add'} notes
                        </button>
                    </div>
                    {showNotes && (
                        <div className="form-group">
                            <label className="form-label">Internal Notes (not sent to applicant)</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Reasons for decision, observations..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                style={{ minHeight: 80 }}
                            />
                        </div>
                    )}
                    {app.decided_at && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                            Decision recorded on {new Date(app.decided_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>
            )}

            {/* Personal Info */}
            <div className="card" style={{ marginBottom: 20 }}>
                <p className="detail-section-title">Personal Information</p>
                <div className="detail-grid">
                    <div className="detail-field"><label>Full Name</label><p>{app.full_name}</p></div>
                    <div className="detail-field"><label>Email</label><p><a href={`mailto:${app.email}`} style={{ color: 'var(--amber-dark)', textDecoration: 'none' }}>{app.email}</a></p></div>
                    {contactInfo && <div className="detail-field"><label>WhatsApp / Phone</label><p>{contactInfo}</p></div>}
                    {app.linkedin_url && (
                        <div className="detail-field">
                            <label>LinkedIn</label>
                            <p><a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--amber-dark)', textDecoration: 'none' }}>view profile →</a></p>
                        </div>
                    )}
                    <div className="detail-field"><label>Program</label><p>{app.program}</p></div>
                    <div className="detail-field">
                        <label>Submitted</label>
                        <p>{new Date(app.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            {/* Essay Questions */}
            <div className="card" style={{ marginBottom: 20 }}>
                <p className="detail-section-title">Application Responses</p>
                {hasNewAnswers ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                        {QUESTIONS.map((q, i) => {
                            const ans = answers[i];
                            return (
                                <div key={i}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-dark)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                                        question {i + 1}
                                    </p>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{q}</p>
                                    {ans
                                        ? <div className="sop-box">{ans}</div>
                                        : <div className="sop-box" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>no response provided</div>}
                                </div>
                            );
                        })}
                    </div>
                ) : app.statement_of_purpose ? (
                    <div>
                        <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Statement of Purpose</label>
                        <div className="sop-box">{app.statement_of_purpose}</div>
                    </div>
                ) : (
                    <p className="text-muted" style={{ fontSize: 14 }}>No application responses found.</p>
                )}
            </div>

            {/* Status History */}
            <div className="card">
                <p className="detail-section-title" style={{ marginBottom: 20 }}>Status History</p>
                {history.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: 14 }}>no status updates yet — awaiting initial review.</p>
                ) : (
                    <div className="timeline">
                        {history.map(h => (
                            <div key={h.id} className="timeline-item">
                                <div className="timeline-dot">📋</div>
                                <div className="timeline-body">
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                                        <span className={`badge badge-${h.old_status}`} style={{ fontSize: 11 }}>{STATUS_LABELS[h.old_status] || h.old_status}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>→</span>
                                        <span className={`badge badge-${h.new_status}`} style={{ fontSize: 11 }}>{STATUS_LABELS[h.new_status] || h.new_status}</span>
                                    </div>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>{h.message}</p>
                                    <p className="timeline-meta">{new Date(h.sent_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modalOpen && (
                <StatusUpdateModal
                    applicationId={app.id}
                    applicantName={app.full_name}
                    currentStatus={app.status}
                    onClose={() => setModalOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    );
}
