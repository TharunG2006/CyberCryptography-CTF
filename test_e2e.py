import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_registration():
    print(f"--- Testing Registration at {BASE_URL} ---")
    payload = {
        "username": "testuser_" + str(int(__import__('time').time())),
        "email": "test_" + str(int(__import__('time').time())) + "@example.com",
        "contact": "1234567890",
        "password": "Password123!",
        "country_code": "+91"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/api/register", json=payload, timeout=10)
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.json()}")
        
        if resp.status_code == 201:
            token = None
            # We can't easily check email, but let's see if we can find the token in the DB for verification test
            import psycopg2
            import os
            from dotenv import load_dotenv
            load_dotenv()
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST'),
                database=os.getenv('DB_NAME'),
                user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASS'),
                port=os.getenv('DB_PORT'),
                sslmode='require'
            )
            cur = conn.cursor()
            cur.execute("SELECT verification_token FROM users WHERE username = %s", (payload['username'],))
            token = cur.fetchone()[0]
            cur.close()
            conn.close()
            
            if token:
                print(f"Found Token: {token}")
                # Test verification
                v_resp = requests.get(f"{BASE_URL}/api/verify_email/{token}", allow_redirects=False, timeout=10)
                print(f"Verification Status: {v_resp.status_code}")
                print(f"Redirect Location: {v_resp.headers.get('Location')}")
    except Exception as e:
        print(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    test_registration()
