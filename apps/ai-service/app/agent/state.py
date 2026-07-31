from typing import TypedDict
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    user_id: str
    messages: list[BaseMessage]
    intent: str
    user_context: dict[str, object]
    final_response: str
    plan_output: dict[str, object] | None
