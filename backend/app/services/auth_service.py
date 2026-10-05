import os
from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from app.repositories.auth_repository import (
    find_user_by_email,
    create_user,
    find_user_by_id,
    update_user_role,
    get_user_by_id,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET") or "metroflow_super_secret_key"
ALGORITHM = "HS256"

# Valid roles for RBAC
VALID_ROLES = ["admin", "manager", "user"]

DEMO_ACCOUNTS = {
    "admin@metroflow.ai": ("admin123", "admin", "System Admin"),
    "manager@metroflow.ai": ("manager123", "manager", "Traffic Manager"),
    "user@metroflow.ai": ("user123", "user", "Traveler User")
}


def register_user(fullName: str, email: str, password: str):
    existing_user = find_user_by_email(email)

    if existing_user:
        raise Exception("User already exists")

    hashed_password = pwd_context.hash(password)

    # Every new user starts as a normal user
    user = {
        "fullName": fullName,
        "email": email,
        "password": hashed_password,
        "role": "user",
    }

    user_id = create_user(user)

    return {
        "id": str(user_id),
        "fullName": fullName,
        "email": email,
        "role": "user",
    }


def login_user(email: str, password: str):
    email_clean = (email or "").strip().lower()
    user = find_user_by_email(email_clean)

    # Auto-provision or auto-repair demo account credentials
    if email_clean in DEMO_ACCOUNTS and password == DEMO_ACCOUNTS[email_clean][0]:
        demo_pwd, demo_role, demo_name = DEMO_ACCOUNTS[email_clean]
        if not user:
            register_user(demo_name, email_clean, demo_pwd)
            user = find_user_by_email(email_clean)
            update_user_role(str(user["_id"]), demo_role)
            user["role"] = demo_role
        else:
            # Re-sync role and password hash in case db was out of sync
            if not pwd_context.verify(password, user.get("password", "")):
                new_hash = pwd_context.hash(demo_pwd)
                from app.repositories.auth_repository import get_users_collection, save_local_users, load_local_users
                coll = get_users_collection()
                if coll is not None:
                    try:
                        from bson import ObjectId
                        coll.update_one({"_id": ObjectId(user["_id"])}, {"$set": {"password": new_hash, "role": demo_role}})
                    except Exception:
                        pass
                else:
                    users = load_local_users()
                    if str(user["_id"]) in users:
                        users[str(user["_id"])]["password"] = new_hash
                        users[str(user["_id"])]["role"] = demo_role
                        save_local_users(users)
                user["password"] = new_hash
            user["role"] = demo_role

    if not user:
        raise Exception("Invalid email or password")

    if not pwd_context.verify(password, user["password"]):
        raise Exception("Invalid email or password")

    token = jwt.encode(
        {
            "id": str(user["_id"]),
            "role": user["role"],
            "exp": datetime.utcnow() + timedelta(days=7),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "fullName": user["fullName"],
            "email": user["email"],
            "role": user["role"],
        },
    }


def get_profile(user_id: str):
    user = find_user_by_id(user_id)

    if not user:
        return None

    return {
        "id": str(user["_id"]),
        "fullName": user["fullName"],
        "email": user["email"],
        "role": user["role"],
    }


def change_user_role(user_id: str, role: str):
    """
    Change a user's role.
    Only Admin will be allowed to call this API
    (permission will be enforced in the router).
    """

    role = role.lower()

    if role not in VALID_ROLES:
        raise Exception(
            "Invalid role. Allowed roles are: admin, manager, user."
        )

    user = get_user_by_id(user_id)

    if not user:
        raise Exception("User not found")

    updated = update_user_role(user_id, role)

    if not updated:
        raise Exception("Role could not be updated")

    return {
        "success": True,
        "message": "User role updated successfully",
        "user": {
            "id": str(user["_id"]),
            "fullName": user["fullName"],
            "email": user["email"],
            "role": role,
        },
    }


def get_all_roles():
    """
    Returns all valid system roles.
    Useful for frontend dropdowns.
    """
    return VALID_ROLES