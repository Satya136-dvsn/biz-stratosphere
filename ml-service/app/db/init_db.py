# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

import os
from pathlib import Path
from loguru import logger
import asyncpg

async def init_db():
    """
    Applies the Enterprise V2 Schema (idempotent) on startup using asyncpg.
    This ensures all tables (decision_memory, etc.) exist.
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.warning("DATABASE_URL not found. Skipping DB initialization.")
        return
        
    # asyncpg uses postgres:// or postgresql:// natively
    
    possible_paths = [
        Path("/app/SCHEMAS_V2.sql"), 
        Path("../documentation/enterprise/SCHEMAS_V2.sql"),
        Path("SCHEMAS_V2.sql")
    ]
    
    schema_path = None
    for p in possible_paths:
        if p.exists():
            schema_path = p
            break
            
    if not schema_path:
        logger.warning(f"SCHEMAS_V2.sql not found in {possible_paths}. Skipping migration.")
        return

    try:
        logger.info(f"Applying schema from {schema_path}...")
        conn = await asyncpg.connect(db_url)
        
        sql_content = schema_path.read_text(encoding="utf-8")
        await conn.execute(sql_content)
        
        await conn.close()
        logger.info("Database schema applied successfully.")
        
    except Exception as e:
        logger.error(f"Failed to apply database schema: {e}")
