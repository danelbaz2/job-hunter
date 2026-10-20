"""Event contracts shared by the three services. The only code they share besides the ports."""

from jobhunter.contracts.events import Event, SearchRequested, parse_event

__all__ = ["Event", "SearchRequested", "parse_event"]
