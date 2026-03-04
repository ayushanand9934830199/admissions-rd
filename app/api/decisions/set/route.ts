import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const STAFF_ROLES = ['admin', 'admissions_head', 'admissions_associate'];

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || !STAFF_ROLES.includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { applicationId, decision, notes } = await request.json();
        if (!applicationId || !decision) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (!['accepted', 'waitlisted', 'rejected'].includes(decision)) {
            return NextResponse.json({ error: 'Invalid decision value' }, { status: 400 });
        }

        const { error } = await supabase
            .from('applications')
            .update({
                decision,
                decision_notes: notes ?? null,
                decided_by: user.id,
                decided_at: new Date().toISOString(),
            })
            .eq('id', applicationId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
