import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TemplateForm from '../TemplateForm';

export default async function NewTemplatePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'admissions_head', 'admissions_associate'].includes(profile.role)) {
        redirect('/dashboard');
    }

    return (
        <div className="page-wrapper">
            <Navbar userName={profile.full_name} role={profile.role} />
            <main className="container" style={{ padding: '40px 24px' }}>
                <div className="page-header" style={{ marginBottom: 32 }}>
                    <h1 className="page-title">Create Template</h1>
                    <p className="page-subtitle">Add questions to your new video interview template</p>
                </div>
                <TemplateForm />
            </main>
        </div>
    );
}
