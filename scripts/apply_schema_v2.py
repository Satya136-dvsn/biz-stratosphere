import os
import psycopg2
from pathlib import Path

# Configuration
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    # Fallback to local default if not set (for testing/dev)
    DB_URL = "postgresql://postgres:postgres@localhost:54322/postgres"

SCHEMA_FILE = Path(r"c:\biz-stratosphere-main\documentation\enterprise\SCHEMAS_V2.sql")

def apply_schema():
    print(f"🔌 Connecting to database...")
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        print(f"📄 Reading schema file: {SCHEMA_FILE}")
        if not SCHEMA_FILE.exists():
            print(f"❌ Error: Schema file not found at {SCHEMA_FILE}")
            return

        sql_content = SCHEMA_FILE.read_text(encoding="utf-8")
        
        print("🚀 Executing SQL migration...")
        cur.execute(sql_content)
        conn.commit()
        
        print("✅ Schema applied successfully!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")

if __name__ == "__main__":
    apply_schema()
