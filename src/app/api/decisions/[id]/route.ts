import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * DELETE /api/decisions/:id
 * Hard deletes a decision and cascaded outcome.
 * Refuse deletion if an outcome already exists (as per user security request).
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'You must be logged in to delete a decision.' },
                { status: 401 }
            );
        }

        // 2. Verify decision ownership and check if outcome exists
        const { data: decision, error: decisionError } = await supabase
            .from('decisions')
            .select('id, user_id, outcomes(id)')
            .eq('id', id)
            .single();

        if (decisionError || !decision) {
            return NextResponse.json(
                { error: 'Not Found', message: 'Decision not found.' },
                { status: 404 }
            );
        }

        if (decision.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'You do not have permission to delete this decision.' },
                { status: 403 }
            );
        }

        // 3. Prevent deletion if an outcome exists (Constitutional Immutability)
        if (decision.outcomes && (decision.outcomes as any).length > 0) {
            return NextResponse.json(
                {
                    error: 'Conflict',
                    message: 'Decisions with logged outcomes are permanently locked and cannot be deleted.'
                },
                { status: 409 }
            );
        }

        // 4. Perform Hard Delete
        const { error: deleteError } = await supabase
            .from('decisions')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json({ error: 'Database wipe failed' }, { status: 500 });
        }

        return new NextResponse(null, { status: 204 });

    } catch (err: any) {
        return NextResponse.json({ error: 'System crash' }, { status: 500 });
    }
}
