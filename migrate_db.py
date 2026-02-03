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
            sslmode='require'
        )
        conn.autocommit = True # Enable autocommit to avoid transaction blocks on error
        cur = conn.cursor()
        
        # columns to add
        columns = [
            ("is_verified", "BOOLEAN DEFAULT FALSE"),
            ("verification_token", "VARCHAR(100)"),
            ("phone_country_code", "VARCHAR(10)")
        ]
        
        print("Starting Migration...")
        
        for col_name, col_type in columns:
            try:
                print(f"Attempting to add {col_name}...")
                cur.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};")
                print(f"✅ Added column: {col_name}")
            except psycopg2.errors.DuplicateColumn:
                print(f"ℹ️  Column {col_name} already exists. Skipping.")
            except Exception as e:
                print(f"❌ Error adding {col_name}: {e}")
                
        cur.close()
        conn.close()
        print("Migration process finished.")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    migrate()
