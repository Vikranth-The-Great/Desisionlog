import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * POST /api/outcomes
 * Logs the outcome for an existing decision.
 * Strictly follows gemini.md contract.
 */
export async function POST(request: Request) {
    try {
        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'You must be logged in to log an outcome.' },
                { status: 401 }
            );
        }

        // 2. Parse and Validate Input
        const body = await request.json();
        const {
            decision_id,
            result,
            impact_score,
            lessons_learned,
            was_correct_choice
        } = body;

        const errors: Record<string, string> = {};

        if (!decision_id) {
            errors.decision_id = 'Decision ID is required.';
        }

        const validResults = ['good', 'bad', 'mixed'];
        if (!result || !validResults.includes(result)) {
            errors.result = 'Result must be one of: good, bad, mixed.';
        }

        if (typeof impact_score !== 'number' || impact_score < 1 || impact_score > 5) {
            errors.impact_score = 'Impact score must be an integer between 1 and 5.';
        }

        if (typeof was_correct_choice !== 'boolean') {
            errors.was_correct_choice = 'Choice correctness must be a boolean.';
        }

        if (!lessons_learned || typeof lessons_learned !== 'string' || lessons_learned.length < 10) {
            errors.lessons_learned = 'Lessons learned must be at least 10 characters.';
        }

        if (Object.keys(errors).length > 0) {
            return NextResponse.json({ error: 'Validation Failed', details: errors }, { status: 400 });
        }

        // 3. Verify decision ownership and existence
        const { data: decision, error: decisionError } = await supabase
            .from('decisions')
            .select('id, user_id, status')
            .eq('id', decision_id)
            .single();

        if (decisionError || !decision) {
            return NextResponse.json(
                { error: 'Not Found', message: 'The specified decision was not found.' },
                { status: 404 }
            );
        }

        if (decision.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'You do not have permission to modify this decision.' },
                { status: 403 }
            );
        }

        // 4. Check if outcome already exists (enforce cardinality)
        const { data: existingOutcome } = await supabase
            .from('outcomes')
            .select('id')
            .eq('decision_id', decision_id)
            .single();

        if (existingOutcome) {
            return NextResponse.json(
                { error: 'Conflict', message: 'An outcome already exists for this decision.' },
                { status: 409 }
            );
        }

        // 5. Prepare and Insert Outcome
        const newOutcome = {
            decision_id,
            user_id: user.id,
            result,
            impact_score,
            lessons_learned,
            was_correct_choice
        };

        const { data: outcome, error: insertError } = await supabase
            .from('outcomes')
            .insert([newOutcome])
            .select()
            .single();

        if (insertError) {
            return NextResponse.json({ error: 'DB insertion failed' }, { status: 500 });
        }

        // 6. Update Decision Status to 'completed'
        await supabase
            .from('decisions')
            .update({ status: 'completed' })
            .eq('id', decision_id);

        return NextResponse.json(outcome, { status: 201 });

    } catch (err: any) {
        return NextResponse.json({ error: 'System processing error' }, { status: 500 });
    }
}
