# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

import sys
import logging
from loguru import logger

class InterceptHandler(logging.Handler):
    """
    Default handler from examples in loguru documention.
    """
    def emit(self, record: logging.LogRecord):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        # Use loguru to log
        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

def setup_logging(log_level: str = "INFO", json_format: bool = True):
    """
    Setup logging configuration with loguru
    """
    # Remove standard handlers
    logging.getLogger().handlers.clear()
    
    # Configure Loguru
    logger.remove()
    
    # Always use JSON in production/hardening
    logger.add(
        sys.stdout, 
        format="{message}", 
        filter=lambda record: "/health" not in record["message"], 
        serialize=True, 
        level=log_level
    )

    # Intercept standard logging messages
    logging.basicConfig(handlers=[InterceptHandler()], level=0)
    for _log in ['uvicorn', 'uvicorn.error', 'uvicorn.access', 'fastapi']:
        _logger = logging.getLogger(_log)
        _logger.handlers = [InterceptHandler()]
