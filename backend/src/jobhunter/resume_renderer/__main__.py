import logging

from jobhunter.contracts.events import AnyEvent
from jobhunter.worker import run

QUEUE = "rendering"
logger = logging.getLogger("resume_renderer")


async def handle(event: AnyEvent) -> None:
    # Phase 3: render the tailored resume to PDF/DOCX, store it through FileStorage,
    # then publish `resume.rendered`. Until then this service only proves the wiring.
    logger.info("received %s", event.type)


if __name__ == "__main__":
    run(QUEUE, handle)
