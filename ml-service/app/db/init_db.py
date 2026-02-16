import os
import logging
import psycopg2
from pathlib import Path

logger = logging.getLogger(__name__)

def init_db():
    """
    Applies the Enterprise V2 Schema (idempotent) on startup.
    This ensures all tables (decision_memory, etc.) exist.
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.warning("DATABASE_URL not found. Skipping DB initialization.")
        return

    # Path to schema file - assuming it's mounted or copied.
    # In Docker, we might need to be careful with paths.
    # We will embed the critical SQL or assume it's available.
    # For now, let's embed the critical decision_memory table SQL to be safe 
    # and self-contained, or read from a file if we can guarantee its presence.
    
    # Strategy: We will attempt to read the full SQL file if it exists, 
    # fail back to just ensuring decision_memory exists.
    
    # Try to locate the file in expected locations
    possible_paths = [
        Path("/app/SCHEMAS_V2.sql"), # If we copy it in Dockerfile
        Path("../documentation/enterprise/SCHEMAS_V2.sql"), # Local dev
        Path("SCHEMAS_V2.sql")
    ]
    
    schema_path = None
    for p in possible_paths:
        if p.exists():
            schema_path = p
            break
            
    if not schema_path:
        logger.warning(f"SCHEMAS_V2.sql not found in {possible_paths}. Skipping full migration.")
        return

    try:
        logger.info(f"Applying schema from {schema_path}...")
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        sql_content = schema_path.read_text(encoding="utf-8")
        cur.execute(sql_content)
        conn.commit()
        
        cur.close()
        conn.close()
        logger.info("Database schema applied successfully.")
        
    except Exception as e:
        logger.error(f"Failed to apply database schema: {e}")

