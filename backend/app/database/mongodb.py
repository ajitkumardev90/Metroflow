import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

client = MongoClient(
    os.getenv("MONGODB_URI"),
    serverSelectionTimeoutMS=2000,
    connectTimeoutMS=2000,
    socketTimeoutMS=2000
)

try:
    client.admin.command("ping")
    print("[SUCCESS] MongoDB Connected Successfully")
    mongodb = client.get_default_database()

except Exception as e:
    print("[ERROR] MongoDB Connection Failed:")
    print(e)

    # Don't stop the application
    client = None
    mongodb = None