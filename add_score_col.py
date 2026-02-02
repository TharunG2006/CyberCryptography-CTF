import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def add_score_column():
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
        
        # Check if column exists
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='score';")
        if cur.fetchone():
            print("Column 'score' already exists.")
        else:
            cur.execute("ALTER TABLE users ADD COLUMN score INT DEFAULT 0;")
            conn.commit()
            print("Added 'score' column to users table.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_score_column()
