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

export default function AdminUsersClient({ users: initial, currentUserId }: { users: UserProfile[]; currentUserId: string }) {
    const [users, setUsers] = useState(initial);
    const [editing, setEditing] = useState<UserProfile | null>(null);
    const [saving, setSaving] = useState(false);

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

    const roleBadge = (role: string) => (
        <span style={{
            display: 'inline-block',
            background: role === 'admin' ? 'var(--bg-dark)' : 'var(--bg-surface)',
            color: role === 'admin' ? 'var(--amber)' : 'var(--text-muted)',
            border: `1.5px solid ${role === 'admin' ? 'var(--bg-dark)' : 'var(--border)'}`,
            borderRadius: 999, padding: '2px 12px', fontSize: 11, fontWeight: 700, textTransform: 'lowercase',
        }}>{role}</span>
    );

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

            {/* Edit Modal */}
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
                                    <option value="applicant">applicant</option>
                                    <option value="admin">admin</option>
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
