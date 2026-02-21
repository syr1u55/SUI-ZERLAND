/**
 * Nexus Ecosystem - Mainnet Configuration
 */

export const CONFIG = {
    // The package ID where the HeroItem contract is deployed
    // Replace with actual deployed package ID
    PACKAGE_ID: "0x0000000000000000000000000000000000000000000000000000000000000000",

    // The treasury address that receives bets and distributes rewards
    TREASURY_ADDRESS: "0x76b2f7034cf5fa2b87e224855476a6e76865d1d609bab5767b41e6c3af2c5d57",

    // Default network settings
    NETWORK: "mainnet",

    // Payout constants
    PAYOUT_MULTIPLIER: 2.0,
    MIN_BET: 0.1,
    MAX_BET: 10,
};

// Type definition for HeroItem objects on-chain
export const HERO_ITEM_TYPE = `${CONFIG.PACKAGE_ID}::hero_items::HeroItem`;
