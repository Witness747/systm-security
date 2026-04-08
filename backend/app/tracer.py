"""
tracer.py — strace Manager
Manages the asyncio strace subprocess. Never blocks the event loop.
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional

from app.config import STRACE_BIN, TRACED_SYSCALLS, DEMO_COMMAND
from app.parser import parse_strace_line
from app.policy import policy_engine
from app.logs import syscall_log
from app.schemas import SyscallEvent

logger = logging.getLogger(__name__)


class TracerManager:
    def __init__(self):
        self.process: Optional[asyncio.subprocess.Process] = None
        self._task: Optional[asyncio.Task] = None
        self._target_process: Optional[asyncio.subprocess.Process] = None

    @property
    def is_running(self) -> bool:
        return self.process is not None and self.process.returncode is None

    async def start(self, target_pid: Optional[int] = None) -> None:
        """Starts the strace subprocess."""
        if self.is_running:
            logger.warning("Tracer is already running.")
            return

        cmd = [STRACE_BIN, "-f", "-e", f"trace={','.join(TRACED_SYSCALLS)}"]
        
        if target_pid:
            cmd.extend(["-p", str(target_pid)])
            logger.info("Starting tracer with command: %s on PID: %d", cmd, target_pid)
        else:
            # Start demo command
            self._target_process = await asyncio.create_subprocess_exec(
                *DEMO_COMMAND,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL
            )
            cmd.extend(["-p", str(self._target_process.pid)])
            logger.info("Starting tracer and demo command: %s on PID: %d", cmd, self._target_process.pid)

        # SECURITY: asyncio.create_subprocess_exec does NOT use the shell.
        # It passes args directly via execve.
        try:
            self.process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            self._task = asyncio.create_task(self._reader_loop())
        except Exception as e:
            logger.error("Failed to start tracer: %s", e)
            if self._target_process:
                self._target_process.terminate()
            raise

    async def stop(self) -> None:
        """Stops the strace subprocess."""
        if self.process and self.process.returncode is None:
            self.process.terminate()
            try:
                await asyncio.wait_for(self.process.wait(), timeout=2.0)
            except asyncio.TimeoutError:
                logger.warning("Tracer did not terminate, killing it.")
                self.process.kill()
        
        if self._target_process and self._target_process.returncode is None:
            self._target_process.terminate()
            try:
                await asyncio.wait_for(self._target_process.wait(), timeout=1.0)
            except asyncio.TimeoutError:
                self._target_process.kill()

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
                
        self.process = None
        self._task = None
        self._target_process = None
        logger.info("Tracer stopped.")

    async def _reader_loop(self) -> None:
        """Non-blocking loop to read stderr from strace (strace outputs to stderr)."""
        if not self.process or not self.process.stderr:
            return

        try:
            while True:
                line = await self.process.stderr.readline()
                if not line:
                    break
                
                try:
                    decoded_line = line.decode('utf-8')
                except UnicodeDecodeError:
                    continue

                parsed = parse_strace_line(decoded_line)
                if parsed:
                    # Evaluate policy
                    action = policy_engine.check_syscall(parsed)
                    
                    # Create event
                    event = SyscallEvent(
                        timestamp=datetime.utcnow().isoformat() + "Z",
                        pid=parsed["pid"],
                        process=parsed["process"],
                        syscall=parsed["syscall"],
                        args=parsed["args"],
                        result=parsed["result"],
                        action=action
                    )
                    
                    # Store event
                    await syscall_log.add_event(event)
                    logger.info("Parsed event: PID=%d Syscall=%s Action=%s", event.pid, event.syscall, event.action)

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error("Error in tracer reader loop: %s", e)

tracer_manager = TracerManager()
