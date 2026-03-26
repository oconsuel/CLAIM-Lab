import os
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str


def _get_jwt_secret() -> str:
    if not JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Сервер не настроен: отсутствует JWT_SECRET",
        )
    return JWT_SECRET


def create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    secret = _get_jwt_secret()
    return jwt.encode(
        {"sub": username, "exp": expire}, secret, algorithm=JWT_ALGORITHM
    )


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    try:
        secret = _get_jwt_secret()
        payload = jwt.decode(
            credentials.credentials, secret, algorithms=[JWT_ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


router = APIRouter()


@router.post("/admin/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    if not ADMIN_USERNAME or not ADMIN_PASSWORD or not JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Сервер не настроен: отсутствуют ADMIN_USERNAME/ADMIN_PASSWORD/JWT_SECRET",
        )
    if not secrets.compare_digest(req.username, ADMIN_USERNAME) or not secrets.compare_digest(
        req.password, ADMIN_PASSWORD
    ):
        raise HTTPException(status_code=401, detail="Неверные учётные данные")
    token = create_token(req.username)
    return LoginResponse(token=token)
