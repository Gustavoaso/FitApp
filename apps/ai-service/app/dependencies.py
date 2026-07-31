from fastapi import Header, HTTPException, status


async def validate_user_header(
    x_user_id: str | None = Header(None, alias="X-User-Id")
) -> str:
    if not x_user_id or not x_user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header X-User-Id is mandatory and missing"
        )
    return x_user_id.strip()
