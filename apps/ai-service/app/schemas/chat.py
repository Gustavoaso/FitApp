from pydantic import BaseModel, Field


class ChatMessageSchema(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User chat query")
    conversation_id: str | None = Field(default=None)
    history: list[ChatMessageSchema] = Field(default_factory=list)


class ChatResponse(BaseModel):
    conversation_id: str | None = None
    reply: str
    intent: str | None = None
