import logging
import sys
from typing import Any

class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return record.getMessage().find("/health") == -1

def setup_logging(log_level: str = "INFO", json_format: bool = False):
    """
    Setup logging configuration
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    for handler in root_logger.handlers:
        root_logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    
    if json_format:
        # JSON formatter for production (e.g., simplified here)
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
        )
    else:
        # Standard formatter for development
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        
    console_handler.setFormatter(formatter)
    
    # Filter health checks from access logs if using uvicorn
    logging.getLogger("uvicorn.access").addFilter(EndpointFilter())
    
    root_logger.addHandler(console_handler)
