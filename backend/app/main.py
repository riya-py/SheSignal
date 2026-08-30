from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.errors import register_exception_handlers
from app.logging_config import configure_logging
from app.routers import health, patterns, recommendations, reports, risk, route_risk

configure_logging()
settings = get_settings()

app = FastAPI(title="SheSignal API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

register_exception_handlers(app)

app.include_router(health.router)
app.include_router(reports.router)
app.include_router(patterns.router)
app.include_router(risk.router)
app.include_router(route_risk.router)
app.include_router(recommendations.router)

@app.get("/")
def root():
    return {"message": "SheSignal API is running"}