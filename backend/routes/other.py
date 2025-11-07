from flask import Blueprint, request, jsonify
import datetime
import jwt
import time

from app import (
    token_required,
    token_optional,
    removeFile,
    get_posts_helper,
    supabase,
    SECRET_KEY,
)

other_bp = Blueprint("test", __name__)


# --------------------------------------------------------------------
# Extend user session (generate a new JWT)
# --------------------------------------------------------------------
@other_bp.route("/extend_session", methods=["POST"])
@token_required
def extend_session(decoded):
    try:
        new_token = jwt.encode(
            {
                "user_id": decoded["user_id"],
                "exp": datetime.datetime.now(datetime.timezone.utc)
                + datetime.timedelta(minutes=30),
            },
            SECRET_KEY,
            algorithm="HS256",
        )
        return jsonify({"token": new_token})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------
# Fetch logged-in user profile
# --------------------------------------------------------------------
@other_bp.route("/fetch_user_profile", methods=["GET"])
@token_required
def fetch_user_profile(decoded):
    user_id = decoded["user_id"]
    try:
        res = (
            supabase.table("users")
            .select("username, profile_picture")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if res.data:
            user = res.data
            return jsonify(
                {"username": user["username"], "pfp": user["profile_picture"]}
            )
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------
# Fetch public profile by username
# --------------------------------------------------------------------
@other_bp.route("/fetch_profile", methods=["GET"])
def fetch_profile():
    username = request.args.get("username")

    try:
        res = (
            supabase.table("users")
            .select(
                "email, profile_picture, profiles(about_me, github_link, year_of_study)"
            )
            .eq("username", username)
            .single()
            .execute()
        )
        if not res.data:
            return jsonify({"error": "User not found"}), 404

        profile = res.data

        result = {
            "about_me": profile["profiles"][0]["about_me"],
            "github_link": profile["profiles"][0]["github_link"],
            "year_of_study": profile["profiles"][0]["year_of_study"],
            "pfp": profile["profile_picture"],
            "email": profile["email"],
        }

        return jsonify({"profile": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------
# Edit logged-in user profile
# --------------------------------------------------------------------
@other_bp.route("/edit_profile", methods=["POST"])
@token_required
def edit_profile(decoded):
    data = request.form
    user_id = decoded["user_id"]
    about_me = data.get("about_me")
    email = data.get("email")
    github_link = data.get("github_link")
    year_of_study = data.get("year_of_study")
    pfp = data.get("pfp")
    new_pfp_url = None

    try:
        if len(about_me or "") > 1000:
            return jsonify({"error": "About Me cannot be over 1000 characters!"}), 409
        elif github_link and not github_link.startswith("https://github.com/"):
            return jsonify({"error": "Invalid Github link"}), 409

        # Upload new PFP if file is provided
        if "pfpFile" in request.files:
            pfpFile = request.files["pfpFile"]
            file_ext = pfpFile.filename.split(".")[-1]
            filename = f"{int(time.time() * 1000)}.{file_ext}"
            path = f"users-pfp/{filename}"

            file_bytes = pfpFile.read()

            supabase.storage.from_("uploads").upload(path, file_bytes)
            new_pfp_url = supabase.storage.from_("uploads").get_public_url(path)

            # remove old PFP if it’s not default
            if pfp and "Default_pfp.svg" not in pfp:
                removeFile(pfp)

        pfp_url = new_pfp_url if new_pfp_url else pfp

        # update users table
        supabase.table("users").update({"email": email, "profile_picture": pfp_url}).eq(
            "id", user_id
        ).execute()

        # update profiles table
        supabase.table("profiles").update(
            {
                "about_me": about_me,
                "github_link": github_link,
                "year_of_study": year_of_study,
            }
        ).eq("user_id", user_id).execute()

        return (
            jsonify({"success": "Your profile has been updated!", "pfp_url": pfp_url}),
            201,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------
# Like or Unlike a Post/Comment
# --------------------------------------------------------------------
@other_bp.route("/like_unlike", methods=["POST"])
@token_required
def like_unlike_post(decoded):
    data = request.get_json()
    user_id = decoded["user_id"]
    target_id = data.get("target_id")
    type = data.get("type")

    if type not in {"posts", "comments"}:
        return jsonify({"error": "Invalid type"}), 400

    try:
        # check if already liked
        existing = (
            supabase.table("likes")
            .select("id")
            .eq("user_id", user_id)
            .eq("target_id", target_id)
            .eq("type", type)
            .execute()
        )

        likes_col_name = "likes" if type == "posts" else "likes_count"

        if existing.data:
            # unlike
            supabase.table("likes").delete().eq("user_id", user_id).eq(
                "target_id", target_id
            ).eq("type", type).execute()
            likes_count = (
                supabase.table(type)
                .select(likes_col_name)
                .eq("id", target_id)
                .single()
                .execute()
            )
            supabase.table(type).update(
                {likes_col_name: likes_count.data[likes_col_name] - 1}
            ).eq("id", target_id).execute()
            action = "unliked"
        else:
            # like
            supabase.table("likes").insert(
                {"user_id": user_id, "target_id": target_id, "type": type}
            ).execute()
            likes_count = (
                supabase.table(type)
                .select(likes_col_name)
                .eq("id", target_id)
                .single()
                .execute()
            )
            supabase.table(type).update(
                {likes_col_name: likes_count.data[likes_col_name] + 1}
            ).eq("id", target_id).execute()
            action = "liked"

        return jsonify({"success": action}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------
# Fetch Liked Posts
# --------------------------------------------------------------------
@other_bp.route("/fetch_liked_posts", methods=["GET"])
@token_required
def fetch_liked_posts(decoded):
    limit = request.args.get("limit")
    offset = request.args.get("offset")
    user_id = decoded["user_id"]

    try:
        # fetch liked post IDs from likes table
        liked_posts = (
            supabase.table("likes")
            .select("target_id")
            .eq("user_id", user_id)
            .eq("type", "posts")
            .execute()
        )

        liked_post_ids = [item["target_id"] for item in liked_posts.data]

        if not liked_post_ids:
            return jsonify({"liked_posts": []})

        # fetch post data and related tables
        res = (
            supabase.table("posts")
            .select(
                """
                id,
                post_date,
                post_type,
                title,
                likes,
                comments,
                users(username, profile_picture),
                post_tags(tags(tag_name))
                """
            )
            .in_("id", liked_post_ids)
            .order("post_date", desc=True)
            .range(int(offset), int(offset) + int(limit) - 1)
            .execute()
        )

        posts = []
        for post in res.data:
            tags = []
            if post.get("post_tags"):
                tags = [
                    pt["tags"]["tag_name"] for pt in post["post_tags"] if pt.get("tags")
                ]

            posts.append(
                {
                    "id": post["id"],
                    "date": post["post_date"],
                    "type": post["post_type"],
                    "title": post["title"],
                    "upvotes": post["likes"],
                    "comments_count": post["comments"],
                    "name": post["users"]["username"],
                    "pfp": post["users"]["profile_picture"],
                    "tags": tags,
                    "liked": True,
                }
            )

        return jsonify({"liked_posts": posts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --------------------------------------------------------------------
# Search Posts
# --------------------------------------------------------------------
@other_bp.route("/search_posts", methods=["GET"])
@token_optional
def search_posts(decoded):
    search_term = request.args.get("search_term")
    limit = request.args.get("limit")
    offset = request.args.get("offset")
    post_type = request.args.get("post_type")
    user_id = decoded["user_id"] if decoded else None

    try:
        res = (
            supabase.table("posts")
            .select("*, users(username, profile_picture), post_tags(tags(tag_name))")
            .ilike("title", f"%{search_term}%")
            .eq("post_type", post_type)
            .range(int(offset), int(offset) + int(limit) - 1)
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


@other_bp.route("/search_profiles", methods=["GET"])
def search_profiles():
    search_term = request.args.get("search_term", "")
    limit = int(request.args.get("limit", 10))
    offset = int(request.args.get("offset", 0))

    try:
        # Use ilike for case-insensitive search
        res = (
            supabase.table("users")
            .select("id, profile_picture, username")
            .ilike("username", f"%{search_term}%")
            .range(offset, offset + limit - 1)
            .execute()
        )

        profiles_arr = [
            {"id": p["id"], "pfp": p["profile_picture"], "name": p["username"]}
            for p in (res.data or [])
        ]

        return jsonify({"profiles": profiles_arr})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@other_bp.route("/fetch_tags", methods=["GET"])
def fetch_tags():
    try:
        res = supabase.table("tags").select("tag_name, post_type").execute()
        all_tags = [
            {"tag_name": t["tag_name"], "post_type": t["post_type"]}
            for t in (res.data or [])
        ]
        return jsonify({"tags": all_tags})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@other_bp.route("/fetch_specific_tag", methods=["GET"])
@token_optional
def fetch_specific_tag(decoded):
    target_tag = request.args.get("target_tag")
    post_type = request.args.get("post_type")
    start = int(request.args.get("start", 0))
    limit = int(request.args.get("limit", 10))
    category = request.args.get("category", "post_date")
    user_id = decoded["user_id"] if decoded else None

    if category not in ["likes", "post_date"]:
        return jsonify({"error": "Invalid filter type"}), 400

    try:
        # Get posts of the given post_type that have the target_tag
        res = (
            supabase.table("posts")
            .select("*, users(username, profile_picture), post_tags(tags(tag_name))")
            .eq("post_type", post_type)
            .order(category, desc=True)
            .range(start, start + limit - 1)
            .execute()
        )
        posts_data = res.data or []

        # Filter posts that contain the target tag
        filtered_posts = [
            p
            for p in posts_data
            if any(t["tags"]["tag_name"] == target_tag for t in p.get("post_tags", []))
        ]

        # Check liked posts for the user
        liked_ids = set()
        if user_id and filtered_posts:
            post_ids = [p["id"] for p in filtered_posts]
            like_res = (
                supabase.table("likes")
                .select("target_id")
                .eq("user_id", user_id)
                .eq("type", "posts")
                .in_("target_id", post_ids)
                .execute()
            )
            liked_ids = {x["target_id"] for x in (like_res.data or [])}

        posts = []
        for p in filtered_posts:
            posts.append(
                {
                    "id": p["id"],
                    "date": p["post_date"],
                    "type": p["post_type"],
                    "title": p["title"],
                    "upvotes": p["likes"],
                    "comments_count": p["comments"],
                    "name": p["users"]["username"] if p.get("users") else None,
                    "pfp": p["users"]["profile_picture"] if p.get("users") else None,
                    "tags": [t["tags"]["tag_name"] for t in p.get("post_tags", [])],
                    "liked": p["id"] in liked_ids,
                }
            )

        posts_arr = get_posts_helper(posts)
        return jsonify({"posts": posts_arr})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
