from flask import Blueprint, request, jsonify
import datetime
import time
import json

from app import (
    token_required,
    token_optional,
    removeFile,
    get_posts_helper,
    supabase,
)

posts_bp = Blueprint("posts", __name__)


# --------------------------------------------------------------------
# Create a post
# --------------------------------------------------------------------
@posts_bp.route("/create_post", methods=["POST"])
@token_required
def post_project(decoded):
    now = datetime.datetime.now()
    data = request.form

    title = data.get("title")
    post_type = data.get("post_type")
    post_date = now.strftime("%Y-%m-%d %H:%M:%S")
    post_body = data.get("post_body")
    tags = json.loads(data["tags"])
    video_file_path = ""
    user_id = decoded["user_id"]

    try:
        # Validation
        if not post_type:
            return jsonify({"error": "Post requires a type"}), 400
        elif not title:
            return jsonify({"error": "Post needs a title"}), 400
        elif len(title) > 200:
            return jsonify({"error": "Post title cannot be over 200 characters"}), 400
        elif len(post_body) > 4000:
            return jsonify({"error": "Post body cannot be over 4000 characters"}), 400

        # Handle optional demo video upload
        if "demoFile" in request.files:
            demoFile = request.files["demoFile"]
            file_ext = demoFile.filename.split(".")[-1]
            filename = f"{int(time.time() * 1000)}.{file_ext}"
            path = f"project-demos/{filename}"

            file_bytes = demoFile.read()
            supabase.storage.from_("uploads").upload(path, file_bytes)
            video_file_path = supabase.storage.from_("uploads").get_public_url(path)

        # Insert post into Supabase
        res = (
            supabase.table("posts")
            .insert(
                {
                    "post_date": post_date,
                    "post_type": post_type,
                    "user_id": user_id,
                    "title": title,
                    "post_body": post_body,
                    "video_file_path": video_file_path,
                    "likes": 0,
                    "comments": 0,
                }
            )
            .execute()
        )

        if not res.data:
            return jsonify({"error": "Failed to create post"}), 500

        post_id = res.data[0]["id"]

        # Attach tags
        if tags:
            # Get tag ids
            tag_query = (
                supabase.table("tags").select("id").in_("tag_name", tags).execute()
            )
            tag_ids = [tag["id"] for tag in tag_query.data]

            # Insert into post_tags
            for tag_id in tag_ids:
                supabase.table("post_tags").insert(
                    {"post_id": post_id, "tag_id": tag_id}
                ).execute()

        return (
            jsonify({"success": "Your project has been posted", "post_id": post_id}),
            201,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------
# Fetch posts by category (recent or top liked)
# --------------------------------------------------------------------
@posts_bp.route("/get_postsByCategory", methods=["GET"])
@token_optional
def get_posts(decoded):
    post_type = request.args.get("post_type")
    start = int(request.args.get("start"))
    limit = int(request.args.get("limit"))
    category = request.args.get("category")
    user_id = decoded["user_id"] if decoded else None

    if not post_type:
        return jsonify({"error": "Missing post type"}), 400
    if category not in {"post_date", "likes"}:
        return jsonify({"error": "Invalid sort category"}), 400

    try:
        res = (
            supabase.table("posts")
            .select("*, users(username, profile_picture), post_tags(tags(tag_name))")
            .eq("post_type", post_type)
            .order(category, desc=True)
            .range(start, start + limit - 1)
            .execute()
        )

        posts = []
        for p in res.data:
            liked = False
            if user_id:
                like_check = (
                    supabase.table("likes")
                    .select("id")
                    .eq("user_id", user_id)
                    .eq("target_id", p["id"])
                    .eq("type", "posts")
                    .execute()
                )
                liked = bool(like_check.data)

            posts.append(
                {
                    "id": p["id"],
                    "date": p["post_date"],
                    "type": p["post_type"],
                    "title": p["title"],
                    "upvotes": p["likes"],
                    "comments_count": p["comments"],
                    "video": p.get("video_file_path"),
                    "name": p["users"]["username"],
                    "pfp": p["users"]["profile_picture"],
                    "tags": [t["tags"]["tag_name"] for t in p["post_tags"]],
                    "liked": liked,
                }
            )

        posts = get_posts_helper(posts) if posts else []
        return jsonify({"posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------
# Fetch posts by user and category
# --------------------------------------------------------------------
@posts_bp.route("/get_posts_byUserAndCategory", methods=["GET"])
@token_optional
def get_posts_byUser(decoded):
    username = request.args.get("username")
    post_type = request.args.get("post_type")
    start = int(request.args.get("start"))
    limit = int(request.args.get("limit"))
    category = request.args.get("category")
    user_id = decoded["user_id"] if decoded else None
    print(user_id)

    if category not in {"post_date", "likes"}:
        return jsonify({"error": "Invalid sort category"}), 400
    if not username:
        return jsonify({"error": "Missing username"}), 400
    if not post_type:
        return jsonify({"error": "Missing post type"}), 400

    try:
        # First, get the user's id
        user_res = (
            supabase.table("users")
            .select("id")
            .eq("username", username)
            .single()
            .execute()
        )
        profile_user_id = user_res.data["id"]

        # Then fetch posts for that user
        res = (
            supabase.table("posts")
            .select("*, users(username, profile_picture), post_tags(tags(tag_name))")
            .eq("user_id", profile_user_id)
            .eq("post_type", post_type)
            .order(category, desc=True)
            .range(start, start + limit - 1)
            .execute()
        )

        posts = []
        for p in res.data:
            liked = False
            if user_id:
                like_check = (
                    supabase.table("likes")
                    .select("id")
                    .eq("user_id", user_id)
                    .eq("target_id", p["id"])
                    .eq("type", "posts")
                    .execute()
                )
                liked = bool(like_check.data)
            posts.append(
                {
                    "id": p["id"],
                    "date": p["post_date"],
                    "type": p["post_type"],
                    "title": p["title"],
                    "upvotes": p["likes"],
                    "comments_count": p["comments"],
                    "name": p["users"]["username"],
                    "pfp": p["users"]["profile_picture"],
                    "tags": [t["tags"]["tag_name"] for t in p["post_tags"]],
                    "liked": liked,
                }
            )

        posts = get_posts_helper(posts) if posts else []
        return jsonify({"posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------
# Delete a post
# --------------------------------------------------------------------
@posts_bp.route("/delete_post", methods=["DELETE"])
@token_required
def delete_post(decoded):
    data = request.get_json()
    post_id = data.get("post_id")
    video_file_path = data.get("video_file_path")
    user_id = decoded["user_id"]

    try:
        post = (
            supabase.table("posts")
            .select("user_id")
            .eq("id", post_id)
            .single()
            .execute()
        )
        if not post.data:
            return jsonify({"error": "Post not found"}), 404

        if user_id != post.data["user_id"]:
            return jsonify({"error": "403 Forbidden"}), 403

        supabase.table("posts").delete().eq("id", post_id).execute()
        supabase.table("likes").delete().eq("type", "posts").eq(
            "target_id", post_id
        ).execute()

        if video_file_path:
            removeFile(video_file_path)

        return jsonify({"success": "Post has been deleted"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------
# Get a specific post by ID
# --------------------------------------------------------------------
@posts_bp.route("/get_specific_post", methods=["GET"])
@token_optional
def get_specific_post(decoded):
    post_id = request.args.get("post_id")
    user_id = decoded["user_id"] if decoded else None

    try:
        res = (
            supabase.table("posts")
            .select("*, users(username, profile_picture), post_tags(tags(tag_name))")
            .eq("id", post_id)
            .single()
            .execute()
        )

        if not res.data:
            return jsonify({"error": "Post not found"}), 404

        p = res.data
        liked = False
        if user_id:
            like_check = (
                supabase.table("likes")
                .select("id")
                .eq("user_id", user_id)
                .eq("target_id", post_id)
                .eq("type", "posts")
                .execute()
            )
            liked = bool(like_check.data)

        post_data = {
            "id": p["id"],
            "date": p["post_date"],
            "type": p["post_type"],
            "title": p["title"],
            "body": p["post_body"],
            "video": p.get("video_file_path"),
            "upvotes": p["likes"],
            "comments_count": p["comments"],
            "name": p["users"]["username"],
            "pfp": p["users"]["profile_picture"],
            "tags": [t["tags"]["tag_name"] for t in p["post_tags"]],
            "liked": liked,
        }

        posts = get_posts_helper([post_data])
        return jsonify({"posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------
# Edit a post body
# --------------------------------------------------------------------
@posts_bp.route("/edit_post", methods=["POST"])
@token_required
def edit_post(decoded):
    data = request.get_json()
    new_post_body = data.get("new_post_body")
    post_id = request.args.get("post_id")
    user_id = decoded["user_id"]

    try:
        if len(new_post_body) > 4000:
            return jsonify({"error": "Post body cannot be over 4000 characters"}), 400

        # Update post
        supabase.table("posts").update({"post_body": new_post_body}).eq(
            "id", post_id
        ).eq("user_id", user_id).execute()

        return jsonify({"success": "Post edited!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
