import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

// ✨ 수정 1: 부모가 넘겨주는 onClick 함수를 받아옵니다.
export function Satellite({ dataList, onClick, selectedSat }) {
  // 데이터 방어 (데이터가 없으면 렌더링 안 함)
  if (!dataList || dataList.length === 0) return null;

  const pointsRef = useRef();

  const texture = useLoader(
    THREE.TextureLoader, 
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lensflare/lensflare0.png'
  );
  const positions = useMemo(() => {
    return new Float32Array(dataList.length * 3); 
  }, [dataList]);
  
  const colors = useMemo(() => {
    const arr = new Float32Array(dataList.length * 3);
    for (let i = 0; i < dataList.length; i++) {
      arr[i * 3] = 0; arr[i * 3 + 1] = 0.95; arr[i * 3 + 2] = 1; // 기본색
    }
    return arr;
  }, [dataList]);


  useEffect(() => {
    if (!pointsRef.current) return;
    const colorAttr = pointsRef.current.geometry.attributes.color;

    if (!colorAttr) return;

    for (let i = 0; i < dataList.length; i++) {
      colors[i * 3] = 0; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 1; // 초기화
    }
    //  빨간위성으로 변경
    if (selectedSat) {
      const idx = dataList.findIndex(s => s.name === selectedSat.name);
      if (idx !== -1) {
        colors[idx * 3] = 2.6; colors[idx * 3 + 1] = 0.0; colors[idx * 3 + 2] = 3; // 선택된 것만 빨간색
      }
    }
    colorAttr.needsUpdate = true;
  }, [selectedSat, dataList, colors]);

  useFrame(() => {
    if (!pointsRef.current || !dataList || dataList.length === 0) return;

    const SECONDS_IN_DAY = 86164;
    const epoch = new Date("2000-01-01T12:00:00Z").getTime();
    const elapsed = (Date.now() - epoch) / 1000;
    const rotationAngle = (elapsed / SECONDS_IN_DAY) * 2 * Math.PI;

    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      const phi = (90 - data.latitude) * (Math.PI / 180);
      const theta = (data.longitude + 180) * (Math.PI / 180) + rotationAngle;
      
      const altitude = data.altitude_km ? data.altitude_km / 1000 : 0.4;
      const r = 2 + altitude; 

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = (r * Math.sin(phi) * Math.sin(theta));
      const y = (r * Math.cos(phi));

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // ✨ 수정 2: 가장 중요한 마법의 코드 추가! (클릭 판정 범위 새로고침)
    pointsRef.current.geometry.computeBoundingSphere();
  });

return (
    <points ref={pointsRef} onClick={(e) => {
      e.stopPropagation();
      if (!e.intersections || e.intersections.length === 0) return;
      
      const bestHit = e.intersections[0];
    const clickedSatellite = dataList[bestHit.index];

    if (onClick && clickedSatellite) {
      console.log("🎯 정밀 타겟팅 완료:", clickedSatellite.name);
      onClick(clickedSatellite);
    }
    }}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        {/* 🚨 핵심: 이 부분이 없으면 vertexColors 옵션 때문에 지구가 사라짐! */}
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        size={0.12}
        map={texture}
        vertexColors={true} // 개별 색상 모드 활성화
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}