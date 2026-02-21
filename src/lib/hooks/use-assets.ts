"use client";

import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { HERO_ITEM_TYPE } from "../config";
import { MOCK_ASSETS, type HeroItemNFT } from "../mock-data";
import { useMemo } from "react";

/**
 * useOwnedAssets Hook
 * 
 * Fetches real HeroItem NFTs from the Sui blockchain and merges them 
 * with the mock assets for a complete player loadout experience.
 */
export function useOwnedAssets() {
    const account = useCurrentAccount();

    const { data: ownedObjects, isLoading, error } = useSuiClientQuery(
        "getOwnedObjects",
        {
            owner: account?.address || "",
            filter: {
                StructType: HERO_ITEM_TYPE,
            },
            options: {
                showContent: true,
                showDisplay: true,
            },
        },
        {
            enabled: !!account?.address,
        }
    );

    const assets = useMemo(() => {
        // Start with the standard mock assets
        const results: (HeroItemNFT & { isVerified?: boolean })[] = [...MOCK_ASSETS];

        if (ownedObjects?.data) {
            const onChainAssets = ownedObjects.data.map((obj: any) => {
                const content = obj.data?.content;
                const fields = content?.dataType === "moveObject" ? content.fields : null;

                return {
                    id: obj.data?.objectId,
                    name: fields?.name || "Unknown Item",
                    description: fields?.description || "An on-chain Nexus Item",
                    image: obj.data?.display?.data?.image_url || "📦",
                    rarity: (fields?.rarity?.toLowerCase() as any) || "common",
                    attack: Number(fields?.attack) || 0,
                    defense: Number(fields?.defense) || 0,
                    modifier: Number(fields?.modifier) || 0,
                    isVerified: true, // Mark as real on-chain asset
                };
            });

            // Append on-chain assets to the list
            results.push(...onChainAssets);
        }

        return results;
    }, [ownedObjects]);

    return {
        assets,
        isLoading,
        error,
        account,
    };
}
