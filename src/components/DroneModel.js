import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const DroneModel = ({ color = '#33ff55', status = 'NORMAL' }) => {
  const rotorsRef = useRef([]);

  useFrame((state) => {
    // Spin all 4 rotors
    rotorsRef.current.forEach((rotor, i) => {
      if (rotor) {
        // Alternating spin directions for realism
        rotor.rotation.y += (i % 2 === 0 ? 0.6 : -0.6);
      }
    });
  });

  const bodyColor = status === 'COMPROMISED' ? '#ff3333' : '#1a1a1a';
  const accentColor = status === 'COMPROMISED' ? '#ff0000' : '#00aaff'; // Blue like the pic
  const statusColor = status === 'COMPROMISED' ? '#ff0000' : status === 'WARNING' ? '#ffaa00' : color;

  return (
    <group scale={1.2}>
      {/* 1. MAIN BODY (Sleek and Elongated) */}
      <group position={[0, 0, 0]}>
        {/* Core fuselage */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.15, 0.7]} />
          <meshStandardMaterial color={bodyColor} roughness={0.2} metalness={0.8} />
        </mesh>
        
        {/* Top curved part */}
        <mesh position={[0, 0.08, 0.05]} castShadow>
          <boxGeometry args={[0.25, 0.05, 0.5]} />
          <meshStandardMaterial color={bodyColor} roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Front Nose / Camera Gimbal */}
        <group position={[0, -0.05, 0.35]}>
          <mesh castShadow>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>
          {/* Lens */}
          <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.04, 16]} />
            <meshStandardMaterial color="#222" emissive="#00ffff" emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* Blue Accent Lights (Front) */}
        <mesh position={[0.12, 0, 0.3]} castShadow>
          <boxGeometry args={[0.02, 0.04, 0.1]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2} />
        </mesh>
        <mesh position={[-0.12, 0, 0.3]} castShadow>
          <boxGeometry args={[0.02, 0.04, 0.1]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2} />
        </mesh>
      </group>

      {/* 2. ARMS (4 in X-shape) */}
      {[45, 135, 225, 315].map((angle, i) => (
        <group key={angle} rotation={[0, THREE.MathUtils.degToRad(angle), 0]}>
          {/* Main Arm Segment */}
          <mesh position={[0.35, 0, 0]} castShadow>
            <boxGeometry args={[0.4, 0.04, 0.08]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
          
          {/* Motor Pod */}
          <group position={[0.55, 0.05, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.12, 12]} />
              <meshStandardMaterial color="#111" metalness={1} />
            </mesh>

            {/* Blue light at tip of arm (like Pic 2) */}
            <mesh position={[0, -0.06, 0]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={1} />
            </mesh>

            {/* PROPELLERS */}
            <group ref={el => rotorsRef.current[i] = el} position={[0, 0.08, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.7, 0.01, 0.06]} />
                <meshStandardMaterial color="#111" transparent opacity={0.9} />
              </mesh>
              {/* Propeller hub */}
              <mesh castShadow>
                <cylinderGeometry args={[0.03, 0.03, 0.03, 8]} />
                <meshStandardMaterial color="#222" />
              </mesh>
            </group>
          </group>

          {/* Landing Leg (Subtle) */}
          <mesh position={[0.55, -0.15, 0]} castShadow>
            <boxGeometry args={[0.02, 0.2, 0.02]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
        </group>
      ))}

      {/* Status Light (Top) */}
      <mesh position={[0, 0.1, -0.1]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

