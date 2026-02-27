import requests
import threading
import time

BASE_URL = "http://127.0.0.1:5000"

def check_leaderboard(thread_id):
    try:
        start = time.time()
        res = requests.get(f"{BASE_URL}/api/leaderboard", timeout=10)
        duration = time.time() - start
        if res.status_code == 200:
            print(f"Thread {thread_id}: ✅ Success in {duration:.2f}s")
        else:
            print(f"Thread {thread_id}: ❌ Failed (Status {res.status_code})")
    except requests.exceptions.ConnectionError:
        print(f"Thread {thread_id}: ❌ Connection Refused (Is server running?)")
    except Exception as e:
        print(f"Thread {thread_id}: ⚠️ Error: {e}")

def run_stress_test(num_requests=30):
    print(f"Starting stress test with {num_requests} concurrent requests...")
    threads = []
    for i in range(num_requests):
        t = threading.Thread(target=check_leaderboard, args=(i,))
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join()
    print("Stress test complete.")

if __name__ == "__main__":
    # Note: Ensure the server is running (e.g., via prod_server.py) before running this
    run_stress_test()
