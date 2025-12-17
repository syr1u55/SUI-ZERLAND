import { NextResponse } from 'next/server';

const FAUCET_ENDPOINTS = [
    // Official (often rate limited but valid)
    'https://faucet.testnet.sui.io/v2/gas',
    // Community Faucets
    // 'https://faucet.suilearn.io/gas', // Returning 405 Method Not Allowed
    // 'https://faucet.blockbolt.io/gas', 
];

async function requestFromFaucet(url: string, address: string) {
    console.log(`Trying faucet: ${url}`);
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                FixedAmountRequest: {
                    recipient: address,
                },
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const text = await response.text().catch(() => "No response body");
            throw new Error(`${response.status}: ${text || 'Empty error response'}`);
        }

        return await response.json();
    } catch (error: any) {
        console.warn(`Failed to request from ${url}:`, error.message);
        throw error;
    }
}

export async function POST(request: Request) {
    try {
        const { address } = await request.json();

        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        }

        console.log(`\n--- Starting faucet rotation for: ${address} ---`);

        const errors = [];
        for (const url of FAUCET_ENDPOINTS) {
            try {
                const data = await requestFromFaucet(url, address);
                console.log(`Success from ${url}!`);
                return NextResponse.json({ success: true, provider: url, data });
            } catch (err: any) {
                errors.push(`${url}: ${err.message}`);
                // Continue to next faucet
            }
        }


        // If all failed
        console.error('All faucets failed:', errors);
        return NextResponse.json({
            error: 'All faucets failed or are rate-limited.',
            details: errors
        }, { status: 429 });

    } catch (error: any) {
        console.error('Proxy internal error:', error);

        // Log the exact object we are about to return
        const errorResponse = {
            error: error?.message || 'Internal server error',
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        };
        console.log('Returning 500 with:', errorResponse);

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
