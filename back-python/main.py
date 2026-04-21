import os
import asyncpg
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="Health Check API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
DATABASE_URL = os.getenv("DATABASE_URL")

async def build_health_status():
    health_status = {
        "server": "up",
        "database": "unknown",
        "status": "ok",
    }

    if not DATABASE_URL:
        health_status["database"] = "unconfigured"
        health_status["status"] = "degraded"
        health_status["details"] = "DATABASE_URL is missing"
        return health_status

    try:
        conn = await asyncpg.connect(DATABASE_URL)
        await conn.execute("SELECT 1")
        await conn.close()
        health_status["database"] = "connected"
        return health_status

    except Exception as e:
        health_status["database"] = "disconnected"
        health_status["status"] = "degraded"
        health_status["error_details"] = str(e)
        return health_status

@app.get("/health", tags=["Health"])
async def health_check():
    """Liveness-style health endpoint. 200 as long as the API is reachable."""
    return await build_health_status()

@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness endpoint for orchestrators. 503 until the DB is reachable."""
    health_status = await build_health_status()
    if health_status["database"] == "connected":
        return health_status

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content=health_status
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
    )
