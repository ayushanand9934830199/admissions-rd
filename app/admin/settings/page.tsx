import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SmtpSettingsClient from './SmtpSettingsClient';

export default async function SmtpSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') redirect('/dashboard');

    const { data: smtp } = await supabase
        .from('smtp_settings')
        .select('*')
        .eq('id', 1)
        .single();

    return (
        <div className="page-wrapper">
            <Navbar userName={profile.full_name} role={profile.role} />
            <SmtpSettingsClient smtp={smtp} />
        </div>
    );
}
