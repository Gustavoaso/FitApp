from langgraph.graph import StateGraph, START, END
from app.agent.state import AgentState
from app.agent.nodes import router_node, context_node, chat_reply_node, tool_execution_node


def route_decision(state: AgentState) -> str:
    intent = state.get("intent", "general_chat")
    if intent in ("generate_plan", "progress_check"):
        return "tool_execution"
    return "chat_reply"


def build_agent_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("context", context_node)
    workflow.add_node("router", router_node)
    workflow.add_node("chat_reply", chat_reply_node)
    workflow.add_node("tool_execution", tool_execution_node)

    workflow.add_edge(START, "context")
    workflow.add_edge("context", "router")
    workflow.add_conditional_edges("router", route_decision)
    workflow.add_edge("chat_reply", END)
    workflow.add_edge("tool_execution", END)

    return workflow.compile()


agent_graph = build_agent_graph()
