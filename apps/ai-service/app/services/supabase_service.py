import httpx
from app.config import get_settings
from app.exceptions import DatabaseConnectionError


def get_supabase_headers() -> dict[str, str]:
    settings = get_settings()
    return {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {settings.supabase_anon_key}",
        "Content-Type": "application/json",
    }


async def fetch_user_profile(user_id: str) -> dict[str, object] | None:
    settings = get_settings()
    url = f"{settings.supabase_url}/rest/v1/user_profiles?user_id=eq.{user_id}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=get_supabase_headers())
            if resp.status_code == 200:
                data: list[dict[str, object]] = resp.json()
                return data[0] if data else None
            return None
    except (httpx.HTTPError, ValueError) as exc:
        raise DatabaseConnectionError(f"Failed to fetch profile: {exc}")


async def fetch_user_plans(user_id: str) -> dict[str, list[dict[str, object]]]:
    settings = get_settings()
    headers = get_supabase_headers()
    diet_url = f"{settings.supabase_url}/rest/v1/diet_plans?user_id=eq.{user_id}&is_active=eq.true"
    workout_url = f"{settings.supabase_url}/rest/v1/workout_plans?user_id=eq.{user_id}&is_active=eq.true"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            diet_res = await client.get(diet_url, headers=headers)
            workout_res = await client.get(workout_url, headers=headers)
            return {
                "diet_plans": diet_res.json() if diet_res.status_code == 200 else [],
                "workout_plans": workout_res.json() if workout_res.status_code == 200 else [],
            }
    except (httpx.HTTPError, ValueError) as exc:
        raise DatabaseConnectionError(f"Failed to fetch user plans: {exc}")


async def fetch_user_tasks(user_id: str) -> list[dict[str, object]]:
    settings = get_settings()
    url = f"{settings.supabase_url}/rest/v1/daily_tasks?user_id=eq.{user_id}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=get_supabase_headers())
            if resp.status_code == 200:
                data: list[dict[str, object]] = resp.json()
                return data
            return []
    except (httpx.HTTPError, ValueError) as exc:
        raise DatabaseConnectionError(f"Failed to fetch tasks: {exc}")
