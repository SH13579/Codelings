from flask import Blueprint, request, jsonify
import datetime
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from app import (
    supabase,
    SECRET_KEY,
)

user_auth_bp = Blueprint("user_auth", __name__)


# route to handle registration
@user_auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")
    pfp = data.get("pfp")

    try:
        # Validate fields
        if not username or not email or not password or not confirm_password:
            return jsonify({"error": "Please fill in the blanks!"}), 400

        if password != confirm_password:
            return jsonify({"error": "Passwords do not match!"}), 400

        # Check if username exists
        username_check = (
            supabase.table("users").select("id").eq("username", username).execute()
        )
        if username_check.data:
            return jsonify({"error": "Username is taken"}), 409

        # Check if email exists
        email_check = supabase.table("users").select("id").eq("email", email).execute()
        if email_check.data:
            return jsonify({"error": "Email is taken"}), 409

        # Hash password and insert user
        hashed_password = generate_password_hash(password)
        insert_user = (
            supabase.table("users")
            .insert(
                {
                    "username": username,
                    "email": email,
                    "password": hashed_password,
                    "profile_picture": pfp,
                }
            )
            .execute()
        )

        if not insert_user.data:
            return jsonify({"error": "Failed to register"}), 500

        new_user_id = insert_user.data[0].get("id")

        supabase.table("profiles").insert({"user_id": new_user_id}).execute()

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# route to handle logging in
@user_auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    try:
        # Validate fields
        if not username or not password:
            return jsonify({"error": "Please fill in the blanks!"}), 400

        # Fetch user by username
        response = (
            supabase.table("users")
            .select("id, password")
            .eq("username", username)
            .execute()
        )

        if not response.data:
            return jsonify({"error": "Invalid username or password"}), 401

        user = response.data[0]
        stored_hash = user["password"]

        if check_password_hash(stored_hash, password):
            token = jwt.encode(
                {
                    "user_id": user["id"],
                    "exp": datetime.datetime.now(datetime.timezone.utc)
                    + datetime.timedelta(minutes=30),
                },
                SECRET_KEY,
                algorithm="HS256",
            )
            return jsonify({"token": token})

        else:
            return jsonify({"error": "Invalid username or password"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500
