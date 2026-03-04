import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Verify admin helper
async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { supabase: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') return { supabase: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    return { supabase, error: null };
}

// POST — create new template
export async function POST(request: Request) {
    try {
        const { supabase, error } = await verifyAdmin();
        if (error) return error;

        const body = await request.json();
        const { name, subject, body_html, is_default } = body;

        if (!name || !subject || !body_html) {
            return NextResponse.json({ error: 'name, subject, and body_html are required' }, { status: 400 });
        }

        // If setting as default, unset all others
        if (is_default) {
            await supabase!.from('email_templates').update({ is_default: false }).neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const { data, error: insertError } = await supabase!
            .from('email_templates')
            .insert({ name, subject, body_html, is_default: !!is_default })
            .select()
            .single();

        if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
        return NextResponse.json({ success: true, data });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT — update existing template
export async function PUT(request: Request) {
    try {
        const { supabase, error } = await verifyAdmin();
        if (error) return error;

        const body = await request.json();
        const { id, name, subject, body_html, is_default } = body;

        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

        // If setting as default, unset all others first
        if (is_default) {
            await supabase!.from('email_templates').update({ is_default: false }).neq('id', id);
        }

        const { error: updateError } = await supabase!
            .from('email_templates')
            .update({ name, subject, body_html, is_default: !!is_default })
            .eq('id', id);

        if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE — remove a template
export async function DELETE(request: Request) {
    try {
        const { supabase, error } = await verifyAdmin();
        if (error) return error;

        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

        const { error: delError } = await supabase!.from('email_templates').delete().eq('id', id);
        if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET — list templates (for use in modals)
export async function GET() {
    try {
        const { supabase, error } = await verifyAdmin();
        if (error) return error;

        const { data, error: fetchError } = await supabase!
            .from('email_templates')
            .select('id, name, subject, is_default')
            .order('created_at', { ascending: true });

        if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
        return NextResponse.json({ data });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
