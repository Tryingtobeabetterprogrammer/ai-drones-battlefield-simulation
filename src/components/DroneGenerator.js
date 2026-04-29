import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Cache for the loaded drone model to avoid reloading
let droneModelCache = null;
let isLoading = false;

const loadDroneModel = async () => {
  if (droneModelCache || isLoading) return droneModelCache;
  
  isLoading = true;
  try {
    const gltf = await new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
      loader.setDRACOLoader(dracoLoader);
      loader.load('/models/tri_drone.glb', resolve, undefined, reject);
    });
    
    droneModelCache = gltf.scene;
    return droneModelCache;
  } catch (error) {
    console.error('Error loading drone model:', error);
    return null;
  } finally {
    isLoading = false;
  }
};

export const DroneGenerator = ({ drone }) => {
  const groupRef = useRef();
  const [model, setModel] = React.useState(null);
  
  // Load model on mount
  React.useEffect(() => {
    loadDroneModel().then(setModel);
  }, []);

  // High-level status colors
  const getColor = () => {
    if (drone.status === 'COMPROMISED') return '#ff3333'; // Red
    if (drone.status === 'WARNING') return '#ffaa00'; // Yellow
    return '#33ff55'; // Green
  };

  // Movement and animation logic
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    
    // Smoothly interpolate towards the state-driven position
    const targetX = drone.position[0];
    const targetY = drone.position[1];
    const targetZ = drone.position[2];

    // Lerp position for smooth movement
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.1);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.1);

    // Add organic drone "hover" jitter
    groupRef.current.position.y += Math.sin(t * 2 + drone.id) * 0.005;
    groupRef.current.position.x += Math.cos(t * 1.5 + drone.id) * 0.005;

    // Rotation logic: Face the target direction
    const dx = drone.target[0] - groupRef.current.position.x;
    const dz = drone.target[2] - groupRef.current.position.z;
    const targetRotation = Math.atan2(dx, dz);
    
    // Custom lerpAngle to avoid version compatibility issues
    let deltaAngle = targetRotation - groupRef.current.rotation.y;
    while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
    while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
    groupRef.current.rotation.y += deltaAngle * 0.05;

    // Tilt drone based on movement direction
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, Math.sin(t * 2) * 0.05, 0.1);

    // If compromised, add chaotic spinning
    if (drone.status === 'COMPROMISED') {
      groupRef.current.rotation.z += delta * 10;
      groupRef.current.position.y -= delta * 2; // Crashing
    }
  });

  if (!model) return null;

  return (
    <group ref={groupRef}>
      {/* Clone the drone model with proper scaling and materials */}
      <primitive 
        object={model.clone()} 
        scale={2.5} // Adjusted scale for better visibility
        position={[0, 0, 0]}
        castShadow 
        receiveShadow
      />
      
      {/* Add a glowing sphere to make drones more visible */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={getColor()} 
          emissive={getColor()} 
          emissiveIntensity={2}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Tactical Spotlight beneath the drone */}
      <spotLight 
        position={[0, 0, 0]} 
        angle={0.6} 
        penumbra={0.5} 
        intensity={drone.status === 'COMPROMISED' ? 0 : 5} 
        color={getColor()} 
        castShadow
      />

      {/* Engine glow points */}
      <group position={[0, 0.1, 0]}>
        <pointLight position={[0.5, 0, 0.5]} distance={3} intensity={3} color={getColor()} />
        <pointLight position={[-0.5, 0, 0.5]} distance={3} intensity={3} color={getColor()} />
        <pointLight position={[0.5, 0, -0.5]} distance={3} intensity={3} color={getColor()} />
        <pointLight position={[-0.5, 0, -0.5]} distance={3} intensity={3} color={getColor()} />
      </group>

      {/* Enhanced HUD Label */}
      <Html distanceFactor={15} center position={[0, 2, 0]}>
        <div className="px-3 py-1 text-[10px] font-bold font-sans rounded bg-black/80 backdrop-blur-md border border-white/30 text-white shadow-2xl whitespace-nowrap uppercase tracking-widest">
          {drone.id}
        </div>
      </Html>
      
      {/* Add a ring indicator around the drone */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.0, 32]} />
        <meshStandardMaterial 
          color={getColor()} 
          emissive={getColor()} 
          emissiveIntensity={1}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

// Preload the model
useGLTF.preload('/models/tri_drone.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
