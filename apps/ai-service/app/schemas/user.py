from pydantic import BaseModel


class UserProfileSchema(BaseModel):
    user_id: str
    name: str | None = None
    email: str | None = None
    goal: str | None = None
    body_type: str | None = None
    activity: str | None = None
    diet_pref: str | None = None
    schedule: str | None = None


class UserContextSchema(BaseModel):
    profile: UserProfileSchema | None = None
    active_diet_plans_count: int = 0
    active_workout_plans_count: int = 0
