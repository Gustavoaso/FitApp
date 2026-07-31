from app.services.llm_service import get_llm_model, load_prompt_file
from app.schemas.plans import DietPlanSchema, WorkoutPlanSchema
from app.tools.diet_plan_tool import build_diet_fallback
from app.tools.workout_plan_tool import build_workout_fallback


async def execute_customize_plan(
    user_id: str, plan_type: str, prompt: str
) -> DietPlanSchema | WorkoutPlanSchema:
    try:
        llm = get_llm_model()
        if plan_type == "diet":
            sys_prompt = load_prompt_file("nutritionist")
            sl = llm.with_structured_output(DietPlanSchema)
            res = await sl.ainvoke([("system", sys_prompt), ("human", f"Refinar plano: {prompt}")])
            return res if isinstance(res, DietPlanSchema) else build_diet_fallback()
        else:
            sys_prompt = load_prompt_file("trainer")
            sl = llm.with_structured_output(WorkoutPlanSchema)
            res = await sl.ainvoke([("system", sys_prompt), ("human", f"Refinar treino: {prompt}")])
            return res if isinstance(res, WorkoutPlanSchema) else build_workout_fallback()
    except Exception as exc:
        print(f"Error customizing plan: {exc}")
        return build_diet_fallback() if plan_type == "diet" else build_workout_fallback()
