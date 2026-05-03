import React, {useRef, useMemo} from 'react';
import { useLoader, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';


// 지구 쉐이더 정의 
const EarthShaderMaterial = shaderMaterial(
  {
    // 쉐이더에서 사용할 변수들 (Uniforms)
    dayMap: null,
    nightMap: null,
    sunPosition: new THREE.Vector3(20, 0, 0), // 태양 위치 (초기값)
  },
  // --- 버텍스 쉐이더 (정점 위치 계산) ---
  `
    varying vec2 vUv;
    varying vec3 vWorldNormal; 
    varying vec3 vWorldPosition; 

    void main() {
      vUv = uv;

      // 🌟 핵심 교정: 수학적으로 한 번 더 돌릴 필요 없습니다. 
      // Three.js의 modelMatrix가 지구의 자전(rotation.y)을 이미 법선에 적용해 줍니다.
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // --- 프래그먼트 쉐이더 (색상 표현) ---
  `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;

    uniform sampler2D dayMap;
    uniform sampler2D nightMap;
    uniform vec3 sunPosition;

    void main() {
      // 1. 텍스처 원본 색상 그대로 가져오기
      vec3 dayColor = texture2D(dayMap, vUv).rgb;
      vec3 nightColor = texture2D(nightMap, vUv).rgb;

      // 🌿 흑백 로직은 제거하고, 밤의 전체적인 밝기만 1.2배 살짝 올려서 불빛을 예쁘게 살립니다.
      nightColor *= 1.2; 

      // 🌿 2. 극지방(빙하) 어색함 덮기
      // 양 극단으로 갈수록 불빛을 80%까지만 은은하게 눌러줍니다.
      float poleMask = smoothstep(0.35, 0.5, abs(vUv.y - 0.5));
      nightColor *= (1.0 - poleMask * 0.8);

      // 3. 빛의 방향과 세기 계산
      vec3 lightDirection = normalize(sunPosition - vWorldPosition);
      float intensity = dot(normalize(vWorldNormal), lightDirection);

      // 🌿 4. 황혼 영역(smoothness)을 0.15로 넓혀서 해질녘/해뜰녘을 부드럽게
      float smoothness = 0.15;
      float mixAmount = smoothstep(-smoothness, smoothness, intensity);

      // 5. 밤 지역 기본 어둠 세팅
      float ambientNight = 0.02;

      // 최종 블렌딩
      vec3 finalColor = mix(nightColor + vec3(ambientNight), dayColor, mixAmount);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// shaderMaterial을 Three.js 요소로 등록
extend({ EarthShaderMaterial });


//  지구 메인 컴포넌트
export function Earth({ sunData }) { // 상태를 props로 받습니다.
  const earthRef = useRef();
  const materialRef = useRef();

  const [dayMap, nightMap] = useLoader(THREE.TextureLoader, [
    'http://localhost:8000/static/textures/natural_earth_2.jpg',
    'http://localhost:8000/static/textures/BlackMarble_2016_3km.jpg'
  ]);

  // 쉐이더의 Uniforms 초기값 설정
  const uniforms = useMemo(() => ({
    dayMap: dayMap,
    nightMap: nightMap,
    sunPosition: new THREE.Vector3(),
    rotationAngle: 0.0
  }), [dayMap, nightMap]);


  useFrame(() => {

    if (!earthRef.current || !materialRef.current) return;

    
      // 현재 시간으로 지구 자전각 계산
      const SECONDS_IN_DAY = 86164;
      const epoch = new Date("2000-01-01T12:00:00Z").getTime();
      const elapsed = (Date.now() - epoch) / 1000;
      const rotationAngle = (elapsed / SECONDS_IN_DAY) * 2 * Math.PI;
      //  지구 자전
      earthRef.current.rotation.y = rotationAngle % (2 * Math.PI);
      //  쉐이더에도 자전각 주기
      materialRef.current.rotationAngle = rotationAngle

      // 태양 빛 방향 계산
      if (sunData) {
        const phi = (90 - sunData.lat) * (Math.PI / 180);
        // 🌟 핵심 교정: + rotationAngle 이 빠지면 태양이 지구랑 같이 돌아가 버립니다!
        const theta = (sunData.lon + 180) * (Math.PI / 180) + rotationAngle; 
        const r = 20; 

        const x = -(r * Math.sin(phi) * Math.cos(theta));
        const y = (r * Math.cos(phi));
        const z = (r * Math.sin(phi) * Math.sin(theta));

        materialRef.current.sunPosition.set(x, y, z);
      }
  });

  return (
    <mesh 
    ref = {earthRef}
    rotation={[23.5 *(Math.PI / 180), 0, 0]}> {/* 지구 자전축 23.5도 기울이기 */}
      <sphereGeometry args={[2, 64, 64]} /> {/* 반지름을 위성 계산 로직(r=2)에 맞춰 2로 수정 */}

      <earthShaderMaterial
        ref={materialRef}
        dayMap={dayMap}
        nightMap={nightMap}

      />
    </mesh>
  );
}