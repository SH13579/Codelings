from app import app
from routes.other import other_bp
from routes.posts import posts_bp
from routes.comments import comments_bp
from routes.user_auth import user_auth_bp

app.register_blueprint(other_bp)
app.register_blueprint(posts_bp)
app.register_blueprint(comments_bp)
app.register_blueprint(user_auth_bp)

if __name__ == "__main__":
    app.run(debug=True)
