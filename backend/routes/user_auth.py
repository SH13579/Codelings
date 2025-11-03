from flask import Blueprint, request, jsonify
import datetime
import jwt
from werkzeug.security import generate_password_hash, check_password_hash

from app import (
    conn,
    SECRET_KEY,
)

user_auth_bp = Blueprint("user_auth", __name__)


# route to handle registration
@user_auth_bp.route("/register", methods=["POST"])
def register():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")
    pfp = data.get("pfp")

    # codes error type: 400(bad request), 401(invalid credentials), 409(conflict, info already taken), 500(server error)
    try:
        # if fields are empty
        if not username or not email or not password or not confirm_password:
            return jsonify({"error": "Please fill in the blanks!"}), 400
        # if password does not match with confirm_password
        if password != confirm_password:
            return jsonify({"error": "Passwords do not match!"}), 400

        with conn.cursor() as cursor:  # "with" closes cursor automatically at end of block
            # hash the password to pass into database
            hashed_password = generate_password_hash(password)
            # check if username is taken
            cursor.execute(
                "SELECT * FROM users WHERE username =%s", (username,)
            )  # single element tuple. psycopg2 only accepts tuples
            if (
                cursor.fetchone()
            ):  # fetch from database (tuple) and check if username exists
                return jsonify({"error": "Username is taken"}), 409

            # check if email is taken
            cursor.execute(
                "SELECT * FROM users WHERE email =%s", (email,)
            )  # single element tuple. psycopg2 only accepts tuples
            if (
                cursor.fetchone()
            ):  # fetch from database (tuple) and check if email exists
                return jsonify({"error": "Email is taken"}), 409

            # insert new account
            cursor.execute(
                "INSERT INTO users (username, email, password, profile_picture) VALUES (%s, %s, %s, %s)",
                (username, email, hashed_password, pfp),
            )
        conn.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# route to handle logging in
@user_auth_bp.route("/login", methods=["POST"])
def login():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    data = request.json
    username = data.get("username")
    password = data.get("password")  # reminder to hash passwords and sensitive info

    try:
        # if fields are empty
        if not username or not password:
            return jsonify({"error": "Please fill in the blanks!"}), 400

        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, password FROM users WHERE username=%s",
                (username,),
            )
            user = cursor.fetchone()
            if user and check_password_hash(
                user[1], password
            ):  # check if username and hashed password is same as password inserted
                token = jwt.encode(
                    {
                        "user_id": user[0],
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
