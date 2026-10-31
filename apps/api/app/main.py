from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Set
import json
import logging
from app.core.config import settings
from app.db.session import engine, Base
from app.api import auth, presentations, ai

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("slidex")

# Create tables in dev database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="slideX Backend API: Auth, Presentation Storage, LLM Generation & WebSocket Sync",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(presentations.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


# WebSocket Room Manager for Real-time Audience View & Mobile Sync
class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, Set[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = set()
        self.active_rooms[room_id].add(websocket)
        logger.info(f"WebSocket connected to room {room_id}. Total: {len(self.active_rooms[room_id])}")

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_rooms:
            self.active_rooms[room_id].discard(websocket)
            if not self.active_rooms[room_id]:
                del self.active_rooms[room_id]
        logger.info(f"WebSocket disconnected from room {room_id}")

    async def broadcast(self, room_id: str, message: dict, sender: WebSocket = None):
        if room_id in self.active_rooms:
            dead_connections = set()
            for connection in self.active_rooms[room_id]:
                if connection != sender:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        dead_connections.add(connection)
            for dead in dead_connections:
                self.active_rooms[room_id].discard(dead)


manager = ConnectionManager()


@app.websocket("/ws/sync/{room_id}")
async def websocket_sync_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            # Broadcast state update (slide index, laser coords, annotation events)
            await manager.broadcast(room_id, message, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(room_id, websocket)
