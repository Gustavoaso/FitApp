from pydantic import BaseModel, Field


class MealItemSchema(BaseModel):
    name: str = Field(..., description="Meal title e.g. Cafe da Manha")
    time: str = Field(..., description="Suggested time e.g. 08:00")
    foods: str = Field(..., description="Food items and quantities")
    calories: int = Field(..., description="Estimated calories")
    macros: str | None = Field(None, description="Protein, Carbs, Fats breakdown")


class DietPlanSchema(BaseModel):
    name: str = Field(..., description="Plan title")
    description: str = Field(..., description="Plan summary and goal alignment")
    meals: list[MealItemSchema] = Field(default_factory=list)


class ExerciseItemSchema(BaseModel):
    name: str = Field(..., description="Exercise name e.g. Supino Reto")
    sets: int = Field(..., description="Number of sets")
    reps: str = Field(..., description="Reps specification e.g. 10-12")
    rest: str | None = Field(None, description="Rest period e.g. 60s")


class WorkoutPlanSchema(BaseModel):
    name: str = Field(..., description="Workout plan title")
    description: str = Field(..., description="Workout plan overview")
    exercises: list[ExerciseItemSchema] = Field(default_factory=list)


class GeneratePlanRequest(BaseModel):
    plan_type: str = Field(..., description="Type of plan: 'diet', 'workout', or 'both'")
    details: dict[str, str] | None = Field(default=None)


class PlanCustomizationRequest(BaseModel):
    plan_id: str
    plan_type: str
    prompt: str
