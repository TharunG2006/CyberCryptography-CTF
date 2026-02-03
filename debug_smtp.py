import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
MAIL_USERNAME = "24104039@nec.edu.in"
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')

print("--- SMTP DIAGNOSTIC ---")
print(f"Username: {MAIL_USERNAME}")
if not MAIL_PASSWORD:
    print("❌ ERROR: MAIL_PASSWORD is missing or empty in .env")
else:
    print("✅ MAIL_PASSWORD found (Length: {})".format(len(MAIL_PASSWORD)))

print(f"Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
try:
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.set_debuglevel(1) # Show detailed transaction
    server.starttls()
    print("✅ Connected & TLS Started.")
    
    if MAIL_PASSWORD:
        print("Attempting Login...")
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        print("✅ LOGIN SUCCESSFUL!")
    
    server.quit()
except smtplib.SMTPAuthenticationError:
    print("\n❌ AUTHENTICATION ERROR")
    print("The password was rejected. If using Gmail, you MUST use an 'App Password', not your login password.")
except Exception as e:
    print(f"\n❌ CONNECTION ERROR: {e}")
