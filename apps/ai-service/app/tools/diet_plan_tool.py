from app.services.llm_service import get_llm_model, load_prompt_file
from app.schemas.plans import DietPlanSchema, MealItemSchema


def build_diet_fallback() -> DietPlanSchema:
    return DietPlanSchema(
        name="Plano Alimentar Equilibrado Base",
        description="Plano nutricional padrão rico em proteínas e fibras",
        meals=[
            MealItemSchema(
                name="Café da Manhã",
                time="08:00",
                foods="Ovos mexidos com torradas integrais e café sem açúcar",
                calories=400,
                macros="25g P, 30g C, 15g G",
            ),
            MealItemSchema(
                name="Almoço",
                time="12:30",
                foods="Peito de frango grelhado, arroz integral e salada verde",
                calories=650,
                macros="45g P, 50g C, 15g G",
            ),
        ],
    )


async def execute_generate_diet_plan(
    user_id: str, goal: str, diet_pref: str
) -> DietPlanSchema:
    try:
        system_prompt = load_prompt_file("nutritionist")
        llm = get_llm_model()
        structured_llm = llm.with_structured_output(DietPlanSchema)
        user_message = f"Usuário {user_id}: Objetivo={goal}, Preferência={diet_pref}"
        result = await structured_llm.ainvoke(
            [("system", system_prompt), ("human", user_message)]
        )
        if isinstance(result, DietPlanSchema):
            return result
        return build_diet_fallback()
    except Exception as exc:
        print(f"Error generating diet plan: {exc}")
        return build_diet_fallback()
