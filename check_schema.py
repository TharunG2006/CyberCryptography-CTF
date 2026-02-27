import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def check_users_schema():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT'),
            sslmode='require'
        )
        cur = conn.cursor()
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        """)
        columns = cur.fetchall()
        print("Schema for 'users' table:")
        for col in columns:
            print(f" - {col[0]} ({col[1]})")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error checking schema: {e}")

if __name__ == "__main__":
    check_users_schema()
