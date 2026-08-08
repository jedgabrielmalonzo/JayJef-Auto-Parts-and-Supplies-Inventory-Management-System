import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FLOOR, WALLS, CABINETS } from './layout.js';

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function CameraRig({ target }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const goalTarget = useRef(new THREE.Vector3(0, 0, 0));
  const goalPosition = useRef(camera.position.clone());

  useEffect(() => {
    if (!target) return;
    goalTarget.current.set(...target);
    goalPosition.current.set(target[0], target[1] + 3, target[2] + 5);

    if (REDUCED_MOTION) {
      camera.position.copy(goalPosition.current);
      controlsRef.current?.target.copy(goalTarget.current);
      controlsRef.current?.update();
    }
  }, [target, camera]);

  useFrame(() => {
    if (!target || REDUCED_MOTION || !controlsRef.current) return;
    camera.position.lerp(goalPosition.current, 0.06);
    controlsRef.current.target.lerp(goalTarget.current, 0.06);
    controlsRef.current.update();
  });

  return <OrbitControls ref={controlsRef} makeDefault minDistance={3} maxDistance={20} maxPolarAngle={Math.PI / 2.1} />;
}

export default function Scene({ highlightedAisle, flyTarget, highlightedProduct }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={FLOOR.size} />
        <meshStandardMaterial color={FLOOR.color} />
      </mesh>

      {WALLS.map((w) => (
        <mesh key={w.id} position={w.position}>
          <boxGeometry args={w.size} />
          <meshStandardMaterial color={w.color} />
        </mesh>
      ))}

      {CABINETS.map((c) => {
        const isHighlighted = c.location_aisle === highlightedAisle;
        return (
          <group key={c.id}>
            <mesh position={c.position}>
              <boxGeometry args={c.size} />
              <meshStandardMaterial color={isHighlighted ? '#D7211E' : c.color} />
            </mesh>
            {/* Html (self-hosted DOM fonts), not drei's Text — Text fetches its
                font from a CDN by default, which breaks on the shop's
                internet-less LAN (docs/00-overview.md, docs/09 font policy). */}
            <Html position={[c.position[0], c.position[1] + c.size[1] / 2 + 0.35, c.position[2]]} center distanceFactor={10}>
              <div className="pointer-events-none whitespace-nowrap font-heading font-bold text-xs text-black-900">
                {c.label}
              </div>
            </Html>
            {isHighlighted && highlightedProduct && (
              <Html position={[c.position[0], c.position[1] + c.size[1] / 2 + 0.7, c.position[2]]} center distanceFactor={10}>
                <div className="whitespace-nowrap rounded border border-red-600 bg-white px-2 py-1 text-xs shadow-md">
                  <p className="font-mono font-medium text-black-900">{highlightedProduct.sku}</p>
                  <p className="text-black-700">{highlightedProduct.name}</p>
                  <p className="text-black-500">
                    {[highlightedProduct.location_aisle, highlightedProduct.location_shelf, highlightedProduct.location_bin].filter(Boolean).join(' / ')}
                  </p>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      <CameraRig target={flyTarget} />
    </>
  );
}
