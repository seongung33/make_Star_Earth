from fastapi import APIRouter
from skyfield.api import load, EarthSatellite
from database import get_db_conn

router = APIRouter()
ts = load.timescale()

@router.get("/satellites")
def get_satellites():
    conn = get_db_conn()
    cursor = conn.cursor()
    # 아래 코드는 개수 제한을 해제할 ㅅ ㅜ있음
    # 전부 다 쓰려면 FROM tle_cache 까지만 작성
    # tle_cache or LIMIT 1000
    cursor.execute("SELECT name, line1, line2 FROM tle_cache LIMIT 1000") # 표기 개수 건드리기
    rows = cursor.fetchall()
    conn.close()


    ts = load.timescale()
    t = ts.now()
    results = []
        
    t = ts.now()
    results = []
    
    # 2. 너무 많으면 느려지므로 상위 50개만 계산해서 보냅니다.
    for name, l1, l2 in rows:
        # DB에서 꺼낸 TLE로 계산기(Satellite 객체) 생성
        sat = EarthSatellite(l1, l2, name, ts)
        geocentric = sat.at(t)
        subpoint = geocentric.subpoint()
        
        # 속도 계산 추가
        velocity = geocentric.velocity.km_per_s
        speed = (velocity[0]**2 + velocity[1]**2 + velocity[2]**2)**0.5

        results.append({
            "name": name,
            "latitude": subpoint.latitude.degrees,
            "longitude": subpoint.longitude.degrees,
            "altitude_km": subpoint.elevation.km,
            "velocity_km_s": round(speed, 2)
        })

    return {"success": True, "data": results}

@router.get("/history")
def get_history():
    conn = get_db_conn()
    cursor = conn.cursor()
    # 최근 10개의 위치 기록만 가져오기
    cursor.execute("SELECT * FROM satellite_positions ORDER BY timestamp DESC LIMIT 10")
    rows = cursor.fetchall()
    conn.close()
    return {"history": rows}
