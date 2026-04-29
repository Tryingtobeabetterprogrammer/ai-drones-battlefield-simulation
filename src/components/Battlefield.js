import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import { Swarm } from './Swarm';
import { useSimulation } from '../context/SimulationContext';

// Scenery component - No more duplication!
const Scenery = React.memo(() => {
  const { scene } = useGLTF('/models/battlefield-pack/source/sandbags.glb');
  
  // Apply shadows to all meshes in the scene
  useMemo(() => {
    scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={[1, 1, 1]} position={[0, -1, 0]} />;
});

const Scene = () => {
  const { rfStatus } = useSimulation();

  return (
    <>
      {/* Warm dusty background like Pic 2 */}
      <color attach="background" args={['#4a372d']} />
      
      {/* Very subtle atmosphere - Reduced fog as requested */}
      <fog attach="fog" args={['#4a372d', 30, 120]} />
      
      <Environment preset="sunset" />
      
      <ambientLight intensity={0.5} />
      
      {/* Low angle directional light for long shadows (Pic 2 look) */}
      <directionalLight 
        position={[40, 20, 20]} 
        intensity={2} 
        color={rfStatus === 'JAMMING' ? '#ff3333' : '#ffd5a1'} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      >
        <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 0.1, 150]} />
      </directionalLight>

      {/* Military Scenery - Loaded once as requested */}
      <Suspense fallback={null}>
        <Scenery />
      </Suspense>

      <ContactShadows 
        position={[0, -0.99, 0]} 
        opacity={0.4} 
        scale={100} 
        blur={2} 
        far={10} 
        color="#000000" 
      />

      {/* The Swarm of Drones */}
      <Swarm />
      
      <OrbitControls 
        makeDefault 
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={5}
        maxDistance={60}
        target={[0, 0, 0]}
        enableDamping
      />
    </>
  );
};

export const Battlefield = () => {
  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-[#2a1f1a]">
      <Canvas shadows camera={{ position: [30, 15, 30], fov: 35, near: 0.1, far: 1000 }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Preload assets
useGLTF.preload('/models/battlefield-pack/source/sandbags.glb');


