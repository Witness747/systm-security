"""
test_policy.py — Unit tests for PolicyEngine.check_syscall()
5 scenarios per requirements.
"""

import pytest
from app.policy import PolicyEngine
from app.schemas import PolicyRule


@pytest.fixture
def engine():
    return PolicyEngine()


def test_no_rules_allows_all(engine):
    """Scenario 1: No rules → all events ALLOWED."""
    event = {"syscall": "open", "args": ["/etc/passwd"]}
    assert engine.check_syscall(event) == "ALLOWED"


def test_matching_block_rule(engine):
    """Scenario 2: Matching BLOCK rule → event marked BLOCKED."""
    engine.add_rule(PolicyRule(syscall="open", path_pattern="/etc/shadow", action="BLOCK"))
    event = {"syscall": "open", "args": ["/etc/shadow"]}
    assert engine.check_syscall(event) == "BLOCKED"


def test_non_matching_syscall(engine):
    """Scenario 3: Non-matching rule (different syscall) → ALLOWED."""
    engine.add_rule(PolicyRule(syscall="write", path_pattern="/etc/shadow", action="BLOCK"))
    event = {"syscall": "open", "args": ["/etc/shadow"]}
    assert engine.check_syscall(event) == "ALLOWED"


def test_wildcard_path_pattern(engine):
    """Scenario 4: Wildcard path pattern /etc/* matches /etc/shadow → BLOCKED."""
    engine.add_rule(PolicyRule(syscall="open", path_pattern="/etc/*", action="BLOCK"))
    event = {"syscall": "open", "args": ["/etc/shadow"]}
    assert engine.check_syscall(event) == "BLOCKED"


def test_first_block_wins(engine):
    """Scenario 5: Multiple rules, first BLOCK wins."""
    engine.add_rule(PolicyRule(syscall="open", path_pattern="/etc/shadow", action="BLOCK"))
    engine.add_rule(PolicyRule(syscall="open", path_pattern="/etc/shadow", action="ALLOW"))
    event = {"syscall": "open", "args": ["/etc/shadow"]}
    assert engine.check_syscall(event) == "BLOCKED"


def test_add_and_delete_rule(engine):
    """Add a rule, then delete it, verify it's gone."""
    rule = engine.add_rule(PolicyRule(syscall="read", path_pattern="/tmp/*", action="BLOCK"))
    assert len(engine.list_rules()) == 1
    assert engine.delete_rule(rule.id)
    assert len(engine.list_rules()) == 0


def test_delete_nonexistent(engine):
    """Deleting a nonexistent rule returns False."""
    assert engine.delete_rule("nonexistent-id") is False
