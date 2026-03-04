'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface UserProfile {
    id: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    role: string;
    whatsapp?: string;
    linkedin_url?: string;
    created_at: string;
}

const ROLES = ['applicant', 'admin', 'admissions_head', 'admissions_associate'];

const blankCreate = { first_name: '', last_name: '', email: '', password: '', role: 'applicant' };

export default function AdminUsersClient({ users: initial, currentUserId }: { users: UserProfile[]; currentUserId: string }) {
    const [users, setUsers] = useState(initial);
    const [editing, setEditing] = useState<UserProfile | null>(null);
    const [saving, setSaving] = useState(false);

    // Create User state
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState(blankCreate);
    const [createLoading, setCreateLoading] = useState(false);

    function openEdit(u: UserProfile) { setEditing({ ...u }); }
    function closeEdit() { setEditing(null); }
    function updateField(field: string, value: string) {
        setEditing(p => p ? { ...p, [field]: value } : p);
    }

    async function handleSave() {
        if (!editing) return;
        setSaving(true);
        const res = await fetch('/api/admin/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editing),
        });
        const data = await res.json();
        setSaving(false);
        if (!res.ok) { toast.error(data.error || 'save failed'); return; }
        setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...editing } : u));
        toast.success('user updated!');
        closeEdit();
    }

    async function handleCreate() {
        if (!createForm.first_name || !createForm.email || !createForm.password) {
            toast.error('first name, email, and password are required.');
            return;
        }
        setCreateLoading(true);
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createForm),
        });
        const data = await res.json();
        setCreateLoading(false);
        if (!res.ok) { toast.error(data.error || 'failed to create user'); return; }
        toast.success('user created!');

        // Add the new user to the local list immediately
        const newUser: UserProfile = {
            id: data.id,
            full_name: `${createForm.first_name} ${createForm.last_name}`.trim(),
            first_name: createForm.first_name,
            last_name: createForm.last_name,
            email: createForm.email,
            role: createForm.role,
            created_at: new Date().toISOString(),
        };
        setUsers(prev => [newUser, ...prev]);
        setCreateForm(blankCreate);
        setCreating(false);
    }

    const roleBadge = (role: string) => {
        const colors: Record<string, { bg: string; color: string; border: string }> = {
            admin: { bg: 'var(--bg-dark)', color: 'var(--amber)', border: 'var(--bg-dark)' },
            admissions_head: { bg: '#ede8ff', color: 'var(--violet)', border: '#c4afff' },
            admissions_associate: { bg: '#ddeeff', color: 'var(--blue)', border: '#a0c4f0' },
            applicant: { bg: 'var(--bg-surface)', color: 'var(--text-muted)', border: 'var(--border)' },
        };
        const s = colors[role] || colors.applicant;
        return (
            <span style={{
                display: 'inline-block', background: s.bg, color: s.color,
                border: `1.5px solid ${s.border}`, borderRadius: 999,
                padding: '2px 12px', fontSize: 11, fontWeight: 700, textTransform: 'lowercase',
            }}>{role.replace('_', ' ')}</span>
        );
    };

    return (
        <main className="container" style={{ padding: '40px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: 'var(--text-muted)' }}>
                <Link href="/admin" style={{ color: 'var(--amber-dark)', textDecoration: 'none' }}>dashboard</Link>
                <span>/</span>
                <span>users</span>
            </div>

            <div className="page-header">
                <div>
                    <h1 className="page-title">users ({users.length})</h1>
                    <p className="page-subtitle">manage applicant and admin accounts</p>
                </div>
                <button className="btn btn-primary" onClick={() => setCreating(true)}>
                    + add user
                </button>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>WhatsApp</th>
                            <th>LinkedIn</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td><strong>{u.full_name}</strong></td>
                                <td style={{ fontSize: 13 }}>{u.email}</td>
                                <td style={{ fontSize: 13 }}>{u.whatsapp || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                <td style={{ fontSize: 13 }}>
                                    {u.linkedin_url
                                        ? <a href={u.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--amber-dark)' }}>profile</a>
                                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </td>
                                <td>{roleBadge(u.role)}</td>
                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td>
                                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Create User Modal ── */}
            {creating && (
                <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setCreating(false); setCreateForm(blankCreate); } }}>
                    <div className="modal-content" style={{ maxWidth: 540 }}>
                        <div className="modal-header">
                            <h2 className="modal-title">add new user</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setCreating(false); setCreateForm(blankCreate); }}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">First Name *</label>
                                    <input type="text" className="form-input" placeholder="Jane" value={createForm.first_name} onChange={e => setCreateForm(p => ({ ...p, first_name: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input type="text" className="form-input" placeholder="Doe" value={createForm.last_name} onChange={e => setCreateForm(p => ({ ...p, last_name: e.target.value }))} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address *</label>
                                <input type="email" className="form-input" placeholder="jane@example.com" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Temporary Password *</label>
                                <input type="password" className="form-input" placeholder="min. 8 characters" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>the user can change this after logging in.</span>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select className="form-select" value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}>
                                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => { setCreating(false); setCreateForm(blankCreate); }}>cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={createLoading}>
                                {createLoading ? <><span className="spinner" /> creating...</> : '+ create user'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit User Modal ── */}
            {editing && (
                <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeEdit(); }}>
                    <div className="modal-content" style={{ maxWidth: 580 }}>
                        <div className="modal-header">
                            <h2 className="modal-title">edit user</h2>
                            <button className="btn btn-ghost btn-icon" onClick={closeEdit}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input type="text" className="form-input" value={editing.first_name || ''} onChange={e => updateField('first_name', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input type="text" className="form-input" value={editing.last_name || ''} onChange={e => updateField('last_name', e.target.value)} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" value={editing.email} disabled style={{ opacity: 0.6 }} />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>email cannot be changed here — use Supabase dashboard</span>
                            </div>

                            <div className="form-group">
                                <label className="form-label">WhatsApp Number</label>
                                <input type="tel" className="form-input" value={editing.whatsapp || ''} onChange={e => updateField('whatsapp', e.target.value)} placeholder="+91 98765 43210" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">LinkedIn URL</label>
                                <input type="url" className="form-input" value={editing.linkedin_url || ''} onChange={e => updateField('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select className="form-select" value={editing.role} onChange={e => updateField('role', e.target.value)}>
                                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                                </select>
                                {editing.id === currentUserId && (
                                    <span style={{ fontSize: 11, color: 'var(--red)' }}>⚠ changing your own role to applicant will lock you out of admin</span>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeEdit}>cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? <><span className="spinner" /> saving...</> : 'save changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
