from fastapi import FastAPI
import uvicorn

app: FastAPI = FastAPI(title="FitApp AI Service", version="1.0.0")

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "AI Service is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
