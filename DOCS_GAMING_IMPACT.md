# Nexus Games: Gaming on the Sui Blockchain

## Overview
Nexus Games is a next-generation decentralized gaming platform built on the **Sui Blockchain**. It demonstrates the power of "True Digital Ownership" and "Cross-Game Interoperability" by using on-chain assets that evolve based on gameplay.

The platform currently features three distinct game modes:
1.  **Arena (Battle)**: A turn-based combat simulator where stats determine the victor.
2.  **Neon Drift (Racing)**: A high-speed reflex challenge.
3.  **Royale (Survival)**: A last-man-standing battle royale mode.

---

## The "Impact": How We Leverage Sui

This project goes beyond simple "token gating". We utilize Sui's unique object-oriented data model to create **dynamic, evolving assets**.

### 1. True Digital Ownership (Dynamic NFTs)
In traditional games, your "Sword of Power" is just a row in a centralized database. In Nexus, game items are **Sui Objects** (NFTs) that you truly own in your wallet.

**Smart Contract Architecture (`nexus_items.move`)**:
The core of our on-chain logic is the `HeroItem` struct:

```move
struct HeroItem has key, store {
    id: UID,
    name: String,
    rarity: String,
    // RPG Stats
    attack: u64,
    defense: u64,
    modifier: u64, 
}
```

*   **`store` Ability**: Unlike traditional web2 items, these assets can be freely traded, sold, or transferred between wallets without the game developer's permission.
*   **Mutable State**: Because Sui objects are mutable, we can write logic to *upgrade* these items. For example, winning 100 Arena matches could permanently increase the `attack` stat of your NFT on-chain.

### 2. Cross-Game Interoperability
A key architectural decision in our Move contract is **Universal Stat Interpretation**:

> *From `nexus_items.move`:*
> "Shooter Stats (interpreted from the same base stats) ... Not stored separately to enforce 'Cross-Game' logic"

This means the same NFT works differently in every game mode:
*   **In "Arena"**: `attack` = Damage dealt per turn.
*   **In "Neon Drift"**: `attack` = Top Speed, `defense` = Handling.
*   **In "Royale"**: `attack` = Weapon Damage, `modifier` = Stealth level.

This creates a cohesive multiverse where a single asset has utility across the entire ecosystem.

### 3. Play-to-Earn & Faucet Integration
We have integrated a direct reward mechanism linked to the **Sui Testnet**.
*   **Mechanism**: When a player wins a match (e.g., in the Arena), the game client verifies the win state.
*   **Reward**: A request is sent to our proxy `/api/claim`, which interfaces with the Sui Faucet to airdrop SUI tokens directly to the player's wallet.
*   **Architecture**: This demonstrates a "Reward Engine" where gameplay loops directly result in financial settlement on the blockchain.

### 4. Using the Sui Display Standard
We utilize the `sui::display` standard to ensure our in-game assets look beautiful in any wallet (like Sui Wallet or Ethos) or Explorer.

```move
let keys = vector[utf8(b"name"), utf8(b"image_url"), ...];
let values = vector[utf8(b"{name}"), utf8(b"{url}"), ...];
```

This updates the metadata view dynamically without needing to change the underlying object structure, effectively separating the "Game Logic" (fields) from the "Presentation Layer" (display).

---

## Technical Stack

### Smart Contracts (Sui Move)
*   **Location**: `contracts/sources/nexus_items.move`
*   **Key Features**:
    *   `init`: Sets up the Publisher and Display objects.
    *   `mint`: Creates new game items with randomized stats.
    *   `update_description`: Allows mutation of item data (Leveling up/Quest completion metadata).

### Frontend (User Interface)
*   **Framework**: Next.js 14 (App Router)
*   **Styling**: TailwindCSS with a custom "Cyberpunk/Neon" aesthetic.
*   **State Management**: React Hooks for real-time game loops (e.g., `useArenaEngine`).

### Backend (API Routes)
*   **Endpoint**: `/api/claim`
*   **Function**: Acts as a secure middleware to rotate between different Faucet providers (Sui Official, Blockbolt, etc.) to ensure reliable reward delivery, handling rate limits gracefully.

---

## Future Roadmap: "Impact 2.0"

1.  **On-Chain Logic Verification**: Currently, gameplay happens off-chain and rewards are reactive. The next step is to move the "Battle Logic" into Move, so the outcome is cryptographically provable.
2.  **Kiosk Integration**: Allow players to trade their `HeroItem` NFTs in a decentralized marketplace using `sui::kiosk`.
3.  **Dynamic Fields**: Use Sui's Dynamic Fields to add "attachments" (like Gems or Runes) to items without defining them in the original struct.
