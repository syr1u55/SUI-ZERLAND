
const FAUCET_ENDPOINTS = [
    'https://faucet.testnet.sui.io/v2/gas',
    'https://faucet.suilearn.io/gas',
    'https://faucet.suilearn.io/v1/gas',
];

const ADDRESS = '0x1234567890123456789012345678901234567890123456789012345678901234'; // Dummy address

async function test() {
    console.log("Testing faucets...");
    for (const url of FAUCET_ENDPOINTS) {
        console.log(`\n--- Testing ${url} ---`);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    FixedAmountRequest: {
                        recipient: ADDRESS,
                    }
                }),
                signal: controller.signal
            });
            clearTimeout(timeout);

            console.log(`Status: ${res.status}`);
            const text = await res.text();
            console.log(`Body: ${text.substring(0, 200)}...`);
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }
}

test();
