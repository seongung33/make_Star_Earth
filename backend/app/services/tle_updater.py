import urllib.request
import threading
import time
from datetime import datetime, timedelta
from database import get_db_conn



def update_tle_from_internet():
    print("🌐 TLE 데이터를 다운로드 중입니다...")
    # URL = 'https://celestrak.org/NORAD/elements/stations.txt'
    URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle'
    
    # 1. 완벽한 웹 브라우저 위장 (403 에러 방지 핵심)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
    
    try:
        req = urllib.request.Request(URL, headers=headers)
        with urllib.request.urlopen(req) as response:
            lines = response.read().decode('utf-8').splitlines()
            
        data_to_insert = []
        for i in range(0, len(lines), 3):
            if i + 2 < len(lines):
                name = lines[i].strip()
                line1 = lines[i+1].strip()
                line2 = lines[i+2].strip()
                data_to_insert.append((name, line1, line2))
        
        conn = get_db_conn()
        cursor = conn.cursor()
        cursor.executemany('''
            INSERT OR REPLACE INTO tle_cache (name, line1, line2, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ''', data_to_insert)
        conn.commit()
        conn.close()
        print(f"✅ TLE 업데이트 완료! (총 {len(data_to_insert)}개 위성 텍스트 저장됨)")
        
    except urllib.error.HTTPError as e:
        print(f"❌ 접속 거부됨 ({e}): CelesTrak 서버에서 일시적으로 IP를 차단했습니다. 5~10분 후 다시 시도해주세요.")
    except Exception as e:
        print(f"❌ TLE 다운로드 실패: {e}")


# 서버 시작 시 실행
def get_last_update_time():
    """DB에서 가장 최근에 업데이트된 시간을 가져옵니다."""
    conn = get_db_conn()
    cursor = conn.cursor()
    # 가장 최근의 updated_at 한 개만 가져옴
    cursor.execute("SELECT updated_at FROM tle_cache ORDER BY updated_at DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        # SQLite의 문자열 시간을 파이썬 datetime 객체로 변환
        return datetime.strptime(row[0], '%Y-%m-%d %H:%M:%S')
    return None



def schedule_tle_updates():
    """6시간마다 체크하여 업데이트가 필요하면 수행합니다."""
    while True:
        # 30분마다 한 번씩 체크 (서버가 켜져 있는 동안 6시간이 지나면 바로 받기 위함)
        time.sleep(1800) 
        last_update = get_last_update_time()
        if last_update:
            time_diff = datetime.utcnow() - last_update
            if time_diff > timedelta(hours=6):
                update_tle_from_internet()


def start_logic():
    print("🧐 TLE 데이터 상태를 점검합니다...")
    last_update = get_last_update_time()
    
    if last_update is None:
        print("📭 DB가 비어있습니다. 즉시 업데이트를 시작합니다.")
        update_tle_from_internet()
    else:
        # 현재 시간과 마지막 업데이트 시간 차이 계산
        time_diff = datetime.utcnow() - last_update
        if time_diff > timedelta(hours=6):
            print(f"⏰ 마지막 업데이트로부터 {time_diff.total_seconds()/3600:.1f}시간이 지났습니다. 갱신합니다.")
            update_tle_from_internet()
        else:
            wait_hours = 6 - (time_diff.total_seconds() / 3600)
            print(f"✅ 데이터가 신선합니다. (약 {wait_hours:.1f}시간 후 다음 업데이트 예정)")