import fs from 'fs';
import path from 'path';

const API_ROOT = 'http://localhost:3000/api';

async function stressTest() {
    console.log('--- API Stress Test Starting ---');

    const longReasoning = 'A'.repeat(5001); // Exceeds 5000 limit

    // 1. Large Payload Test
    console.log('\n[Case 1] Payload Limit: Submitting 5001 chars reasoning...');
    try {
        const res = await fetch(`${API_ROOT}/decisions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Limit Test',
                reasoning: longReasoning,
                context: 'Valid context',
                confidence: 3,
                options: [{ id: '1', text: 'A', rationale: 'B' }, { id: '2', text: 'C', rationale: 'D' }],
                chosen_option_id: '1',
                prediction: 'X',
                review_date: new Date(Date.now() + 86400000).toISOString()
            })
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        if (res.status === 400 && data.details?.reasoning) {
            console.log('🛡️  SUCCESS: API blocked oversized reasoning.');
            console.log('Error detail:', data.details.reasoning);
        } else {
            console.log('⚠️  FAILURE: API allowed oversized reasoning or returned unexpected status.');
            console.log('Response data:', JSON.stringify(data));
        }
    } catch (e: any) {
        console.log('API unreachable - ensure npm run dev is running:', e.message);
    }

    console.log('\n--- API Stress Test Finished ---');
}

stressTest();
