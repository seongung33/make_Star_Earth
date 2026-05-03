import React, {useRef, useEffect} from 'react';
import { useFrame } from "@react-three/fiber";


// 🌟 1. 최적화된 실시간 태양 컴포넌트


export function RealSun({ sunData }) {
  const sunMeshRef = useRef(); // 눈에 보이는 태양 구체를 위한 Ref
  const sunRef = useRef();



  useFrame((state, delta) => {
    if (!sunData || !sunRef.current) return;

    // 지구 자전 속도 보정

    const SECONDS_IN_DAY = 86164;
    const epoch = new Date("2000-01-01T12:00:00Z").getTime();
    const elapsed = (Date.now() - epoch) / 1000;
    const rotationAngle = (elapsed / SECONDS_IN_DAY) * 2 * Math.PI;

    const phi = (90 - sunData.lat) * (Math.PI / 180);
    const theta = (sunData.lon + 180) * (Math.PI / 180) + rotationAngle;
    
    // 거리(r)를 20 정도로 조절 (너무 멀면 카메라에서 잘림)
    const r = 20; 

    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const y = (r * Math.cos(phi));
    const z = (r * Math.sin(phi) * Math.sin(theta));

    // 빛의 위치 이동
    sunRef.current.position.set(x, y, z);
    
    // 🌟 눈에 보이는 태양 구체도 같은 위치로 이동
    if (sunMeshRef.current) {
      sunMeshRef.current.position.set(x, y, z);
    }
  });

  return (
    <group ref={sunRef}>
      {/* 2. 🌟 눈에 보이는 태양 (노란색으로 빛나는 공) */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#ffcc00" /> 
        {/* 태양 자체는 빛을 받지 않아도 밝아야 하므로 BasicMaterial 사용 */}
      </mesh>
    </group>
  );
}
