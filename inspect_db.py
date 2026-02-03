import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def inspect():
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
        
        # Get columns for users table
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';")
        columns = cur.fetchall()
        
        print("\n--- Current Schema for 'users' ---")
        found_cols = []
        for col in columns:
            print(f"- {col[0]} ({col[1]})")
            found_cols.append(col[0])
            
        required = ['phone_country_code', 'is_verified', 'verification_token']
        missing = [c for c in required if c not in found_cols]
        
        if missing:
            print(f"\n❌ MISSING COLUMNS: {missing}")
        else:
            print("\n✅ ALL REQUIRED COLUMNS PRESENT.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect()
