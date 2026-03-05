import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TemplateForm from '../TemplateForm';

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
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

    const { data: template } = await supabase
        .from('interview_templates')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

    if (!template) redirect('/admin/interviews');

    const { data: questions } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('template_id', template.id)
        .order('order', { ascending: true });

    return (
        <div className="page-wrapper">
            <Navbar userName={profile.full_name} role={profile.role} />
            <main className="container" style={{ padding: '40px 24px' }}>
                <div className="page-header" style={{ marginBottom: 32 }}>
                    <h1 className="page-title">Edit Template</h1>
                    <p className="page-subtitle">Modify questions for {template.title}</p>
                </div>
                <TemplateForm
                    initialTemplate={{ id: template.id, title: template.title }}
                    initialQuestions={questions?.map(q => ({
                        id: q.id,
                        text: q.question_text,
                        timeLimit: q.time_limit_seconds
                    }))}
                />
            </main>
        </div>
    );
}
