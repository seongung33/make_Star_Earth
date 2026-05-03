import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

export function Satellite({ data, onClick, isSelected }) {
  const meshRef = React.useRef();

  useFrame(() => {
    if (!meshRef.current) return;

    // 🌟 지구와 동일한 시간 기반 회전각 계산
    const SECONDS_IN_DAY = 86164;
    const epoch = new Date("2000-01-01T12:00:00Z").getTime();
    const elapsed = (Date.now() - epoch) / 1000;
    const rotationAngle = (elapsed / SECONDS_IN_DAY) * 2 * Math.PI;

    // 위도(phi), 경도(theta) 계산
    const phi = (90 - data.latitude) * (Math.PI / 180);
    // 🌟 중요: 위성의 경도에 지구의 현재 회전각을 더해줍니다.
    const theta = (data.longitude + 180) * (Math.PI / 180) + rotationAngle;
    
    const r = 2 + data.altitude_km / 1000; 

    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const z = (r * Math.sin(phi) * Math.sin(theta));
    const y = (r * Math.cos(phi));

    meshRef.current.position.set(x, y, z);
  });

  return (
    <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <sphereGeometry args={[isSelected ? 0.03 : 0.015, 16, 16]} />
      <meshBasicMaterial color={isSelected ? "red" : "#00ffcc"} />
    </mesh>
  );
}