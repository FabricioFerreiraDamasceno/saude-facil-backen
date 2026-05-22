from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import jwt
from app.core.config import settings

router = APIRouter()

connections = []


def decode_token(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        print("❌ Token expirado")
        return None
    except jwt.InvalidTokenError:
        print("❌ Token inválido")
        return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=1008)
        return

    payload = decode_token(token)

    if not payload:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    connections.append(websocket)

    print("✅ WebSocket conectado:", payload.get("email"))

    try:
        while True:
            data = await websocket.receive_text()

            for conn in connections:
                await conn.send_text(f"{payload.get('email')}: {data}")

    except WebSocketDisconnect:
        connections.remove(websocket)
        print("🔌 Cliente desconectado")