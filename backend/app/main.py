"""
main.py — FastAPI application entry point.
Defines routes, CORS, health, and integrates tracer, policy, and log.
"""

import logging
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from typing import List

from app.config import CORS_ORIGINS
from app.schemas import PolicyRule, SyscallEvent, HealthResponse
from app.policy import policy_engine
from app.tracer import tracer_manager
from app.logs import syscall_log

logger = logging.getLogger(__name__)

app = FastAPI(title="Syscall Monitoring Demo", version="0.1.0")

# CORS – restrict to localhost dev server only
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

# ---------- LIFECYCLE ----------

@app.on_event("startup")
async def startup_event():
    logger.info("FastAPI startup – tracer idle.")

@app.on_event("shutdown")
async def shutdown_event():
    await tracer_manager.stop()
    logger.info("FastAPI shutdown – tracer stopped.")

# ---------- HEALTH ----------

@app.get("/health", response_model=HealthResponse)
async def health():
    counts = await syscall_log.counts()
    return HealthResponse(
        status="ok",
        event_count=counts["total"],
        blocked_count=counts["blocked"],
        allowed_count=counts["allowed"],
    )

# ---------- SYSCALL LOG ----------

@app.get("/syscalls", response_model=List[SyscallEvent])
async def get_syscalls(limit: int = 100):
    return await syscall_log.get_latest(limit)

# ---------- POLICY ----------

@app.get("/policy", response_model=List[PolicyRule])
async def list_policy():
    return policy_engine.list_rules()

@app.post("/policy", response_model=PolicyRule, status_code=201)
async def create_policy(rule: PolicyRule = Body(...)):
    return policy_engine.add_rule(rule)

@app.delete("/policy/{rule_id}", status_code=204)
async def delete_policy(rule_id: str):
    removed = policy_engine.delete_rule(rule_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Policy rule not found")
    return Response(status_code=204)

# ---------- TRACER CONTROL ----------

@app.post("/tracer/start", status_code=200)
async def start_tracer(pid: int | None = Body(None, description="Target PID to trace; if omitted, demo command is used")):
    await tracer_manager.start(target_pid=pid)
    return {"detail": "Tracer started"}

@app.post("/tracer/stop", status_code=200)
async def stop_tracer():
    await tracer_manager.stop()
    return {"detail": "Tracer stopped"}

# FastAPI automatically provides /docs and /redoc.
