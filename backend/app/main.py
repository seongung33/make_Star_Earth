import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys
# 제작 라이브러리

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from database import init_db
from services.tle_updater import start_logic, schedule_tle_updates
from routers import satellites, celestial

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
static_path = os.path.join(BASE_DIR, "static", "textures")

if os.path.exists(static_path):
    app.mount("/static/textures", StaticFiles(directory=static_path), name="textures")
else:
    print(f"⚠️ 경고: 정적 파일 경로를 찾을 수 없습니다: {static_path}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    # allow_credentials=True
)


app.include_router(satellites.router, prefix="/api")
app.include_router(celestial.router, prefix="/api")

# --- 실행부 ---
@app.on_event("startup")
def startup_event():
    init_db()
    start_logic()
    threading.Thread(target=schedule_tle_updates, daemon=True).start()

# Skyfield 초기설정
# 최신 우주정거장 TLE 데이터 주소
# ISS_URL = 'https://celestrak.org/NORAD/elements/stations.txt'
# STARLINK_URL = 'https://celestrak.org/NORAD/elements/supplemental/starlink.txt'
# ACTIVE_SATS_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle'
# 루트 경로 설정
@app.get('/')
def read_root():
    return {"status": "running", "message": "StarEarth API Server is Online!"}

