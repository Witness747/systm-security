"""
logs.py — In‑memory capped event store.
"""

import asyncio
from collections import deque
from typing import Deque, List

from app.schemas import SyscallEvent

# Thread‑safe (via asyncio.Lock) capped deque for events.

class SyscallLog:
    def __init__(self, maxlen: int = 500):
        self._events: Deque[SyscallEvent] = deque(maxlen=maxlen)
        self._lock = asyncio.Lock()

    async def add_event(self, event: SyscallEvent) -> None:
        async with self._lock:
            self._events.append(event)

    async def get_latest(self, limit: int = 100) -> List[SyscallEvent]:
        async with self._lock:
            # Return newest first
            return list(reversed(list(self._events)[-limit:]))

    async def counts(self) -> dict:
        async with self._lock:
            blocked = sum(1 for e in self._events if e.action == "BLOCKED")
            allowed = sum(1 for e in self._events if e.action == "ALLOWED")
            return {"total": len(self._events), "blocked": blocked, "allowed": allowed}

# Global singleton used by the tracer and API handlers.
syscall_log = SyscallLog()
