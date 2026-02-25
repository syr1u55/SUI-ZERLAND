"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    Float,
    MeshDistortMaterial,
    PerspectiveCamera,
    Text,
    Environment,
    PresentationControls,
    ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { type HeroItemNFT } from "@/lib/mock-data";

function HeroItemModel({ asset }: { asset: HeroItemNFT }) {
    const meshRef = useRef<THREE.Mesh>(null);

    // Determine color based on rarity
    const color = asset.rarity === 'legendary' ? '#ffd700' : asset.rarity === 'rare' ? '#00f5ff' : '#a855f7';

    return (
        <group>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                {/* Core "Spirit" of the Hero Item */}
                <mesh ref={meshRef}>
                    <icosahedronGeometry args={[1, 15]} />
                    <MeshDistortMaterial
                        color={color}
                        speed={2}
                        distort={0.4}
                        radius={1}
                        emissive={color}
                        emissiveIntensity={0.5}
                    />
                </mesh>

                {/* The Emoji Icon floating on top */}
                <Text
                    position={[0, 1.2, 0]}
                    fontSize={0.8}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {asset.image}
                </Text>
            </Float>

            {/* Decorative rings */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
                <torusGeometry args={[1.5, 0.02, 16, 100]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.3} />
            </mesh>
        </group>
    );
}

export default function HeroStage({ asset }: { asset: HeroItemNFT | null }) {
    if (!asset) return null;

    return (
        <div className="w-full h-[300px] relative">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                <PresentationControls
                    global
                    snap
                    rotation={[0, 0.3, 0]}
                    polar={[-Math.PI / 3, Math.PI / 3]}
                    azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
                >
                    <HeroItemModel asset={asset} />
                </PresentationControls>

                <ContactShadows
                    position={[0, -1.5, 0]}
                    opacity={0.4}
                    scale={10}
                    blur={2}
                    far={4.5}
                />

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
