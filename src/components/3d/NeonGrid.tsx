"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function GridHelper() {
    const gridRef = useRef<THREE.Group>(null);

    // Create grid geometry imperatively to avoid JSX type issues in R3F/React 19
    const geometry = useMemo(() => {
        const size = 100;
        const step = 2;
        const lineCoords = [];

        for (let i = -size; i <= size; i += step) {
            lineCoords.push(-size, 0, i, size, 0, i);
            lineCoords.push(i, 0, -size, i, 0, size);
        }

        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(lineCoords, 3));
        return g;
    }, []);

    useFrame((state, delta) => {
        if (gridRef.current) {
            gridRef.current.position.z += delta * 15;
            if (gridRef.current.position.z >= 2) {
                gridRef.current.position.z = 0;
            }
        }
    });

    return (
        <group ref={gridRef}>
            <lineSegments geometry={geometry}>
                <lineBasicMaterial attach="material" color="#ff00a8" transparent opacity={0.3} />
            </lineSegments>
        </group>
    );
}

export default function NeonGrid() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
            <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
                <fog attach="fog" args={["#050510", 5, 25]} />
                <GridHelper />

                {/* Subtle ground glow */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial color="#050510" />
                </mesh>
            </Canvas>
            {/* Vignette/Fade to match UI */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-[#050510] opacity-80" />
        </div>
    );
}
