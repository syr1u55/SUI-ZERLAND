export interface HeroItemNFT {
    id: string;
    name: string;
    description: string;
    image: string;
    rarity: "common" | "rare" | "legendary";
    // Raw On-Chain Stats
    attack: number;
    defense: number;
    modifier: number;
}

// Function to interpret raw stats for RPG Context
export function getRpgStats(item: HeroItemNFT) {
    return {
        strength: item.attack * 2 + Math.floor(item.modifier / 2),
        magic: item.modifier * 2 + Math.floor(item.attack / 5),
        description: `A ${item.rarity} artifact. Emits a magical aura.`
    };
}

// Function to interpret SAME raw stats for Shooter Context
export function getShooterStats(item: HeroItemNFT) {
    return {
        firepower: item.attack + item.modifier, // different formula
        shield: item.defense * 2,
        description: `High-tech gear. Energy signature: ${item.modifier}Hz.`
    };
}

export const MOCK_ASSETS: HeroItemNFT[] = [
    {
        id: "1",
        name: "Void Blade",
        description: "A blade forged from the emptiness of space.",
        image: "⚔️",
        rarity: "legendary",
        attack: 75,
        defense: 10,
        modifier: 50,
    },
    {
        id: "2",
        name: "Dragon Scale",
        description: "Scales from an ancient dragon.",
        image: "🛡️",
        rarity: "rare",
        attack: 10,
        defense: 60,
        modifier: 80, // High Magic/Shield regen
    },
    {
        id: "3",
        name: "Power Core",
        description: "A simple ring humming with potential.",
        image: "💍",
        rarity: "common",
        attack: 5,
        defense: 5,
        modifier: 25,
    },
];
