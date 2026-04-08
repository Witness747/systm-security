"""
config.py — Central configuration constants for the syscall monitoring backend.
All paths and limits are defined here; never hardcoded elsewhere.
"""

import shutil

# ── Strace ────────────────────────────────────────────────────────────────────
STRACE_BIN: str = shutil.which("strace") or "/usr/bin/strace"

# Syscalls to trace (passed to strace -e trace=...)
TRACED_SYSCALLS: list[str] = ["open", "openat", "read", "write", "execve"]

# ── In-memory log ─────────────────────────────────────────────────────────────
MAX_EVENTS: int = 500

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

# ── Demo command ──────────────────────────────────────────────────────────────
# Default command traced when no PID is supplied (used in demo mode).
DEMO_COMMAND: list[str] = ["cat", "/dev/null"]

# ── Proc filesystem ───────────────────────────────────────────────────────────
PROC_COMM_PATH: str = "/proc/{pid}/comm"
