import os
import sys

# Ensure current directory is in path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

print(f"--- Production Server Initializing ---")
print(f"Current Directory: {os.getcwd()}")
print(f"Python Executable: {sys.executable}")

try:
    from waitress import serve
    from server import app
except ImportError as e:
    print(f"❌ CRITICAL IMPORT ERROR: {e}")
    print("Please run: pip install -r requirements.txt")
    sys.exit(1)

if __name__ == '__main__':
    from server import detect_schema_features
    print("📋 Initializing Database Schema...")
    detect_schema_features()
    
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting Waitress on port {port} with 30 threads...")
    try:
        serve(app, host='0.0.0.0', port=port, threads=30)
    except Exception as e:
        print(f"❌ WAITRESS ERROR: {e}")
