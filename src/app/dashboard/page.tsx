import { supabase } from '../../lib/supabaseClient';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
    // 1. Server-side session check
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/');
    }

    // 2. Initial Server-side fetch for content speed
    // This removes the "skeleton flicker" on every page load
    const { data: initialDecisions } = await supabase
        .from('decisions')
        .select(`
            *,
            outcome:outcomes (*)
        `)
        .eq('user_id', session.user.id)
        .order('status', { ascending: false })
        .order('created_at', { ascending: false });

    return (
        <div className="container">
            <header>
                <h1>Decision Log</h1>
                <p className="subtitle">Capture your thinking. Review your outcomes.</p>
            </header>

            <DashboardClient initialDecisions={initialDecisions || []} />
        </div>
    );
}
