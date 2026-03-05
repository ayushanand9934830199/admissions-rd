'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface NavbarProps {
    userName?: string;
    role?: string;
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'admin',
    admissions_head: 'head',
    admissions_associate: 'associate',
};

export default function Navbar({ userName, role }: NavbarProps) {
    const router = useRouter();
    const supabase = createClient();

    async function handleLogout() {
        await supabase.auth.signOut();
        toast.success('signed out.');
        window.location.href = '/login';
    }

    const isStaff = role === 'admin' || role === 'admissions_head' || role === 'admissions_associate';
    const homeHref = isStaff ? '/admin' : '/dashboard';

    return (
        <nav className="navbar">
            <Link href={homeHref} className="navbar-logo">
                restless <span>dreamers</span> · admissions
            </Link>
            <div className="navbar-actions">
                {role === 'applicant' && (
                    <Link href="/apply" className="btn btn-primary btn-sm">+ apply</Link>
                )}
                {isStaff && (
                    <>
                        <Link href="/admin/decisions" className="btn btn-ghost btn-sm">🏛 decisions</Link>
                        {(role === 'admin' || role === 'admissions_head') && (
                            <>
                                <Link href="/admin/email-templates" className="btn btn-ghost btn-sm">📧 emails</Link>
                                <Link href="/admin/interviews" className="btn btn-ghost btn-sm">🎥 interviews</Link>
                            </>
                        )}
                        {role === 'admin' && (
                            <>
                                <Link href="/admin/users" className="btn btn-ghost btn-sm">👥 users</Link>
                                <Link href="/admin/settings" className="btn btn-ghost btn-sm">⚙️ settings</Link>
                            </>
                        )}
                        <span className="admin-badge">{ROLE_LABELS[role] || role}</span>
                    </>
                )}
                {userName && (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{userName}</span>
                )}
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">sign out</button>
            </div>
        </nav>
    );
}
