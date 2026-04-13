# SCIES — System Call Interface for Enhanced Security

## Project Description

**SCIES** is a cybersecurity simulation and educational platform that models how a hardened operating system kernel handles system calls through a multi-stage security pipeline. Rather than allowing raw, unchecked syscall access, SCIES enforces a structured validation chain — mimicking real-world OS security practices like those found in SELinux, AppArmor, and seccomp-BPF filters.

---

## Core Concept

Every process in an operating system must request privileged resources — files, memory, network sockets — through **system calls**. In most systems, this interface is minimally guarded. SCIES simulates what a *security-first* kernel would look like: one where every syscall passes through layered checks before execution is permitted.

---

## The Four-Stage Security Pipeline

```
[ Process ] ──► [ INIT ] ──► [ AUTHN ] ──► [ ACL ] ──► [ EXEC ]
                  Stage 1      Stage 2       Stage 3     Stage 4
```

| Stage | Name | Responsibility |
|---|---|---|
| **1** | INIT | Registers the syscall, validates process context and syscall signature |
| **2** | AUTHN | Authenticates the calling process — checks credentials, tokens, or session validity |
| **3** | ACL | Evaluates Access Control Lists — does this process *have permission* for this resource? |
| **4** | EXEC | Executes the syscall only if all prior stages pass; logs the outcome |

Any failure at any stage **terminates the request immediately** and raises an alert.

---

## Key Features

### 🔐 Authentication Mechanisms
- Per-process identity tokens with expiry
- Session-based credential validation
- Configurable trust levels (root, user, guest, sandboxed)

### 📋 Configurable ACL Engine
- Define per-resource, per-process permission matrices
- Whitelist/blacklist syscall categories (file I/O, network, process spawning, memory ops)
- Runtime ACL modification with audit trail

### ⚔️ Attack Scenario Simulator
Five built-in attack simulations to test the pipeline's resilience:
1. **Privilege Escalation** — process attempting to gain elevated permissions
2. **Syscall Flooding** — DoS via rapid syscall bursts
3. **Token Forgery** — invalid credential injection
4. **ACL Bypass Attempt** — crafted requests exploiting misconfigured rules
5. **Lateral Movement** — chained syscalls probing unauthorized resources

### 📊 IDS-Style Threat Monitor
- Real-time dashboard showing live syscall traffic
- Anomaly detection with configurable thresholds
- Color-coded severity levels (INFO → WARNING → CRITICAL)
- Persistent, filterable event log

### 📁 Detailed Audit Logging
Every syscall attempt — successful or blocked — is recorded with:
- Timestamp, process ID, syscall type
- Stage at which it was approved or rejected
- Reason for denial, if applicable
- Risk score per event

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend / UI | React 19 + Vite |
| Styling | Tailwind CSS |
| Core Simulation | Vanilla JS modules (`processManager.js`, `attackScenarios.js`) |
| State Management | React Context / useState |
| Visualization | Custom dashboard components |

---

## Why It Matters

SCIES bridges the gap between **theory and practice** in OS security education. It lets developers, students, and security researchers:

- Understand *why* syscall filtering is fundamental to OS hardening
- Visualize how real security layers like **seccomp**, **SELinux**, and **capabilities** work conceptually
- Test attack patterns in a safe, sandboxed environment
- Learn ACL design by seeing the *consequences* of misconfiguration in real time

---
