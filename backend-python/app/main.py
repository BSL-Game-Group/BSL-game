from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.bsl_classes import router as bsl_classes_router
from app.routers.microbes import router as microbes_router
from app.routers.test import router as test_router

app = FastAPI(
    title="BSL Game API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    microbes_router
)

app.include_router(
    bsl_classes_router
)
app.include_router(
    test_router, prefix="/api"
)



@app.get("/")
def root():
    return {
        "message": "Backend is running"
    }