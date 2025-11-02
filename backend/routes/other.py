from flask import Blueprint, request, jsonify
import datetime
import jwt
import time

from app import (
    conn,
    token_required,
    token_optional,
    removeFile,
    get_posts_helper,
    supabase,
    SECRET_KEY,
)

other_bp = Blueprint("test", __name__)  # replace @app with @test_bp


# extend the session by providing a new token when the user prefers not to log out
@other_bp.route("/extend_session", methods=["POST"])
@token_required
def extend_session(decoded):
    try:
        new_token = jwt.encode(
            {
                "user_id": decoded["user_id"],
                "exp": datetime.datetime.now(datetime.timezone.utc)
                + datetime.timedelta(minutes=1),
            },
            SECRET_KEY,
            algorithm="HS256",
        )
        return jsonify({"token": new_token})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# fetch the profile of the logged in user
@other_bp.route("/fetch_user_profile", methods=["GET"])
@token_required
def fetch_user_profile(decoded):
    if not conn:
        return jsonify({"error": "Database connection is not established"}), 503

    try:
        user_id = decoded["user_id"]
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT username, profile_picture FROM users WHERE id=%s",
                (user_id,),
            )
            user = cursor.fetchone()
        return jsonify({"username": user[0], "pfp": user[1]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# fetch the profile details of any user
@other_bp.route("/fetch_profile", methods=["GET"])
def fetch_profile():
    if not conn:
        return jsonify({"error": "Database connection is not established"}), 503

    username = request.args.get("username")

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                    SELECT 
                    profiles.about_me, 
                    profiles.github_link, 
                    profiles.year_of_study, 
                    users.profile_picture, 
                    users.email 
                    FROM profiles
                    RIGHT JOIN users ON profiles.user_id = users.id
                    WHERE users.username = %s
                    """,
                (username,),
            )
            profile = cursor.fetchone()
            if not profile:
                return (
                    jsonify({"error": "User not found!"}),
                    404,
                )

        columns = ["about_me", "github_link", "year_of_study", "pfp", "email"]
        profile_dict = dict(zip(columns, profile))
        return jsonify({"profile": profile_dict})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# update the details of a user's profile
@other_bp.route("/edit_profile", methods=["POST"])
@token_required
def edit_profile(decoded):
    if not conn:
        return jsonify({"error": "Database connection is not established"}), 503

    data = request.form
    user_id = decoded["user_id"]
    about_me = data.get("about_me")
    email = data.get("email")
    github_link = data.get("github_link")
    year_of_study = data.get("year_of_study")
    pfp = data.get("pfp")
    new_pfp_url = None

    try:
        if len(about_me) > 1000:
            return jsonify({"error": "About Me cannot be over 1000 characters!"}), 409
        elif github_link and not github_link.startswith("https://github.com/"):
            return jsonify({"error": "Invalid Github link"}), 409
        else:
            # if user inserted a new profile picture, take that file and give it a unique name to insert into supabase
            if "pfpFile" in request.files:
                pfpFile = request.files["pfpFile"]
                file_ext = pfpFile.filename.split(".")[-1]
                filename = f"{int(time.time() * 1000)}.{file_ext}"
                path = f"users-pfp/{filename}"

                # supabase does not allow fileobject to be stored, convert into binary bytes
                file_bytes = pfpFile.read()

                # upload the new profile picture onto supabase storage
                try:
                    response = supabase.storage.from_("uploads").upload(
                        path, file_bytes
                    )

                    if response:
                        new_pfp_url = supabase.storage.from_("uploads").get_public_url(
                            path
                        )
                    else:
                        return jsonify({"error": "Upload failed - empty response"}), 400

                    if (
                        pfp
                        != "https://azxfokxbsfmqibzjduky.supabase.co/storage/v1/object/public/uploads/users-pfp/Default_pfp.svg"
                    ):
                        removeFile(pfp)

                except Exception as e:
                    return jsonify({"error": str(e)}), 500

            pfp_url = new_pfp_url if new_pfp_url is not None else pfp

            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE users SET email = %s, profile_picture = %s WHERE id = %s",
                    (email, pfp_url, user_id),
                )
                cursor.execute(
                    "UPDATE profiles SET about_me = %s, github_link = %s, year_of_study = %s WHERE user_id = %s",
                    (about_me, github_link, year_of_study, user_id),
                )
            conn.commit()
            return (
                jsonify(
                    {"success": "Your profile has been updated!", "pfp_url": pfp_url}
                ),
                201,
            )
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# allows the user to like and unlike a post
@other_bp.route("/like_unlike", methods=["POST"])
@token_required
def like_unlike_post(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    data = request.get_json()
    user_id = decoded["user_id"]
    target_id = data.get("target_id")
    type = data.get("type")
    action = ""

    if type not in {"posts", "comments"}:
        return jsonify({"error": "Invalid type"}), 400

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM likes WHERE user_id = %s AND target_id = %s AND type = %s",
                (user_id, target_id, type),
            )
            if cursor.fetchone():
                cursor.execute(
                    "DELETE FROM likes WHERE user_id = %s AND target_id = %s AND type = %s",
                    (user_id, target_id, type),
                )
                likes_column = "likes" if type == "posts" else "likes_count"
                query = f"""
                UPDATE {type}
                SET {likes_column} = {likes_column} - 1
                WHERE id = %s
                """
                cursor.execute(query, (target_id,))
                action = "unliked"
            else:
                cursor.execute(
                    "INSERT INTO likes (user_id, type, target_id) VALUES (%s, %s, %s)",
                    (user_id, type, target_id),
                )
                likes_column = "likes" if type == "posts" else "likes_count"
                query = f"""
                UPDATE {type}
                SET {likes_column} = {likes_column} + 1
                WHERE id = %s
                """
                cursor.execute(query, (target_id,))
                action = "liked"

            conn.commit()
            return jsonify({"success": action}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# fetch all the posts the user liked
@other_bp.route("/fetch_liked_posts", methods=["GET"])
@token_required
def fetch_liked_posts(decoded):

    limit = request.args.get("limit")
    offset = request.args.get("offset")
    user_id = decoded["user_id"]
    try:
        with conn.cursor() as cursor:
            query = f"""
                SELECT
                    posts.id,
                    posts.post_date,
                    posts.post_type,
                    posts.title,
                    posts.likes,
                    posts.comments,
                    users.username,
                    users.profile_picture,
                    array_agg(DISTINCT tags.tag_name) AS tag_name,
                    true AS user_liked_post
                FROM posts
                JOIN users ON posts.user_id = users.id
                JOIN likes ON posts.id = likes.target_id
                LEFT JOIN post_tags ON posts.id = post_tags.post_id
                LEFT JOIN tags ON post_tags.tag_id = tags.id
                WHERE likes.user_id = %s AND likes.type = 'posts'
                GROUP BY posts.id, users.username, users.profile_picture
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (user_id, limit, offset))
            liked_posts = cursor.fetchall()

        columns = [
            "id",
            "date",
            "type",
            "title",
            "upvotes",
            "comments_count",
            "name",
            "pfp",
            "tags",
            "liked",
        ]

        liked_posts_arr = get_posts_helper(liked_posts, columns)

        return jsonify({"liked_posts": liked_posts_arr})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# fetches the posts that contains the keyword the user entered
@other_bp.route("/search_posts", methods=["GET"])
@token_optional
def search_posts(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    search_term = request.args.get("search_term")
    limit = request.args.get("limit")
    offset = request.args.get("offset")
    post_type = request.args.get("post_type")
    user_id = decoded["user_id"] if decoded else None

    try:
        with conn.cursor() as cursor:
            query = f"""
                    SELECT 
                      posts.id,
                      posts.post_date,
                      posts.post_type,
                      posts.title, 
                      posts.likes,
                      posts.comments,
                      users.username,
                      users.profile_picture,
                      array_agg(tags.tag_name) AS tag_name,
                      %s IS NOT NULL AND EXISTS (
                        SELECT 1 FROM likes WHERE user_id = %s AND target_id = posts.id AND type = 'posts'
                    ) AS user_liked_post
                    FROM posts
                    JOIN users ON posts.user_id = users.id
                    LEFT JOIN post_tags ON post_tags.post_id = posts.id
                    LEFT JOIN tags ON post_tags.tag_id = tags.id
                    WHERE posts.title ILIKE %s AND posts.post_type = %s
                    GROUP BY posts.id, posts.post_date, posts.post_type, posts.title,  posts.likes, posts.comments, users.username, users.profile_picture
                    LIMIT %s OFFSET %s
                  """
            search_str = f"%{search_term}%"
            cursor.execute(
                query, (user_id, user_id, search_str, post_type, limit, offset)
            )
            posts = cursor.fetchall()

        columns = [
            "id",
            "date",
            "type",
            "title",
            "upvotes",
            "comments_count",
            "name",
            "pfp",
            "tags",
            "liked",
        ]

        posts_arr = get_posts_helper(posts, columns)

        return jsonify({"posts": posts_arr})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# fetches the profiles that has contains the keyword the user entered
@other_bp.route("/search_profiles", methods=["GET"])
def search_profiles():
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    search_term = request.args.get("search_term")
    limit = request.args.get("limit")
    offset = request.args.get("offset")

    try:
        with conn.cursor() as cursor:
            profiles_arr = []
            search_str = f"%{search_term}%"
            cursor.execute(
                "SELECT id, profile_picture, username FROM users WHERE username LIKE %s LIMIT %s OFFSET %s",
                (search_str, limit, offset),
            )

            profiles = cursor.fetchall()

            columns = ["id", "pfp", "name"]
            for profile in profiles:
                profiles_dict = dict(zip(columns, profile))
                profiles_arr.append(profiles_dict)

        return jsonify({"profiles": profiles_arr})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# fetch all the tags on the website
# @other_bp.route("/fetch_tags", methods=["GET"])
# def fetch_tags():
#     if not conn:
#         return jsonify({"error": "Database connection not established"}), 503

#     try:
#         with conn.cursor() as cursor:
#             cursor.execute("SELECT tag_name, post_type FROM tags")
#             tags = cursor.fetchall()
#         all_tags = []
#         for tag in tags:
#             all_tags.append({"tag_name": tag[0], "post_type": tag[1]})

#         return jsonify({"tags": all_tags})

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# fetch all the posts for a specific tag
@other_bp.route("/fetch_specific_tag", methods=["GET"])
@token_optional
def fetch_specific_tag(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    target_tag = request.args.get("target_tag")
    post_type = request.args.get("post_type")
    start = request.args.get("start")
    limit = request.args.get("limit")
    user_id = decoded["user_id"] if decoded else None
    category = request.args.get("category")
    categories = ["likes", "post_date"]
    if category not in categories:
        return jsonify({"Error: ": "Invalid filter type"})

    try:
        with conn.cursor() as cursor:
            query = f"""SELECT 
                        posts.id,
                        posts.post_date,
                        posts.post_type,
                        posts.title, 
                        posts.likes,
                        posts.comments,
                        users.username,
                        users.profile_picture,
                        array_agg(tags.tag_name) AS tag_name,
                        %s IS NOT NULL AND EXISTS (
                            SELECT 1 FROM likes WHERE user_id = %s AND target_id = posts.id AND type = 'posts'
                        ) AS user_liked_post
                        FROM posts
                        JOIN users ON posts.user_id = users.id
                        LEFT JOIN post_tags ON posts.id = post_tags.post_id
                        LEFT JOIN tags ON post_tags.tag_id = tags.id
                        WHERE tags.post_type = %s
                        GROUP BY posts.id, posts.post_date, posts.post_type, posts.title, 
                        posts.likes, posts.comments,
                        users.username, users.profile_picture
                        HAVING %s = ANY(array_agg(tags.tag_name))
                        ORDER BY posts.{category} DESC
                        LIMIT %s OFFSET %s"""
            cursor.execute(
                query,
                (user_id, user_id, post_type, target_tag, limit, start),
            )
            posts = cursor.fetchall()
            columns = [
                "id",
                "date",
                "type",
                "title",
                "upvotes",
                "comments_count",
                "name",
                "pfp",
                "tags",
                "liked",
            ]
            posts_arr = get_posts_helper(posts, columns)
            return jsonify({"posts": posts_arr})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
