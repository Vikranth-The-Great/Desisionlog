import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        // 1. Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', details: authError?.message },
                { status: 401 }
            );
        }

        // 2. Fetch decisions for the user with joined outcomes
        // This tests both RLS and the internal relationship logic.
        const { data, error: fetchError } = await supabase
            .from('decisions')
            .select(`
        *,
        outcomes (*)
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('Fetch error:', fetchError);
            return NextResponse.json(
                { error: 'Fetch Failed', details: fetchError.message, code: fetchError.code },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        console.error('Test fetch error:', err);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
