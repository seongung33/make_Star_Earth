import React from 'react';
import { Line } from '@react-three/drei';


// 궤도선 컴포넌트 (과거 기록을 선으로 잇기)
export function OrbitLine({ history }) {
  if (!history || history.length < 2) return null;  // 기록이 2개 이상이어야 선을 그릴 수 있음
  // DB에서 가져온 과거 배열 데이터를 3D 좌표로 전환
  const points = history.map((row) => {
    // row 구조: [id, name, latitude, longitude, altitude, timestamp]
    const lat = row[2];
    const lon = row[3];
    const alt = row[4];

    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const r = 2 + (alt / 1000);

    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const z = (r * Math.sin(phi) * Math.sin(theta));
    const y = (r * Math.cos(phi));

    return [x, y , z];
  });
  //  점들을 하얀색으로 연결하기
  return <Line points={points} color = "white" lineWidth={1.5} opacity={0.6} transparent />;
}