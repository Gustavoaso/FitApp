from app.services.supabase_service import fetch_user_profile, fetch_user_plans
from app.exceptions import DatabaseConnectionError


async def execute_get_user_context(user_id: str) -> dict[str, object]:
    try:
        profile = await fetch_user_profile(user_id)
        plans = await fetch_user_plans(user_id)
        return {
            "status": "success",
            "profile": profile or {},
            "active_diet_plans": plans.get("diet_plans", []),
            "active_workout_plans": plans.get("workout_plans", []),
        }
    except DatabaseConnectionError as exc:
        return {"status": "error", "message": f"Could not load user context: {exc}"}
