from app.services.supabase_service import fetch_user_tasks
from app.exceptions import DatabaseConnectionError


async def execute_analyze_user_progress(user_id: str) -> dict[str, object]:
    try:
        tasks = await fetch_user_tasks(user_id)
        if not tasks:
            return {"status": "success", "completion_rate": 0.0, "feedback": "Nenhuma tarefa registrada recentemente."}
        total = len(tasks)
        done = sum(1 for t in tasks if t.get("is_done") is True)
        rate = round((done / total) * 100, 1)
        feedback = f"Você completou {done} de {total} tarefas ({rate}%)."
        return {"status": "success", "completion_rate": rate, "feedback": feedback}
    except DatabaseConnectionError as exc:
        return {"status": "error", "message": f"Erro ao analisar progresso: {exc}"}
