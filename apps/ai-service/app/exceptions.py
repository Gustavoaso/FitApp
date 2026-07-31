class AIServiceError(Exception):
    """Base exception for AI Service."""
    pass


class UserNotFoundError(AIServiceError):
    """Raised when a user profile is not found."""
    pass


class LLMGenerationError(AIServiceError):
    """Raised when LLM plan generation fails."""
    pass


class DatabaseConnectionError(AIServiceError):
    """Raised when database query fails."""
    pass
