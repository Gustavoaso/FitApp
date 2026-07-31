import os
from pydantic import BaseModel


class Settings(BaseModel):
    port: int = int(os.getenv("PORT", "8000"))
    supabase_url: str = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "your-local-anon-key")
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "your-google-gemini-key")


def get_settings() -> Settings:
    return Settings()
