# SCIES — System Call Interface for Enhanced Security

An interactive, educational cybersecurity dashboard that simulates how an OS kernel intercepts and processes system calls through a multi-stage security pipeline. Built to make kernel-level security concepts tangible and explorable for students and learners.

## What It Does

SCIES lets you watch system calls (file reads, network connections, process forks, memory execution) flow through a live **INIT → AUTHN → ACL → EXEC** pipeline in real time. You can trigger attacks, misconfigure ACLs, forge tokens, and observe exactly where and why the kernel blocks or permits each call — all in a browser.

## Key Features

- **Animated Kernel Pipeline** — Visualize each syscall moving through four security stages with live pass/deny feedback
- **Process Control Room** — Manage four simulated processes (user shell, admin daemon, malware agent, web server), toggle ACL rules, and quarantine suspicious actors
- **Token-Based AuthN** — Session tokens with TTL expiry; simulate token forgery and revocation
- **6-Tier Trust Hierarchy** — From Sandboxed up to Root, each syscall enforces a minimum trust requirement
- **Editable ACL Matrix** — Modify per-process, per-syscall permissions on the fly and watch the downstream effects
- **IDS Threat Monitor** — Configurable denial threshold that triggers an UNDER ATTACK alert when the system is flooded
- **Audit Log & Terminal** — Full `auditd`-style log with risk scores, severity levels, and JSON/CSV export

## Attack Scenarios

Five pre-built attack simulations cover real-world patterns:

| Scenario | Pattern |
|---|---|
| Privilege Escalation | Malware forks, execs memory, writes to `/etc/shadow` |
| Syscall Flooding (DoS) | Burst of network/fork calls to overwhelm the pipeline |
| Token Forgery | Invalid credentials injected to bypass authentication |
| ACL Bypass | Probes misconfigured rules across multiple processes |
| Lateral Movement | SSH key reads, cross-network pivoting |

## Tech Stack

- **React 19 + Vite** — Frontend and dev tooling
- **Tailwind CSS v4** — Styling with dark/light theme support
- **OGL (WebGL)** — Radar background on the landing screen
- **useReducer** — Centralized application state

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and start the simulator from the intro screen.
