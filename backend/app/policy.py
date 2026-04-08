"""
policy.py — In‑memory policy engine.

Rules are stored in memory for the demo. Each syscall event is tagged as:
- "BLOCKED" if it matches a rule with action="BLOCK"
- "ALLOWED" otherwise
"""

from __future__ import annotations

import fnmatch
from dataclasses import dataclass, field
from typing import List

from app.schemas import PolicyRule


@dataclass
class PolicyEngine:
    _rules: List[PolicyRule] = field(default_factory=list)

    def list_rules(self) -> List[PolicyRule]:
        return list(self._rules)

    def add_rule(self, rule: PolicyRule) -> PolicyRule:
        self._rules.append(rule)
        return rule

    def delete_rule(self, rule_id: str) -> bool:
        original_len = len(self._rules)
        self._rules = [r for r in self._rules if r.id != rule_id]
        return len(self._rules) < original_len

    def clear(self) -> None:
        self._rules.clear()

    def check_syscall(self, event: dict) -> str:
        """
        Returns "BLOCKED" or "ALLOWED" for a parsed strace event dict:
        {"syscall": str, "args": list[str], ...}
        """
        syscall = (event.get("syscall") or "").lower()
        args = event.get("args") or []

        for rule in self._rules:
            if rule.syscall.lower() != syscall:
                continue

            # Path matching: try to find the first string arg that looks like a path.
            target_path = next(
                (a for a in args if isinstance(a, str) and "/" in a),
                None,
            )
            if not target_path:
                continue

            if fnmatch.fnmatch(target_path, rule.path_pattern):
                return "BLOCKED" if rule.action.upper() == "BLOCK" else "ALLOWED"

        return "ALLOWED"


# Global singleton used by API + tracer
policy_engine = PolicyEngine()
