from app.agent.state import AgentState
from app.services.llm_service import get_llm_model, load_prompt_file
from app.tools.user_context_tool import execute_get_user_context
from app.tools.progress_tool import execute_analyze_user_progress


async def router_node(state: AgentState) -> dict[str, object]:
    msgs = state.get("messages", [])
    last_text = msgs[-1].content if msgs else ""
    text_lower = str(last_text).lower()
    if "plano" in text_lower or "dieta" in text_lower or "treino" in text_lower:
        intent = "generate_plan"
    elif "progresso" in text_lower or "tarefa" in text_lower:
        intent = "progress_check"
    else:
        intent = "general_chat"
    return {"intent": intent}


async def context_node(state: AgentState) -> dict[str, object]:
    user_id = state.get("user_id", "")
    ctx = await execute_get_user_context(user_id)
    return {"user_context": ctx}


async def chat_reply_node(state: AgentState) -> dict[str, object]:
    system_prompt = load_prompt_file("coach")
    llm = get_llm_model()
    messages = [("system", system_prompt)]
    for msg in state.get("messages", []):
        messages.append(("human" if msg.type == "human" else "ai", str(msg.content)))
    try:
        response = await llm.ainvoke(messages)
        return {"final_response": str(response.content)}
    except Exception as exc:
        print(f"Error in chat_reply_node: {exc}")
        return {"final_response": "Desculpe, tive um problema ao processar sua resposta."}


async def tool_execution_node(state: AgentState) -> dict[str, object]:
    user_id = state.get("user_id", "")
    intent = state.get("intent", "general_chat")
    if intent == "progress_check":
        progress = await execute_analyze_user_progress(user_id)
        msg = str(progress.get("feedback", "Progresso analisado."))
        return {"final_response": msg}
    return {"final_response": "Intenção processada via agente de IA."}
