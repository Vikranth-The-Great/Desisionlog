import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
    try {
        // 1. Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', details: authError?.message },
                { status: 401 }
            );
        }

        // 2. Prepare dummy data matching gemini.md schema
        // In a real app, these would come from the request body.
        const chosenOptionId = uuidv4();
        const testDecision = {
            user_id: user.id,
            title: "Test Decision",
            context: "This is a temporary test decision to verify connectivity and RLS.",
            reasoning: "Test Reasoning",
            options: [
                { id: chosenOptionId, text: "Option 1", rationale: "Rationale 1" },
                { id: uuidv4(), text: "Option 2", rationale: "Rationale 2" }
            ],
            chosen_option_id: chosenOptionId,
            prediction: "Test Prediction",
            confidence: 3,
            review_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            status: 'pending',
            tags: ['test', 'connectivity']
        };

        // 3. Attempt Insert
        const { data, error: insertError } = await supabase
            .from('decisions')
            .insert([testDecision])
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json(
                { error: 'Insert Failed', details: insertError.message, code: insertError.code },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Temporary Insert Test Successful",
            data
        });
    } catch (err) {
        console.error('Test insert error:', err);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
