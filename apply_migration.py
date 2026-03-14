import asyncio
import asyncpg
import os
import ssl
from dotenv import load_dotenv

load_dotenv()

async def main():
    db_url = os.getenv('DATABASE_URL')
    print(f"Connecting to: {db_url}")
    # Supabase requires SSL for external connections
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    conn = await asyncpg.connect(db_url, ssl=ssl_context)
    with open('supabase/migrations/20260314_agent_tables.sql', 'r') as f:
        sql = f.read()
    await conn.execute(sql)
    print("Agent Migration applied successfully!")
    await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
