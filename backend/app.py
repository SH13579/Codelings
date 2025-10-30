from flask import Flask, request, jsonify
import psycopg2
from dotenv import load_dotenv
from flask_cors import CORS
import datetime
import os
import jwt
from functools import wraps
import math
import time
import json
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client, Client
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)

# DB_HOST = 'ep-noisy-glitter-a54at3s3-pooler.us-east-2.aws.neon.tech'
# DB_NAME = 'codelings'
# DB_USER = os.getenv('PG_NEON_USER')
# DB_PASS = os.getenv('PG_NEON_PASSWORD') #access environment variable PG_PASSWORD
# DB_PORT = '5432'

load_dotenv()

DB_HOST = "localhost"
DB_NAME = "codelings"
DB_USER = "postgres"
DB_PASS = os.getenv("PG_PASSWORD")  # access environment variable PG_PASSWORD
DB_PORT = "5432"
SECRET_KEY = "codelings541"

# Fetch variables
# USER = os.getenv("user")
# PASSWORD = os.getenv("password")
# HOST = os.getenv("host")
# PORT = os.getenv("port")
# DBNAME = os.getenv("dbname")

# # Connect to the database
# try:
#     connection = psycopg2.connect(
#         user=USER,
#         password=PASSWORD,
#         host=HOST,
#         port=PORT,
#         dbname=DBNAME
#     )
#     print("Connection successful!")

#     # Create a cursor to execute SQL queries
#     cursor = connection.cursor()

#     # Example query
#     cursor.execute("SELECT NOW();")
#     result = cursor.fetchone()
#     print("Current Time:", result)

#     # Close the cursor and connection
#     cursor.close()
#     connection.close()
#     print("Connection closed.")

# except Exception as e:
#     print(f"Failed to connect: {e}")

# env
# DATABASE_URL=postgresql://postgres:6pg7h9NAsMJcnLRS@db.azxfokxbsfmqibzjduky.supabase.co:5432/postgres

# host:
# db.azxfokxbsfmqibzjduky.supabase.co

# port:
# 5432

# database:
# postgres

# user:
# postgres

# connect to PostgreSQL database
try:
    conn = psycopg2.connect(
        host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASS, port=DB_PORT
    )
except Exception as e:
    print("Error connecting to database:", e)

# connect to Supabase storage
SUPABASE_URL = "https://azxfokxbsfmqibzjduky.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6eGZva3hic2ZtcWliempkdWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzMyNjgsImV4cCI6MjA2ODYwOTI2OH0.9PL3bH-aMUGoleViasmPKGoE2AKTWFBOkEjfEKCqt9U"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split()[1]

        if not token:
            return jsonify({"error": "Missing token"}), 401

        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(decoded, *args, **kwargs)

    return decorated


def token_optional(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        decoded = None
        auth_header = request.headers.get("Authorization")
        token = None

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split()[1]
        else:
            return

        if token:
            try:
                decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            except jwt.ExpiredSignatureError:
                pass
            except jwt.InvalidTokenError:
                pass

        return f(decoded, *args, **kwargs)

    return decorated


# remove a file from the supabase storage
def removeFile(url):
    base_segment = "/storage/v1/object/public/"
    if base_segment not in url:
        return None, None

    # remove the question mark at the end of the url, supabase requires the EXACT path when removing a file
    url = urlparse(url.rstrip("?"))
    relative_path = url.path.split(base_segment)[1]
    parts = relative_path.split("/", 1)
    if len(parts) != 2:
        return None, None

    bucket, file_path = parts

    response = supabase.storage.from_(bucket).remove(file_path)

    if not response:
        return None, None


# changes the date from each row to the difference between date posted and today's date
def get_post_date(row):
    now = datetime.datetime.now()
    time_difference = now - row[1]
    seconds = round(time_difference.total_seconds())
    minutes = round(seconds / 60)
    hours = round(seconds / 3600)
    days = time_difference.days
    if minutes < 1:
        difference = "Just now"
    elif hours < 1:
        if minutes <= 1:
            difference = f"A minute ago"
        else:
            difference = f"{minutes} minutes ago"
    elif hours <= 24:
        if hours <= 1:
            difference = f"An hour ago"
        else:
            difference = f"{hours} hours ago"
    else:
        if days <= 1:
            difference = f"{days} day ago"
        else:
            difference = f"{days} days ago"
    return difference


# turn each row into a object with corresponding dictionary values
def get_posts_helper(rows, columns):
    posts = []
    now = datetime.datetime.now()

    # iterate through columns and fill in the dictionary with each row fetched from rows
    for row in rows:
        difference = get_post_date(row)
        post_dict = dict(zip(columns, row))
        post_dict["date"] = difference

        posts.append(post_dict)

    return posts
