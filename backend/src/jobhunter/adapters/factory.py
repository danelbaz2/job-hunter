from jobhunter.adapters.memory import InMemoryQueue, InMemoryStorage
from jobhunter.adapters.redis_queue import RedisQueue
from jobhunter.ports import FileStorage, MessageQueue
from jobhunter.settings import Settings


def build_queue(settings: Settings) -> MessageQueue:
    if settings.queue_backend == "redis":
        return RedisQueue(settings.redis_url)
    return InMemoryQueue()


def build_storage(settings: Settings) -> FileStorage:
    if settings.storage_backend == "s3":
        # Phase 3 (ATS resumes) adds the S3-compatible adapter; MinIO already runs in compose.
        raise NotImplementedError("S3 storage adapter arrives with phase 3")
    return InMemoryStorage()
