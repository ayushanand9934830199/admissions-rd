'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Invitation } from './ApplicationDetailClient';

interface Props {
    invitations: Invitation[];
    userRole: string;
}

export default function InterviewReviewSection({ invitations, userRole }: Props) {
    const supabase = createClient();
    const [refreshing, setRefreshing] = useState(false);

    // We only care about the most recent invitation that has submissions, or just show the latest
    const latestInvitation = invitations[0];

    if (!latestInvitation) return null; // No invites sent

    const isStaff = ['admin', 'admissions_head', 'admissions_associate'].includes(userRole);

    async function submitFeedback(submissionId: string, text: string, rating: number) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const res = await fetch('/api/interviews/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, text, rating, reviewerId: user.id })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to submit feedback');
            }

            toast.success('Feedback saved successfully!');
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    return (
        <div className="card" style={{ marginBottom: 20 }}>
            <p className="detail-section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Video Interview Responses
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
                    Template: {latestInvitation.interview_templates?.title}
                </span>
            </p>

            {latestInvitation.status === 'pending' ? (
                <p className="text-muted" style={{ fontSize: 14 }}>
                    Invitation sent on {new Date(latestInvitation.invited_at).toLocaleDateString()}. Waiting for applicant to complete the interview.
                </p>
            ) : latestInvitation.video_submissions?.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 14 }}>
                    Interview marked as completed, but no videos were found.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {latestInvitation.video_submissions
                        .sort((a, b) => a.interview_questions.order - b.interview_questions.order)
                        .map((sub, idx) => (
                            <div key={sub.id} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-dark)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                                        question {idx + 1}
                                    </p>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        {sub.interview_questions.question_text}
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) 1fr', gap: 0 }}>
                                    <div style={{ background: '#000', borderRight: '1px solid var(--border)' }}>
                                        {sub.drive_file_url ? (
                                            <iframe
                                                src={sub.drive_file_url.replace('/view', '/preview')}
                                                width="100%"
                                                height="320"
                                                allow="autoplay"
                                                style={{ border: 'none', display: 'block' }}
                                            />
                                        ) : (
                                            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                                Video still processing on Google Drive...
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: 20, background: 'var(--bg-card)' }}>
                                        <FeedbackSection
                                            submissionId={sub.id}
                                            feedback={sub.interview_feedback}
                                            isStaff={isStaff}
                                            onSubmit={submitFeedback}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}

function FeedbackSection({ submissionId, feedback, isStaff, onSubmit }: { submissionId: string, feedback: any[], isStaff: boolean, onSubmit: (id: string, text: string, rating: number) => void }) {
    const [text, setText] = useState('');
    const [rating, setRating] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!text || rating === 0) return toast.error('Please enter feedback and a rating (1-5)');
        setLoading(true);
        await onSubmit(submissionId, text, rating);
        setLoading(false);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Reviewer Feedback</h4>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feedback.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No feedback submitted yet.</p>
                ) : (
                    feedback.map(f => (
                        <div key={f.id} style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, color: 'var(--amber-dark)' }}>Rating: {f.rating}/5</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(f.created_at).toLocaleDateString()}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{f.feedback_text}</p>
                        </div>
                    ))
                )}
            </div>

            {isStaff && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        {[1, 2, 3, 4, 5].map(r => (
                            <button
                                key={r}
                                onClick={() => setRating(r)}
                                style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    border: `1px solid ${rating >= r ? 'var(--amber-dark)' : 'var(--border-strong)'}`,
                                    background: rating >= r ? 'var(--amber-dark)' : 'transparent',
                                    color: rating >= r ? '#fff' : 'var(--text-secondary)',
                                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="form-textarea"
                        placeholder="Leave your evaluation here..."
                        style={{ minHeight: 80, marginBottom: 12, fontSize: 13 }}
                        value={text}
                        onChange={e => setText(e.target.value)}
                    />
                    <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                        onClick={handleSubmit}
                        disabled={loading || !text || rating === 0}
                    >
                        {loading ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                </div>
            )}
        </div>
    );
}
