from server import init_db_pool, get_db_connection, db_pool
import os
from dotenv import load_dotenv

load_dotenv()

print("--- DB Diagnostic Script ---")
print(f"Target Host: {os.getenv('DB_HOST')}")
print(f"Target DB: {os.getenv('DB_NAME')}")
print(f"Target User: {os.getenv('DB_USER')}")

success = init_db_pool()
if not success:
    print("❌ init_db_pool() FAILED")
else:
    print("✅ init_db_pool() SUCCESS")
    conn = get_db_connection()
    if conn:
        print("✅ Connection obtained successfully")
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        tables = cur.fetchall()
        print(f"Tables found: {[t[0] for t in tables]}")
        cur.close()
        from server import release_db_connection
        release_db_connection(conn)
    else:
        print("❌ get_db_connection() returned None")
