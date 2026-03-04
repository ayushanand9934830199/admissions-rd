'use client';

import { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import NextLink from 'next/link';
import { substituteVariables } from '@/lib/email';

interface Template {
    id?: string;
    name: string;
    subject: string;
    body_html: string;
    is_default: boolean;
}

interface Props {
    template: Template;
    isNew?: boolean;
    userRole?: string;
    userName?: string;
}

const VARIABLES = [
    { key: '{{full_name}}', desc: "Applicant's full name" },
    { key: '{{first_name}}', desc: 'First name only' },
    { key: '{{last_name}}', desc: 'Last name only' },
    { key: '{{username}}', desc: 'Lowercase first name' },
    { key: '{{email}}', desc: "Applicant's email" },
    { key: '{{status}}', desc: 'New application status' },
    { key: '{{program}}', desc: 'Applied program name' },
    { key: '{{message}}', desc: 'Custom message from admin' },
];

const PREVIEW_VARS: Record<string, string> = {
    full_name: 'Ayush Sharma',
    first_name: 'Ayush',
    last_name: 'Sharma',
    username: 'ayush',
    email: 'ayush@example.com',
    status: 'accepted 🎉',
    program: 'C2: Summer Program',
    message: 'We were impressed by your application! Welcome aboard.',
};

export default function EmailTemplateEditor({ template: initialTemplate, isNew = false, userName, userRole }: Props) {
    const router = useRouter();
    const [tmpl, setTmpl] = useState<Template>(initialTemplate);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'html' | 'preview'>('editor');
    const [imageUrl, setImageUrl] = useState('');
    const [linkUrl, setLinkUrl] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Image.configure({ HTMLAttributes: { style: 'max-width: 100%; height: auto;' } }),
            Link.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: tmpl.body_html || '<p></p>',
        onUpdate({ editor }) {
            setTmpl(p => ({ ...p, body_html: editor.getHTML() }));
        },
        editorProps: {
            attributes: { class: 'tiptap-editor-content' },
        },
    });

    const insertVariable = useCallback((varKey: string) => {
        if (activeTab === 'html') {
            setTmpl(p => ({ ...p, body_html: p.body_html + varKey }));
            return;
        }
        editor?.commands.insertContent(varKey);
    }, [editor, activeTab]);

    const addImage = useCallback(() => {
        const url = imageUrl.trim();
        if (!url) return;
        editor?.chain().focus().setImage({ src: url }).run();
        setImageUrl('');
    }, [editor, imageUrl]);

    const setLink = useCallback(() => {
        const url = linkUrl.trim();
        if (!url) {
            editor?.chain().focus().unsetLink().run();
            return;
        }
        editor?.chain().focus().setLink({ href: url }).run();
        setLinkUrl('');
    }, [editor, linkUrl]);

    function getPreviewHtml() {
        return substituteVariables(tmpl.body_html, PREVIEW_VARS);
    }

    async function handleSave() {
        if (!tmpl.name.trim() || !tmpl.subject.trim() || !tmpl.body_html.trim()) {
            toast.error('all fields are required.');
            return;
        }
        setLoading(true);
        const res = await fetch('/api/email-templates', {
            method: isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tmpl),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) { toast.error(data.error || 'save failed'); return; }
        toast.success(isNew ? 'template created!' : 'template saved!');
        router.push('/admin/email-templates');
    }

    async function handleDelete() {
        if (!confirm('Delete this template? This cannot be undone.')) return;
        setDeleting(true);
        const res = await fetch('/api/email-templates', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: tmpl.id }),
        });
        setDeleting(false);
        if (res.ok) { toast.success('template deleted'); router.push('/admin/email-templates'); }
        else toast.error('delete failed');
    }

    const ToolbarBtn = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            style={{
                padding: '5px 9px',
                borderRadius: 6,
                border: '1.5px solid ' + (active ? 'var(--amber-dark)' : 'transparent'),
                background: active ? 'var(--amber-light)' : 'transparent',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: active ? 700 : 400,
                color: active ? 'var(--amber-dark)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
            }}
        >
            {children}
        </button>
    );

    return (
        <div className="page-wrapper">
            <Navbar userName={userName} role={userRole} />
            <main className="container" style={{ padding: '40px 24px', maxWidth: 1200 }}>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
                    <NextLink href="/admin" style={{ color: 'var(--amber-dark)', textDecoration: 'none' }}>dashboard</NextLink>
                    <span>/</span>
                    <NextLink href="/admin/email-templates" style={{ color: 'var(--amber-dark)', textDecoration: 'none' }}>email templates</NextLink>
                    <span>/</span>
                    <span>{isNew ? 'new' : tmpl.name}</span>
                </div>

                <div className="page-header">
                    <div>
                        <h1 className="page-title">{isNew ? 'new template' : 'edit template'}</h1>
                        <p className="page-subtitle">use <code style={{ background: 'var(--amber-light)', padding: '1px 6px', borderRadius: 4, fontSize: 13 }}>{'{{variables}}'}</code> to personalize the email</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {!isNew && (
                            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'deleting...' : '🗑 delete'}
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                            {loading ? <><span className="spinner" /> saving...</> : '💾 save template'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* Left: Settings + Editor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Settings */}
                        <div className="card">
                            <p className="detail-section-title" style={{ marginBottom: 16 }}>Template Settings</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Template Name *</label>
                                    <input type="text" className="form-input" placeholder="e.g. Decision Release" value={tmpl.name} onChange={e => setTmpl(p => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Subject *</label>
                                    <input type="text" className="form-input" placeholder="e.g. Your Admissions Decision — {{program}}" value={tmpl.subject} onChange={e => setTmpl(p => ({ ...p, subject: e.target.value }))} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input type="checkbox" id="is_default" checked={tmpl.is_default} onChange={e => setTmpl(p => ({ ...p, is_default: e.target.checked }))} style={{ accentColor: 'var(--amber-dark)', width: 16, height: 16 }} />
                                    <label htmlFor="is_default" style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>set as default template</label>
                                </div>
                            </div>
                        </div>

                        {/* Variable Picker */}
                        <div className="card">
                            <p className="detail-section-title" style={{ marginBottom: 12 }}>Click to Insert Variable</p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {VARIABLES.map(v => (
                                    <button key={v.key} className="variable-pill" onClick={() => insertVariable(v.key)} title={v.desc} type="button">
                                        {v.key}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Tab Bar */}
                            <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', padding: '0 4px' }}>
                                {(['editor', 'html', 'preview'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            padding: '12px 16px',
                                            fontSize: 13,
                                            fontWeight: activeTab === tab ? 700 : 500,
                                            color: activeTab === tab ? 'var(--amber-dark)' : 'var(--text-muted)',
                                            borderBottom: activeTab === tab ? '2px solid var(--amber-dark)' : '2px solid transparent',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textTransform: 'lowercase',
                                        }}
                                    >
                                        {tab === 'editor' ? '✏️ rich editor' : tab === 'html' ? '◇ html' : '👁 preview'}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'editor' && (
                                <>
                                    {/* Tiptap Toolbar */}
                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', background: 'var(--bg-surface)' }}>
                                        <ToolbarBtn active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold">B</ToolbarBtn>
                                        <ToolbarBtn active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic"><em>I</em></ToolbarBtn>
                                        <ToolbarBtn active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Underline"><u>U</u></ToolbarBtn>
                                        <ToolbarBtn active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()} title="Strikethrough"><s>S</s></ToolbarBtn>
                                        <span style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
                                        <ToolbarBtn active={editor?.isActive('heading', { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} title="H1">H1</ToolbarBtn>
                                        <ToolbarBtn active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="H2">H2</ToolbarBtn>
                                        <ToolbarBtn active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="H3">H3</ToolbarBtn>
                                        <span style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
                                        <ToolbarBtn active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullet list">• List</ToolbarBtn>
                                        <ToolbarBtn active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbered list">1. List</ToolbarBtn>
                                        <ToolbarBtn active={false} onClick={() => editor?.chain().focus().setTextAlign('left').run()} title="Align left">⇤</ToolbarBtn>
                                        <ToolbarBtn active={false} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Center">≡</ToolbarBtn>
                                        <span style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
                                        <ToolbarBtn active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Quote">" "</ToolbarBtn>
                                        <ToolbarBtn active={false} onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Divider">—</ToolbarBtn>
                                    </div>
                                    {/* Image + Link helpers */}
                                    <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-surface)', flexWrap: 'wrap' }}>
                                        <input
                                            type="url"
                                            placeholder="image or GIF URL..."
                                            value={imageUrl}
                                            onChange={e => setImageUrl(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addImage()}
                                            style={{ flex: 1, minWidth: 160, padding: '4px 8px', fontSize: 12, border: '1.5px solid var(--border)', borderRadius: 6, background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                                        />
                                        <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: '4px 10px' }} onClick={addImage}>🖼 insert image</button>
                                        <span style={{ width: 1, height: 20, background: 'var(--border)' }} />
                                        <input
                                            type="url"
                                            placeholder="link URL..."
                                            value={linkUrl}
                                            onChange={e => setLinkUrl(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && setLink()}
                                            style={{ flex: 1, minWidth: 120, padding: '4px 8px', fontSize: 12, border: '1.5px solid var(--border)', borderRadius: 6, background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                                        />
                                        <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: '4px 10px' }} onClick={setLink}>🔗 set link</button>
                                    </div>
                                    <div style={{ minHeight: 400, padding: 0 }}>
                                        <EditorContent editor={editor} />
                                    </div>
                                </>
                            )}
                            {activeTab === 'html' && (
                                <textarea
                                    className="template-code-editor"
                                    value={tmpl.body_html}
                                    onChange={e => {
                                        setTmpl(p => ({ ...p, body_html: e.target.value }));
                                        editor?.commands.setContent(e.target.value);
                                    }}
                                    style={{ borderRadius: 0, border: 'none', minHeight: 500 }}
                                    spellCheck={false}
                                />
                            )}
                            {activeTab === 'preview' && (
                                <div style={{ border: 'none', minHeight: 500 }}>
                                    <iframe
                                        srcDoc={getPreviewHtml()}
                                        style={{ width: '100%', minHeight: 500, border: 'none', display: 'block' }}
                                        title="email preview"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Live Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="card">
                            <p className="detail-section-title" style={{ marginBottom: 12 }}>Live Preview (sample data)</p>
                            <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--text-muted)' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>subject:</strong> {substituteVariables(tmpl.subject, PREVIEW_VARS)}
                            </div>
                            <div style={{ border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', minHeight: 500 }}>
                                <iframe
                                    srcDoc={getPreviewHtml()}
                                    style={{ width: '100%', minHeight: 500, border: 'none', display: 'block' }}
                                    title="email preview"
                                    sandbox="allow-same-origin"
                                />
                            </div>
                        </div>

                        <div className="card" style={{ background: 'var(--amber-light)', borderColor: '#f5d97a', padding: '16px 20px' }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Preview Sample Data</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                {Object.entries(PREVIEW_VARS).map(([k, v]) => (
                                    <div key={k} style={{ fontSize: 12 }}>
                                        <code style={{ color: 'var(--amber-dark)', fontWeight: 700 }}>{`{{${k}}}`}</code>
                                        <span style={{ color: 'var(--text-muted)' }}> → {v.length > 20 ? v.slice(0, 20) + '…' : v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
