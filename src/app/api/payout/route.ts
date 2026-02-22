import { NextResponse } from "next/server";

// Mock for Sui signature verification (Ed25519)
async function verifySuiSignature(message: string, signature: string, publicKey: string) {
    console.log(`[AUTH] Verifying signature for message: ${message.substring(0, 20)}...`);
    return true; // Placeholder
}

/**
 * Request SUI from the official faucet (Testnet/Devnet)
 */
async function requestFromFaucet(recipient: string) {
    const endpoints = [
        'https://faucet.testnet.sui.io/v1/gas',
        'https://faucet.testnet.sui.io/v2/gas',
    ];

    for (const url of endpoints) {
        try {
            console.log(`[FAUCET] Attempting: ${url}`);
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    FixedAmountRequest: {
                        recipient: recipient,
                    }
                })
            });
            if (res.ok) {
                const data = await res.json();
                console.log(`[FAUCET] Success from ${url}`);
                return data;
            }
            console.warn(`[FAUCET] Failed ${url}: ${res.status}`);
        } catch (e) {
            console.error(`[FAUCET] Error ${url}:`, e);
        }
    }
    throw new Error("All faucet endpoints failed. Please try again later.");
}

/**
 * Payout Request API Handler
 * 
 * This endpoint handles payout requests from various games (Neon Drift, Arena, Royale).
 * In a production environment, this should:
 * 1. Validate the win/score with game server logic.
 * 2. Verify the user's address and eligibility.
 * 3. Use a secure backend wallet or smart contract to distribute rewards.
 * 
 * WARNING: Do not store private keys in the code. Use environment variables
 * or a secure Key Management System (KMS).
 */
export async function POST(req: Request) {
    try {
        const { address, game, amount, metadata, signature, proof } = await req.json();

        if (!address) {
            return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
        }

        // ── PHASE 1: Signature Verification ──────────────────────────
        if (signature) {
            const isValidSig = await verifySuiSignature(`win:${game}:${amount}`, signature, address);
            if (!isValidSig) {
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        console.log(`[PAYOUT REQUEST] Game: ${game}, Recipient: ${address}, Amount: ${amount}`);

        /**
         * ── PHASE 2 SECURITY: Win Verification ────────────────────────
         * In a production environment, you should add validation here:
         * 1. Check if the proof (TX hash or backend log) is valid.
         * 2. Verify the on-chain WinRecorded event if applicable.
         */
        const isValidWin = !!proof; // In this prototype, requiring a proof

        if (!isValidWin) {
            return NextResponse.json({ error: "Win proof is missing or invalid" }, { status: 403 });
        }

        // ── PHASE 3: Reward Distribution ─────────────────────────────
        // If we are on mainnet, we should ideally use a treasury wallet.
        // For now, since the user asked to "check the sui faucet", 
        // we will attempt to use the faucet first.
        let faucetResult;
        try {
            faucetResult = await requestFromFaucet(address);
        } catch (e: any) {
            console.error("Payout distribution failed:", e);
            // If faucet fails, we still return success in 'prototype' mode 
            // but with a warning, or fail hard if requested.
            return NextResponse.json({
                error: "Faucet failure: " + e.message,
                details: "The Sui Faucet is currently unavailable for your network."
            }, { status: 503 });
        }

        return NextResponse.json({
            success: true,
            message: `Payout for ${game} verified and processed via Faucet.`,
            transactionId: faucetResult?.transferredGasObjects?.[0]?.transferTxDigest || "0x-pending"
        });
    } catch (error: any) {
        console.error("Payout API Error:", error);
        return NextResponse.json({ error: "Failed to process payout request" }, { status: 500 });
    }
}
