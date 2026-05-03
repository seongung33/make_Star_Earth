import sqlite3

DB_NAME = "star_earth.db"

def get_db_conn():
    return sqlite3.connect(DB_NAME)


def init_db():
    conn = get_db_conn()
    cursor = conn.cursor()
    
    # 위성 위치 로그용 테이블 (복구)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS satellite_positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            latitude REAL,
            longitude REAL,
            altitude REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # TLE 캐싱용 테이블
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tle_cache (
            name TEXT PRIMARY KEY,
            line1 TEXT,
            line2 TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


