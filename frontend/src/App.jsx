import React, {Suspense, useState, useEffect, use, useRef} from "react";
import { OrbitControls, Stars, Sphere, Line, useAspect} from '@react-three/drei';
import { useLoader, useFrame, Canvas } from "@react-three/fiber";
import * as THREE from 'three';

// 컴포넌트 들고오기
import { RealSun } from './components/3d/RealSun';
import { Earth } from './components/3d/Earth';
import { Satellite } from './components/3d/Satellite';
import { OrbitLine } from './components/3d/OrbitLine';
// import { ControlPanel } from './components/ui/ControlPanel';





function App() {
  const [satellites, setSatellites] = useState([]);
  const [ history, setHistory] = useState([]);
  const [selectedSatName, setSelectedSatName] = useState(null);
  const selectedSat = satellites.find(sat => sat.name === selectedSatName);
  const [isNight, setIsNight] = useState(false); // 낮/밤 상태를 여기서 관리

  const [ sunData, setSunData] = useState(null); // 태양 데이터 추가
  useEffect(() => {

    const fetchSatelliteData = () => {

      // 백엔드 API 호출 배포시에는 주소 주의 해야함
      // 현재 위성 위치 가져오기
      fetch('http://localhost:8000/api/satellites')
        .then(res => res.json())
        .then(result => {
          if (result.success) setSatellites(result.data);
        })
        .catch((err) => console.error("궤도 데이터 에러:", err));
      // 과거 궤도 기록 가져오기 
      fetch('http://localhost:8000/api/history')
        .then((res) => res.json())
        .then((result) => {
          if (result.history) setHistory(result.history);
        })
        .catch((err) => console.error("궤도 데이터 에러:", err));

      // 태양 데이터 가져오기
      fetch('http://localhost:8000/api/celestial')
        .then(res => res.json())
        .then(result => { 
          if (result.success) setSunData(result.sun); 
        })
        .catch(err => console.error("천체 데이터 에러:", err));
    };
    
    //  첫 접속시 실행
    fetchSatelliteData();
    
    // 5초마다 갱신
    const timerId = setInterval(fetchSatelliteData, 1000);

    // 화면에서 사라지면 종료
    return () => clearInterval(timerId);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black' }}>

      {/* 🌟 2. 스마트 관제 UI: 선택된 위성이 있으면 상세 정보, 없으면 기본 정보 */}
      <div style={{
        position: 'absolute', top: '20px', left: '20px', zIndex: 10,
        color: selectedSat ? '#fff' : '#00ffcc', // 선택 시 흰색 텍스트로 강조
        fontFamily: 'monospace',
        backgroundColor: selectedSat ? 'rgba(0, 30, 60, 0.85)' : 'rgba(0, 0, 0, 0.7)', 
        padding: '20px',
        border: `1px solid ${selectedSat ? '#00ccff' : '#00ffcc'}`, 
        borderRadius: '8px',
        boxShadow: `0 0 10px ${selectedSat ? 'rgba(0, 204, 255, 0.5)' : 'rgba(0, 255, 204, 0.5)'}`,
        minWidth: '250px'
        
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: selectedSat ? '#00ccff' : 'white' }}>
          {selectedSat ? '🎯 TARGET LOCKED' : '🛰️ StarEarth 관제센터'}
        </h2>
        
        {selectedSat ? (
          // 위성을 클릭했을 때 나오는 상세 UI
          <div>
            <p style={{ margin: '5px 0' }}><strong>이름:</strong> {selectedSat.name}</p>
            <p style={{ margin: '5px 0' }}><strong>위도:</strong> {selectedSat.latitude.toFixed(4)}°</p>
            <p style={{ margin: '5px 0' }}><strong>경도:</strong> {selectedSat.longitude.toFixed(4)}°</p>
            <p style={{ margin: '5px 0' }}><strong>고도:</strong> {selectedSat.altitude_km.toFixed(2)} km</p>
            <p style={{ margin: '5px 0' }}><strong>속도:</strong> {selectedSat.velocity_km_s} km/s</p>
            <button 
              onClick={() => setSelectedSatName(null)}
              style={{
                marginTop: '15px', width: '100%', padding: '5px',
                backgroundColor: '#00ccff', color: '#000', fontWeight: 'bold',
                border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}
            >
              선택 해제 (ESC)
            </button>

              </div>
        ) : (
          // 평상시 전체 관제 UI
          satellites.length > 0 ? (
            <div>
              <p style={{ margin: '5px 0' }}><strong>총 추적 중:</strong> {satellites.length} 개</p>
              <p style={{ margin: '5px 0', fontSize: '0.8rem', color: '#aaa' }}>위성을 클릭하여 상세 정보를 확인하세요.</p>
            </div>
          ) : (
            <p>위성 데이터 수신 중...</p>
          )
        )}
      </div>

      <Canvas camera={{ position: [0, 0, 5], fov: 45,  }}>

        {/* 태양 조명 설치 */}
        <RealSun sunData={sunData} />


        <Suspense fallback={null}>
          <Earth sunData={sunData} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Suspense>

        {/* 🌟 3. 위성 렌더링 시 클릭 이벤트와 색상 지정을 위해 props 전달 */}
        {satellites.map(sat => (
          <Satellite 
            key={sat.name} // id가 없다면 name을 key로 써도 무방합니다
            data={sat} 
            onClick={() => setSelectedSatName(sat.name)} // 클릭 시 상태 업데이트
            isSelected={selectedSatName === sat.name} // 현재 선택된 위성인지 확인
          />
        ))}
        
        <OrbitLine history={history} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
export default App;