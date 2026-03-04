import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import EmailTemplateEditor from '@/components/EmailTemplateEditor';

export default async function EditEmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') redirect('/dashboard');

    const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();

    if (!template) notFound();

    return (
        <EmailTemplateEditor
            template={template}
            isNew={false}
            userName={profile.full_name}
            userRole="admin"
        />
    );
}
