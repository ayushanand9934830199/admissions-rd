import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { submissionId, text, rating, reviewerId } = await req.json();

        if (!submissionId || !text || !rating || !reviewerId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.id !== reviewerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Must be staff
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || !['admin', 'admissions_head', 'admissions_associate'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: feedback, error } = await supabase
            .from('interview_feedback')
            .insert({
                submission_id: submissionId,
                reviewer_id: reviewerId,
                feedback_text: text,
                rating: rating
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, feedback });
    } catch (error: any) {
        console.error('Feedback Error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
