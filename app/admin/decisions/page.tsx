import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import DecisionsClient from './DecisionsClient';

const STAFF_ROLES = ['admin', 'admissions_head', 'admissions_associate'];

export default async function DecisionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || !STAFF_ROLES.includes(profile.role)) redirect('/dashboard');

    const { data: applications } = await supabase
        .from('applications')
        .select('*, decided_by_profile:profiles!decided_by(full_name)')
        .not('decision', 'is', null)
        .eq('is_deleted', false)
        .order('decided_at', { ascending: false });

    const { data: templates } = await supabase
        .from('email_templates')
        .select('id, name')
        .order('created_at', { ascending: true });

    const { data: releaseEvent } = await supabase
        .from('release_events')
        .select('*')
        .eq('status', 'scheduled')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    const canRelease = profile.role === 'admin' || profile.role === 'admissions_head';

    return (
        <div className="page-wrapper">
            <Navbar userName={profile.full_name} role={profile.role} />
            <main className="container" style={{ padding: '40px 24px' }}>
                <DecisionsClient
                    applications={applications ?? []}
                    templates={templates ?? []}
                    releaseEvent={releaseEvent ?? null}
                    canRelease={canRelease}
                    userRole={profile.role}
                />
            </main>
        </div>
    );
}
