"""
Structured logging setup.

Rule: never log passwords, access tokens, API keys, or report content/PII.
Only log operational metadata (route, status, duration, request id).
"""
import logging
import sys

from app.config import get_settings


class SafeFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        # Defensive: ensure nothing accidentally tagged as sensitive slips through.
        if hasattr(record, "authorization") or hasattr(record, "token"):
            record.msg = "[redacted log field omitted]"
        return super().format(record)


def configure_logging() -> None:
    settings = get_settings()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        SafeFormatter(
            fmt='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}'
        )
    )
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(settings.LOG_LEVEL)

    # Keep third-party libraries from dumping noisy/sensitive request internals.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)