from fastapi import FastAPI
from app.routers.chat import router as chat_router
from app.routers.plans import router as plans_router
from app.config import get_settings

app: FastAPI = FastAPI(
    title="FitApp AI Service",
    description="FastAPI + LangGraph AI Service for Fitnesis",
    version="1.0.0",
)

app.include_router(chat_router)
app.include_router(plans_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "ai-service"}


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
