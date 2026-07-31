from app.services.llm_service import get_llm_model, load_prompt_file
from app.schemas.plans import WorkoutPlanSchema, ExerciseItemSchema


def build_workout_fallback() -> WorkoutPlanSchema:
    return WorkoutPlanSchema(
        name="Treino Geral de Adaptação",
        description="Foco em hipertrofia e fortalecimento muscular global",
        exercises=[
            ExerciseItemSchema(name="Agachamento Livre", sets=4, reps="10-12", rest="60s"),
            ExerciseItemSchema(name="Supino Reto com Barra", sets=4, reps="10", rest="60s"),
            ExerciseItemSchema(name="Puxada Frontal", sets=3, reps="12", rest="45s"),
        ],
    )


async def execute_generate_workout_plan(
    user_id: str, goal: str, activity: str
) -> WorkoutPlanSchema:
    try:
        system_prompt = load_prompt_file("trainer")
        llm = get_llm_model()
        structured_llm = llm.with_structured_output(WorkoutPlanSchema)
        user_msg = f"Usuário {user_id}: Objetivo={goal}, Nível={activity}"
        result = await structured_llm.ainvoke(
            [("system", system_prompt), ("human", user_msg)]
        )
        if isinstance(result, WorkoutPlanSchema):
            return result
        return build_workout_fallback()
    except Exception as exc:
        print(f"Error generating workout plan: {exc}")
        return build_workout_fallback()
