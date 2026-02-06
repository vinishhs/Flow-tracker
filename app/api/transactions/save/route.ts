import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    try {
        const { transactions } = await request.json();

        if (!transactions || !Array.isArray(transactions)) {
            return NextResponse.json({ error: 'Missing transactions array' }, { status: 400 });
        }

        // Since we don't have a session handler in this restored state, 
        // we'll try to get a default user or handle the user_id requirement.
        // In a real app, you'd get this from supabase.auth.getUser()

        // For restoration, we'll fetch the first profile to use its ID as a fallback user_id.
        const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();

        if (!profile) {
            return NextResponse.json({ error: 'No user profile found in database' }, { status: 500 });
        }

        const userId = profile.id;

        const formattedTransactions = transactions.map((tx: any) => ({
            user_id: userId,
            amount: tx.amount,
            transaction_type: tx.transaction_type,
            category: tx.category,
            sub_category: tx.sub_category,
            recipient_name: tx.recipient_name,
            transaction_date: tx.transaction_date,
            fingerprint: tx.fingerprint,
        }));

        // Perform Upsert based on fingerprint
        const { data, error, count } = await supabase
            .from('transactions')
            .upsert(formattedTransactions, {
                onConflict: 'fingerprint',
                ignoreDuplicates: false // Set to false to update if it exists, or true to just ignore
            })
            .select();

        if (error) {
            console.error('Supabase Upsert Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: data?.length || 0
        });

    } catch (error: any) {
        console.error('Save API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
