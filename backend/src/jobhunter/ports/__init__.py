"""Ports: the interfaces services use for infrastructure (SPEC Part 3, Deployment).

Business code depends on these protocols only. Each provider gets an adapter in
`jobhunter.adapters`, picked from settings, so no service imports a cloud SDK.
"""

from jobhunter.ports.queue import MessageQueue
from jobhunter.ports.storage import FileStorage

__all__ = ["FileStorage", "MessageQueue"]
