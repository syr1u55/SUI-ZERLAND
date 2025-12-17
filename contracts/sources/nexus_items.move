module nexus_game::hero_items {
    use std::string::{Self, String};
    use sui::url::{Self, Url};
    use sui::object::{Self, ID, UID};
    use sui::event;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::package;
    use sui::display;

    /// An NFT that represents a game asset in the Nexus Ecosystem
    struct HeroItem has key, store {
        id: UID,
        name: String,
        description: String,
        url: Url,
        rarity: String,
        /// RPG Stats
        attack: u64,
        defense: u64,
        modifier: u64, // Generic modifier for misc stats (e.g. Magic/Speed)
        /// Shooter Stats (interpreted from the same base stats)
        /// Not stored separately to enforce "Cross-Game" logic (1 set of stats = multiple interpretations)
    }

    /// One-Time-Witness for the module
    struct HERO_ITEMS has drop {}

    // Events
    struct ItemMinted has copy, drop {
        id: ID,
        creator: address,
        name: String,
    }

    fun init(otw: HERO_ITEMS, ctx: &mut TxContext) {
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"link"),
            string::utf8(b"image_url"),
            string::utf8(b"description"),
            string::utf8(b"project_url"),
            string::utf8(b"creator"),
        ];

        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"https://nexus.game/item/{id}"),
            string::utf8(b"{url}"),
            string::utf8(b"{description}"),
            string::utf8(b"https://nexus.game"),
            string::utf8(b"Nexus Games"),
        ];

        let publisher = package::claim(otw, ctx);
        let display = display::new_with_fields<HeroItem>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    /// Public function to mint a new Item
    public entry fun mint(
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        rarity: vector<u8>,
        attack: u64,
        defense: u64,
        modifier: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let item = HeroItem {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            url: url::new_unsafe_from_bytes(url),
            rarity: string::utf8(rarity),
            attack,
            defense,
            modifier,
        };

        event::emit(ItemMinted {
            id: object::uid_to_inner(&item.id),
            creator: tx_context::sender(ctx),
            name: item.name,
        });

        transfer::public_transfer(item, recipient);
    }

    /// Allow the owner to update the description (e.g. to add "Battle Hardened" status)
    public entry fun update_description(
        item: &mut HeroItem,
        new_description: vector<u8>,
        _: &mut TxContext
    ) {
        item.description = string::utf8(new_description);
    }

    /// Burn function if an item is destroyed
    public entry fun burn(item: HeroItem, _: &mut TxContext) {
        let HeroItem { id, name: _, description: _, url: _, rarity: _, attack: _, defense: _, modifier: _ } = item;
        object::delete(id);
    }
}
