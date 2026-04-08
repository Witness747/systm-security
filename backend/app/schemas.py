"""
schemas.py — Pydantic v2 models for FastAPI API and internal data structures.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field, field_validator

# ---------- API request/response models ----------

class PolicyRule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    syscall: str = Field(..., description="Syscall name, e.g., 'open' or 'execve'")
    path_pattern: str = Field(..., description="Glob pattern for the path argument, e.g., '/etc/*'")
    action: Literal["ALLOW", "BLOCK"] = Field(..., description="Action to take when rule matches")

    @field_validator("syscall")
    @classmethod
    def normalize_syscall(cls, v: str) -> str:
        return v.lower()

    @field_validator("action")
    @classmethod
    def normalize_action(cls, v: str) -> str:
        return v.upper()

class SyscallEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    pid: int
    process: str
    syscall: str
    args: List[str]
    result: str
    action: Literal["ALLOWED", "BLOCKED"]

    @field_validator("syscall")
    @classmethod
    def normalize_syscall(cls, v: str) -> str:
        return v.lower()

class HealthResponse(BaseModel):
    status: Literal["ok", "error"] = "ok"
    event_count: int
    blocked_count: int
    allowed_count: int

# ---------- Internal data structures (used by backend) ----------

# The same SyscallEvent model is used internally; we expose it via API.
