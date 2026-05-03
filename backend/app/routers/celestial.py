from fastapi import APIRouter
from skyfield.api import load, wgs84


router = APIRouter()
ts = load.timescale()

@router.get("/celestial")
def get_celestal_bodies():
    t = ts.now()
    eph = load('de421.bsp')

    sun = eph['sun']
    moon = eph['moon']
    earth = eph['earth']

    # 태양 위치
    sun_pos = earth.at(t).observe(sun).apparent()
    sun_subpoint = wgs84.subpoint(sun_pos)

    # 달 위치
    moon_pos = earth.at(t).observe(moon).apparent()
    moon_subpoint = wgs84.subpoint(moon_pos)

    return {
        "success":True,
        "sun": {
            "lat": sun_subpoint.latitude.degrees,
            "lon": sun_subpoint.longitude.degrees,
            "alt": sun_subpoint.elevation.km
        },
        "moon": {
            "lat": moon_subpoint.latitude.degrees,
            "lon": moon_subpoint.longitude.degrees,
            "alt": moon_subpoint.elevation.km
        }
    }