"""
parser.py — Strace Output Parser
Converts raw strace output lines into structured dictionaries.
"""

import logging
import re
from typing import Any, Optional
from app.config import PROC_COMM_PATH

logger = logging.getLogger(__name__)

# Regex to parse standard strace lines:
# Example: 12345 openat(AT_FDCWD, "/etc/passwd", O_RDONLY|O_CLOEXEC) = 3
# Regex captures:
# 1. PID: (\d+)
# 2. Syscall: (\w+)
# 3. Arguments: (.*)
# 4. Result: (.*)
STRACE_PATTERN = re.compile(r'^(\d+)\s+(\w+)\((.*)\)\s+=\s+(.*)$')


def get_process_name(pid: int) -> str:
    """Reads /proc/<pid>/comm to get the process name. Returns 'unknown' on failure."""
    try:
        with open(PROC_COMM_PATH.format(pid=pid), 'r') as f:
            return f.read().strip()
    except Exception:
        return "unknown"


def parse_args(args_str: str) -> list[str]:
    """Splits strace argument string into a list of arguments."""
    # This is a naive parser for the demo.
    # It splits by comma but respects quotes (mostly).
    args = []
    current_arg = []
    in_quotes = False
    
    for char in args_str:
        if char == '"' and (not current_arg or current_arg[-1] != '\\'):
            in_quotes = not in_quotes
            current_arg.append(char)
        elif char == ',' and not in_quotes:
            args.append("".join(current_arg).strip())
            current_arg = []
        else:
            current_arg.append(char)
            
    if current_arg:
        args.append("".join(current_arg).strip())
        
    # Clean up outer quotes for strings
    cleaned_args = []
    for a in args:
        if a.startswith('"') and a.endswith('"') and len(a) >= 2:
            cleaned_args.append(a[1:-1])
        else:
            cleaned_args.append(a)
            
    return cleaned_args


def parse_strace_line(line: str) -> Optional[dict[str, Any]]:
    """
    Parses a single line of strace output.
    Returns a dict with parsed fields, or None if the line is malformed or unfinished.
    """
    line = line.strip()
    if not line:
        return None

    # Skip signals, exits, and unfinished syscalls 
    # (e.g. "12345 +++ exited with 0 +++" or "12345 --- SIGCHLD ---" or "<unfinished ...>")
    if '+++' in line or '---' in line or '<unfinished' in line or 'resumed>' in line:
        logger.debug("Skipping non-syscall / unfinished line: %s", line)
        return None

    match = STRACE_PATTERN.match(line)
    if not match:
        logger.debug("Line did not match regex: %s", line)
        return None

    pid_str, syscall, args_str, result = match.groups()
    pid = int(pid_str)

    # Resolve process name
    process_name = get_process_name(pid)

    return {
        "pid": pid,
        "process": process_name,
        "syscall": syscall.lower(),
        "args": parse_args(args_str),
        "result": result.strip()
    }
