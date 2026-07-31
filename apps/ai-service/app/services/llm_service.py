from pathlib import Path
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import get_settings


def load_prompt_file(prompt_name: str) -> str:
    base_dir = Path(__file__).parent.parent / "prompts"
    file_path = base_dir / f"{prompt_name}.md"
    try:
        return file_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return "Você é o assistente virtual do FitApp."


def get_llm_model(temperature: float = 0.7) -> ChatGoogleGenerativeAI:
    settings = get_settings()
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.google_api_key,
        temperature=temperature,
    )
