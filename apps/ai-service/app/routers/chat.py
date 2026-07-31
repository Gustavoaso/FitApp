import json
import asyncio
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from app.dependencies import validate_user_header
from app.schemas.chat import ChatRequest
from app.agent.graph import agent_graph

router = APIRouter(prefix="/chat", tags=["Chat"])


async def sse_event_generator(user_id: str, request: ChatRequest):
    try:
        state = {
            "user_id": user_id,
            "messages": [HumanMessage(content=request.message)],
            "intent": "general_chat",
            "user_context": {},
            "final_response": "",
            "plan_output": None,
        }
        res = await agent_graph.ainvoke(state)
        response_text = res.get("final_response", "Processado.")
        for word in response_text.split(" "):
            yield f"data: {json.dumps({'content': word + ' '})}\n\n"
            await asyncio.sleep(0.02)
        yield "data: [DONE]\n\n"
    except Exception as exc:
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"


@router.post("", response_class=StreamingResponse)
async def chat_endpoint(
    request: ChatRequest,
    user_id: str = Depends(validate_user_header),
) -> StreamingResponse:
    return StreamingResponse(
        sse_event_generator(user_id, request),
        media_type="text/event-stream",
    )
