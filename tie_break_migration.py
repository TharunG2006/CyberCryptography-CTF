import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def migrate():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            port=os.getenv('DB_PORT'),
            sslmode='require',
            connect_timeout=10
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Starting Tie-Breaking Migration...")
        
        # 1. Add last_solve_at to users
        try:
            print("Adding last_solve_at to users table...")
            cur.execute("ALTER TABLE users ADD COLUMN last_solve_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
            print("✅ Added column: last_solve_at to users")
        except psycopg2.errors.DuplicateColumn:
            print("ℹ️  Column last_solve_at already exists in users. Skipping.")
            
        # 2. Add solved_at to user_solves (optional but good for history)
        try:
            print("Adding solved_at to user_solves table...")
            cur.execute("ALTER TABLE user_solves ADD COLUMN solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
            print("✅ Added column: solved_at to user_solves")
        except psycopg2.errors.DuplicateColumn:
            print("ℹ️  Column solved_at already exists in user_solves. Skipping.")
        except Exception as e:
            if "relation \"user_solves\" does not exist" in str(e):
                print("ℹ️  Table user_solves does not exist yet. It will be created by the app.")
            else:
                print(f"❌ Error updating user_solves: {e}")

        cur.close()
        conn.close()
        print("Migration process finished.")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    migrate()
