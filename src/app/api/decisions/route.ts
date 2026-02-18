import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * POST /api/decisions
 * Creates a new decision record in accordance with the Project Constitution (gemini.md).
 */
export async function POST(request: Request) {
    try {
        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'You must be logged in to create a decision.' },
                { status: 401 }
            );
        }

        // 2. Parse and Validate Input
        const body = await request.json();
        const {
            title,
            context,
            reasoning,
            options,
            chosen_option_id,
            prediction,
            confidence,
            review_date,
            tags
        } = body;

        const errors: Record<string, string> = {};

        // Strict Validation based on gemini.md
        if (!title || typeof title !== 'string' || title.length < 3 || title.length > 200) {
            errors.title = 'Title must be between 3 and 200 characters.';
        }

        if (!context || typeof context !== 'string' || context.length > 2000) {
            errors.context = 'Context is required and must not exceed 2000 characters.';
        }

        if (!reasoning || typeof reasoning !== 'string' || reasoning.length > 5000) {
            errors.reasoning = 'Reasoning is required and must not exceed 5000 characters.';
        }

        if (!Array.isArray(options) || options.length < 2 || options.length > 5) {
            errors.options = 'You must provide between 2 and 5 options.';
        }

        if (!chosen_option_id) {
            errors.chosen_option_id = 'A chosen option is required.';
        }

        if (!prediction || typeof prediction !== 'string') {
            errors.prediction = 'A prediction is required.';
        }

        if (typeof confidence !== 'number' || confidence < 1 || confidence > 5) {
            errors.confidence = 'Confidence must be an integer between 1 and 5.';
        }

        if (!review_date || isNaN(Date.parse(review_date)) || new Date(review_date) <= new Date()) {
            errors.review_date = 'Review date must be a valid future ISO 8601 string.';
        }

        if (Object.keys(errors).length > 0) {
            return NextResponse.json({ error: 'Validation Failed', details: errors }, { status: 400 });
        }

        // 3. Prepare Database Insert
        const newDecision = {
            user_id: user.id,
            title,
            context,
            reasoning,
            options, // Expected format: [{id, text, rationale}, ...]
            chosen_option_id,
            prediction,
            confidence,
            review_date,
            tags: tags || [],
            status: 'pending' // Default as per schema
        };

        // 4. Insert into Supabase
        const { data, error: dbError } = await supabase
            .from('decisions')
            .insert([newDecision])
            .select()
            .single();

        if (dbError) {
            return NextResponse.json(
                { error: 'Database Error' },
                { status: 500 }
            );
        }

        // 5. Success Response
        return NextResponse.json(data, { status: 201 });

    } catch (err) {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/decisions
 * Retrieves user's decision history including outcomes, following gemini.md sorting.
 */
export async function GET() {
    try {
        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'You must be logged in to view decisions.' },
                { status: 401 }
            );
        }

        // 2. Fetch decisions with joined outcomes
        // Constitutional Sorting: Pending first (status DESC), then Newest first (created_at DESC)
        const { data, error: dbError } = await supabase
            .from('decisions')
            .select(`
                *,
                outcome:outcomes (*)
            `)
            .eq('user_id', user.id)
            .order('status', { ascending: false })
            .order('created_at', { ascending: false });

        if (dbError) {
            return NextResponse.json(
                { error: 'Database Error' },
                { status: 500 }
            );
        }

        // 3. Success Response
        return NextResponse.json(data);

    } catch (err) {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
