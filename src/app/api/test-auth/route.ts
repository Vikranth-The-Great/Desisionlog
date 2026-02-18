import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        // Check for session in headers if using SSR, 
        // but for a simple client-side test, we check auth.getUser() 
        // which relies on the Authorization header if provided.
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', details: error?.message },
                { status: 401 }
            );
        }

        return NextResponse.json({
            authenticated: true,
            userId: user.id,
            email: user.email,
        });
    } catch (err) {
        console.error('Auth test error:', err);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
