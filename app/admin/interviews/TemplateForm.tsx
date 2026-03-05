'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function TemplateForm({
    initialTemplate,
    initialQuestions
}: {
    initialTemplate?: { id: string; title: string };
    initialQuestions?: { id?: string; text: string; timeLimit: number }[];
}) {
    const router = useRouter();
    const supabase = createClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState(initialTemplate?.title || '');
    const [questions, setQuestions] = useState(
        initialQuestions?.length
            ? initialQuestions
            : [{ text: '', timeLimit: 120 }]
    );

    const addQuestion = () => {
        setQuestions([...questions, { text: '', timeLimit: 120 }]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: 'text' | 'timeLimit', value: string | number) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value as never };
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let templateId = initialTemplate?.id;

            if (templateId) {
                const { error } = await supabase
                    .from('interview_templates')
                    .update({ title })
                    .eq('id', templateId);
                if (error) throw error;
            } else {
                const { data: template, error } = await supabase
                    .from('interview_templates')
                    .insert({ title, created_by: user.id })
                    .select()
                    .single();
                if (error) throw error;
                templateId = template.id;
            }

            // Just delete old questions and insert new ones to avoid complex diffing
            if (initialTemplate?.id) {
                await supabase.from('interview_questions').delete().eq('template_id', templateId);
            }

            // Insert Questions
            const questionsToInsert = questions.map((q, index) => ({
                template_id: templateId,
                question_text: q.text,
                time_limit_seconds: q.timeLimit,
                order: index
            }));

            const { error: questionsError } = await supabase
                .from('interview_questions')
                .insert(questionsToInsert);

            if (questionsError) throw questionsError;

            router.push('/admin/interviews');
            router.refresh();
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template. Check the console.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="title">Template Title <span>*</span></label>
                    <input
                        id="title"
                        type="text"
                        className="form-input"
                        placeholder="e.g., General Software Engineering Video Screen"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0, fontSize: 16 }}>Questions</h3>
                        <button type="button" onClick={addQuestion} className="btn btn-secondary btn-sm">
                            + Add Question
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {questions.map((q, index) => (
                            <div key={index} style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <h4 style={{ margin: 0, fontSize: 14 }}>Question {index + 1}</h4>
                                    {questions.length > 1 && (
                                        <button type="button" onClick={() => removeQuestion(index)} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Question Text</label>
                                        <textarea
                                            className="form-input"
                                            rows={2}
                                            placeholder="What is the hardest bug you've ever tracked down?"
                                            value={q.text}
                                            onChange={e => updateQuestion(index, 'text', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Time Limit (seconds)</label>
                                        <select
                                            className="form-input"
                                            value={q.timeLimit}
                                            onChange={e => updateQuestion(index, 'timeLimit', parseInt(e.target.value))}
                                        >
                                            <option value={60}>1 Minute (60s)</option>
                                            <option value={120}>2 Minutes (120s)</option>
                                            <option value={180}>3 Minutes (180s)</option>
                                            <option value={300}>5 Minutes (300s)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                    <button type="button" onClick={() => router.push('/admin/interviews')} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting || questions.some(q => !q.text.trim()) || !title.trim()}>
                        {isSubmitting ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </form>
        </div>
    );
}
