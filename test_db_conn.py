import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def test_conn():
    try:
        print(f"Attempting to connect to: {os.getenv('DB_HOST')}")
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT'),
            sslmode='require',
            connect_timeout=5
        )
        print("✅ Connection successful!")
        conn.close()
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == '__main__':
    test_conn()
