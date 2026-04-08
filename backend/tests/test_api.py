"""
test_api.py — Integration tests for the FastAPI routes.
Uses httpx.AsyncClient for async testing.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.logs import syscall_log
from app.policy import policy_engine
from app.schemas import SyscallEvent


@pytest.fixture(autouse=True)
async def reset_state():
    """Reset state between tests."""
    syscall_log._events.clear()
    policy_engine.clear()
    yield


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_health_endpoint(client):
    """GET /health returns valid HealthResponse."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "event_count" in data
    assert "blocked_count" in data
    assert "allowed_count" in data


@pytest.mark.asyncio
async def test_get_empty_syscalls(client):
    """GET /syscalls returns empty list when no events."""
    resp = await client.get("/syscalls")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create_and_get_policy(client):
    """POST /policy creates a rule, GET /policy returns it."""
    payload = {"syscall": "open", "path_pattern": "/etc/shadow", "action": "BLOCK"}
    resp = await client.post("/policy", json=payload)
    assert resp.status_code == 201
    rule = resp.json()
    assert rule["syscall"] == "open"
    assert rule["path_pattern"] == "/etc/shadow"
    assert rule["action"] == "BLOCK"
    assert "id" in rule

    # Get all policies
    resp2 = await client.get("/policy")
    assert resp2.status_code == 200
    assert len(resp2.json()) == 1


@pytest.mark.asyncio
async def test_delete_policy(client):
    """DELETE /policy/{id} removes the rule."""
    payload = {"syscall": "open", "path_pattern": "/etc/shadow", "action": "BLOCK"}
    resp = await client.post("/policy", json=payload)
    rule_id = resp.json()["id"]

    # Delete
    resp2 = await client.delete(f"/policy/{rule_id}")
    assert resp2.status_code == 204

    # Verify gone
    resp3 = await client.get("/policy")
    assert len(resp3.json()) == 0


@pytest.mark.asyncio
async def test_integration_block_rule_flags_event(client):
    """
    Integration test:
    1. POST a block rule for open + /etc/shadow
    2. Manually insert a matching event
    3. GET /syscalls → verify event has action BLOCKED
    """
    # Step 1: Add block rule
    payload = {"syscall": "open", "path_pattern": "/etc/shadow", "action": "BLOCK"}
    await client.post("/policy", json=payload)

    # Step 2: Manually insert a matching event with BLOCKED action
    from app.policy import policy_engine as pe
    action = pe.check_syscall({"syscall": "open", "args": ["/etc/shadow"]})
    event = SyscallEvent(
        timestamp="2026-04-08T12:00:00Z",
        pid=1234,
        process="cat",
        syscall="open",
        args=["/etc/shadow"],
        result="3",
        action=action
    )
    await syscall_log.add_event(event)

    # Step 3: Verify
    resp = await client.get("/syscalls")
    assert resp.status_code == 200
    events = resp.json()
    assert len(events) == 1
    assert events[0]["action"] == "BLOCKED"


@pytest.mark.asyncio
async def test_delete_nonexistent_policy_404(client):
    """DELETE /policy/{id} with nonexistent ID returns 404."""
    resp = await client.delete("/policy/nonexistent-id")
    assert resp.status_code == 404
