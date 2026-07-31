from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import validate_user_header
from app.schemas.plans import (
    GeneratePlanRequest,
    PlanCustomizationRequest,
    DietPlanSchema,
    WorkoutPlanSchema,
)
from app.tools.diet_plan_tool import execute_generate_diet_plan
from app.tools.workout_plan_tool import execute_generate_workout_plan
from app.tools.customize_plan_tool import execute_customize_plan

router = APIRouter(prefix="/plans", tags=["Plans"])


@router.post("/generate")
async def generate_plan_endpoint(
    req: GeneratePlanRequest,
    user_id: str = Depends(validate_user_header),
) -> dict[str, object]:
    details = req.details or {}
    goal = details.get("goal", "Saúde e Hipertrofia")
    if req.plan_type == "diet":
        plan = await execute_generate_diet_plan(user_id, goal, details.get("diet_pref", "Sem restrições"))
        return {"plan_type": "diet", "data": plan.model_dump()}
    elif req.plan_type == "workout":
        plan = await execute_generate_workout_plan(user_id, goal, details.get("activity", "Intermediário"))
        return {"plan_type": "workout", "data": plan.model_dump()}
    elif req.plan_type == "both":
        diet = await execute_generate_diet_plan(user_id, goal, details.get("diet_pref", "Equilibrada"))
        workout = await execute_generate_workout_plan(user_id, goal, details.get("activity", "Intermediário"))
        return {"diet": diet.model_dump(), "workout": workout.model_dump()}
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan_type")


@router.post("/customize")
async def customize_plan_endpoint(
    req: PlanCustomizationRequest,
    user_id: str = Depends(validate_user_header),
) -> dict[str, object]:
    res = await execute_customize_plan(user_id, req.plan_type, req.prompt)
    return {"plan_id": req.plan_id, "plan_type": req.plan_type, "data": res.model_dump()}
