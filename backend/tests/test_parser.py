"""
test_parser.py — Unit tests for parse_strace_line()
5 scenarios per requirements.
"""

import pytest
from unittest.mock import patch
from app.parser import parse_strace_line


@patch("app.parser.get_process_name", return_value="cat")
def test_valid_open_line(mock_proc):
    """Scenario 1: Valid open() line → correct dict."""
    line = '12345 openat(AT_FDCWD, "/etc/passwd", O_RDONLY|O_CLOEXEC) = 3'
    result = parse_strace_line(line)
    assert result is not None
    assert result["pid"] == 12345
    assert result["syscall"] == "openat"
    assert "/etc/passwd" in result["args"]
    assert result["result"] == "3"
    assert result["process"] == "cat"


@patch("app.parser.get_process_name", return_value="bash")
def test_valid_execve_line(mock_proc):
    """Scenario 2: Valid execve() with multi-arg → correct parsing."""
    line = '999 execve("/usr/bin/ls", ["ls", "-la"], 0x7ffd12345678 /* 42 vars */) = 0'
    result = parse_strace_line(line)
    assert result is not None
    assert result["pid"] == 999
    assert result["syscall"] == "execve"
    assert result["result"] == "0"


def test_malformed_line_no_equals():
    """Scenario 3: Malformed line (no '=') → returns None."""
    line = '12345 openat(AT_FDCWD, "/etc/passwd")'
    result = parse_strace_line(line)
    assert result is None


def test_unfinished_syscall():
    """Scenario 4: Resumed/unfinished syscall → returns None."""
    line = '12345 read(3, <unfinished ...>'
    result = parse_strace_line(line)
    assert result is None


def test_signal_line():
    """Scenario 5: Signal line (e.g. --- SIGCHLD ---) → returns None."""
    line = '12345 --- SIGCHLD {si_signo=SIGCHLD, si_code=CLD_EXITED} ---'
    result = parse_strace_line(line)
    assert result is None


def test_empty_line():
    """Empty lines should return None."""
    assert parse_strace_line("") is None
    assert parse_strace_line("   ") is None
