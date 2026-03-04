import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') redirect('/dashboard');

    const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="page-wrapper">
            <Navbar userName={profile.full_name} role="admin" />
            <AdminUsersClient users={users || []} currentUserId={user.id} />
        </div>
    );
}
