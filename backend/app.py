from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import os
import jwt
from functools import wraps
from supabase import create_client, Client
from urllib.parse import urlparse
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")

# Connect to supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# helper function that is used on any actions on the site that require a valid user to be logged in
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


# helper function that is used on any actions on the site where a valid user can optionally be logged in
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
def get_post_date(post):
    now = datetime.datetime.now()

    # Convert ISO string to datetime if needed
    if isinstance(post["date"], str):
        post["date"] = datetime.datetime.fromisoformat(post["date"])

    time_difference = now - post["date"]
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


def get_posts_helper(posts):
    # posts is a list of dicts from Supabase
    for post in posts:
        post["date"] = get_post_date(post)
        # print(post["date"])
    return posts
