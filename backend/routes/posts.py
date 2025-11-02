from flask import Blueprint, request, jsonify
import datetime
import time
import json

from app import (
    conn,
    token_required,
    token_optional,
    removeFile,
    get_posts_helper,
    supabase,
)

posts_bp = Blueprint("posts", __name__)


# route to create a post and insert into database
@posts_bp.route("/create_post", methods=["POST"])
@token_required
def post_project(decoded):
    if not conn:
        return jsonify({"error": "Database connection is not established"}), 503

    now = datetime.datetime.now()
    data = request.form

    title = data.get("title")
    post_type = data.get("post_type")
    post_date = now.strftime("%Y-%m-%d %H:%M:%S")
    post_body = data.get("post_body")
    tags = json.loads(data["tags"])
    video_file_path = ""

    try:
        if not post_type:
            return jsonify({"error": "Post requires a type"}), 400
        elif not title:
            return jsonify({"error": "Post needs a title"}), 400
        elif len(title) > 200:
            return jsonify({"error": "Post title cannot be over 200 characters"}), 400
        elif len(post_body) > 4000:
            return jsonify({"error": "Post body cannot be over 4000 characters"}), 400
        else:
            if "demoFile" in request.files:
                demoFile = request.files["demoFile"]
                file_ext = demoFile.filename.split(".")[-1]
                filename = f"{int(time.time() * 1000)}.{file_ext}"
                path = f"project-demos/{filename}"

                file_bytes = demoFile.read()

                try:
                    res = supabase.storage.from_("uploads").upload(path, file_bytes)

                    if res:
                        video_file_path = supabase.storage.from_(
                            "uploads"
                        ).get_public_url(path)
                    else:
                        return jsonify({"error": "Upload failed - empty response"}), 400

                except Exception as e:
                    return jsonify({"error": str(e)}), 500

            with conn.cursor() as cursor:
                user_id = decoded["user_id"]
                cursor.execute(
                    "INSERT INTO posts (post_date, post_type, user_id, title, post_body, video_file_path, likes, comments) VALUES (%s, %s, %s, %s, %s, %s, 0, 0) RETURNING id",
                    (
                        post_date,
                        post_type,
                        user_id,
                        title,
                        post_body,
                        video_file_path,
                    ),
                )
                post_id = cursor.fetchone()[0]
                # fetch all the ids for the tag names
                if len(tags) > 0:
                    post_tags_arr = []
                    cursor.execute(
                        "SELECT id FROM tags WHERE tag_name = ANY(%s)", (tags,)
                    )
                    tag_ids = cursor.fetchall()
                    # append it into array of tuple values (post_id, tag_id)
                    for tag_id in tag_ids:
                        post_tags_arr.append((post_id, tag_id))
                    # executemany executes the same statement for all the values in the array
                    cursor.executemany(
                        "INSERT INTO post_tags (post_id, tag_id) VALUES (%s, %s)",
                        post_tags_arr,
                    )
            conn.commit()
            return (
                jsonify(
                    {"success": "Your project has been posted", "post_id": post_id}
                ),
                201,
            )

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# route to fetch posts by distinct category (projects or questions)
@posts_bp.route("/get_postsByCategory", methods=["GET"])
@token_optional
def get_posts(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    post_type = request.args.get("post_type")
    start = request.args.get("start")
    limit = request.args.get("limit")
    category = request.args.get("category")
    user_id = decoded["user_id"] if decoded else None

    if not post_type:
        return jsonify({"error": "Missing post type"}), 400
    if category not in {"post_date", "likes"}:
        return jsonify({"error": "Invalid sort category"}), 400

    try:
        with conn.cursor() as cursor:
            # psycopg2 doesn't interpolate SQL keywords using {} or %s so we need a string to do it, %s only works for column names or table names
            query = f"""
        SELECT 
          posts.id,
          posts.post_date,
          posts.post_type,
          posts.title,  
          posts.likes,
          posts.comments,
          posts.video_file_path,
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
        WHERE posts.post_type = %s
        GROUP BY posts.id, posts.post_date, posts.post_type, posts.title,
     posts.likes, posts.comments, users.username, users.profile_picture
        ORDER BY posts.{category} DESC
        LIMIT %s OFFSET %s
      """
            cursor.execute(query, (user_id, user_id, post_type, limit, start))

            rows = cursor.fetchall()  # returns list of tuples;

        columns = [
            "id",
            "date",
            "type",
            "title",
            "upvotes",
            "comments_count",
            "video",
            "name",
            "pfp",
            "tags",
            "liked",
        ]

        posts = get_posts_helper(rows, columns)
        return jsonify({"posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# used to fetch the posts for a specific user to display on their personal profile
@posts_bp.route("/get_posts_byUserAndCategory", methods=["GET"])
@token_optional
def get_posts_byUser(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    username = request.args.get("username")
    post_type = request.args.get("post_type")
    start = request.args.get("start")
    limit = request.args.get("limit")
    category = request.args.get("category")
    user_id = decoded["user_id"] if decoded else None

    # shouldn't directly inject column names or SQL keywords unless safely controlling what's allowed to prevent SQL injection
    if category not in {"post_date", "likes"}:
        return jsonify({"error": "Invalid sort category"}), 400

    if not username:
        return jsonify({"error": "Missing username"}), 400
    if not post_type:
        return jsonify({"error": "Missing post type"}), 400

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
        JOIN users on posts.user_id = users.id
        LEFT JOIN post_tags ON posts.id = post_tags.post_id
        LEFT JOIN tags ON post_tags.tag_id = tags.id
        WHERE users.username = %s AND posts.post_type = %s
        GROUP BY posts.id, posts.post_date, posts.post_type, posts.title,
        posts.likes, posts.comments, users.username, users.profile_picture
        ORDER BY posts.{category} DESC
        LIMIT %s OFFSET %s 
      """
            cursor.execute(query, (user_id, user_id, username, post_type, limit, start))

            rows = cursor.fetchall()

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

        posts = get_posts_helper(rows, columns)

        return jsonify({"posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# route to delete a post
@posts_bp.route("/delete_post", methods=["DELETE"])
@token_required
def delete_post(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    data = request.get_json()
    post_id = data.get("post_id")
    video_file_path = data.get("video_file_path")

    try:
        with conn.cursor() as cursor:
            user_id = decoded["user_id"]
            cursor.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
            post_user_id = cursor.fetchone()[0]

            if user_id != post_user_id:
                return jsonify({"error": "403 Forbidden"}), 403

            cursor.execute("DELETE FROM posts WHERE id = %s", (post_id,))
            cursor.execute(
                "DELETE FROM likes WHERE type = 'posts' AND target_id = %s",
                (post_id,),
            )
            conn.commit()
            if video_file_path:
                removeFile(video_file_path)

            return jsonify({"success": "Post has been deleted"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500


# route to fetch the details for a specific individual post
@posts_bp.route("/get_specific_post", methods=["GET"])
@token_optional
def get_specific_post(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    post_id = request.args.get("post_id")
    user_id = decoded["user_id"] if decoded else None

    try:
        # post_type???
        with conn.cursor() as cursor:
            cursor.execute(
                """
      SELECT 
        posts.id, 
        posts.post_date, 
        posts.post_type, 
        posts.title, 
        posts.post_body, 
        posts.video_file_path, 
        posts.likes, 
        posts.comments, 
        users.username, 
        users.profile_picture,
        array_agg(tags.tag_name) AS tag_name,
        %s IS NOT NULL AND EXISTS (
            SELECT 1 FROM likes WHERE user_id = %s AND target_id = %s AND type = 'posts'
        ) AS user_liked_post
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN post_tags ON post_tags.post_id = posts.id
      LEFT JOIN tags ON post_tags.tag_id = tags.id
      WHERE posts.id = %s
      GROUP BY posts.id, posts.post_date, posts.post_type, posts.title, posts.post_body, posts.video_file_path,
      posts.likes, posts.comments, users.username, users.profile_picture
      """,
                (user_id, user_id, post_id, post_id),
            )

            row = cursor.fetchone()  # returns 1 row
            if not row:
                return jsonify({"error": "Post not found"}), 404
        columns = [
            "id",
            "date",
            "type",
            "title",
            "body",
            "video",
            "upvotes",
            "comments_count",
            "name",
            "pfp",
            "tags",
            "liked",
        ]

        posts = get_posts_helper([row], columns)

        return jsonify({"posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# route to edit the body of a specific post
@posts_bp.route("/edit_post", methods=["POST"])
@token_optional
def edit_post(decoded):
    if not conn:
        return jsonify({"error": "Database connection not established"}), 503

    data = request.get_json()
    new_post_body = data.get("new_post_body")
    post_id = request.args.get("post_id")
    user_id = decoded["user_id"] if decoded else None

    try:
        if len(new_post_body) > 4000:
            return jsonify({"error": "Post body cannot be over 4000 characters"}), 400

        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE posts 
                SET post_body = %s 
                WHERE id = %s AND user_id = %s
                """,
                (new_post_body, post_id, user_id),
            )

            conn.commit()
            return jsonify({"success": "Post edited!"})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
