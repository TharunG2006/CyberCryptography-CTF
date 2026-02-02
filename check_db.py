import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def check_connection():
    print("--- Checking Database Connection ---")
    host = os.getenv('DB_HOST', 'localhost')
    user = os.getenv('DB_USER', 'postgres')
    dbname = os.getenv('DB_NAME', 'postgres')
    password = os.getenv('DB_PASS', 'password')
    port = os.getenv('DB_PORT', '5432')

    print(f"Target: postgresql://{user}:***@{host}:{port}/{dbname}")

    try:
        conn = psycopg2.connect(
            host=host,
            database=dbname,
            user=user,
            password=password,
            port=port,
            sslmode='require'
        )
        print("✅ SUCCESS: Connection established!")
        
        cur = conn.cursor()
        cur.execute("SELECT version();")
        version = cur.fetchone()[0]
        print(f"ℹ️  Database Version: {version}")
        
        cur.close()
        conn.close()
        return True
    except psycopg2.OperationalError as e:
        print("\n❌ FAILURE: Could not connect.")
        print("Possible causes:")
        print("1. PostgreSQL is not running.")
        print("2. The password in .env is incorrect.")
        print("3. The database 'postgres' does not exist.")
        print(f"\nError Details: {e}")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    check_connection()
