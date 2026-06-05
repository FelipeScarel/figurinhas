import os
from flask import Flask, send_from_directory, send_file
from config import Config
from database import init_db, close_db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure upload directories exist
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(Config.UPLOAD_FOLDER, "produtos"), exist_ok=True)
    os.makedirs(os.path.join(Config.UPLOAD_FOLDER, "pedidos"), exist_ok=True)

    # Database init
    init_db()

    # Seed admin and sample data
    with app.app_context():
        from seeds.seed import seed_all

        seed_all()

    # Register API/admin blueprints
    from controllers.auth import auth
    from controllers.admin import admin
    from controllers.orders import orders_api

    app.register_blueprint(auth)
    app.register_blueprint(admin)
    app.register_blueprint(orders_api)

    # Serve uploaded files
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # Serve Next.js static frontend
    frontend_out = os.path.join(os.path.dirname(__file__), "frontend", "out")

    # IMPORTANT: Specific routes MUST be registered BEFORE catch-all
    @app.route("/_next/static/<path:filename>")
    def serve_next_static(filename):
        return send_from_directory(os.path.join(frontend_out, "_next", "static"), filename)

    @app.route("/_next/image")
    def serve_next_image():
        from flask import abort
        abort(404)

    @app.route("/")
    def serve_index():
        index_path = os.path.join(frontend_out, "index.html")
        if os.path.exists(index_path):
            return send_file(index_path)
        # Fallback to old Jinja vitrine if Next.js build doesn't exist
        from models.figurinha import get_all_categorias, get_all_figurinhas
        from flask import render_template
        return render_template(
            "index.html",
            categorias=get_all_categorias(),
            figurinhas=get_all_figurinhas(),
        )

    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api/") or path.startswith("admin/") or path.startswith("uploads/"):
            from flask import abort
            abort(404)

        file_path = os.path.join(frontend_out, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_file(file_path)

        # SPA fallback
        index_path = os.path.join(frontend_out, "index.html")
        if os.path.exists(index_path):
            return send_file(index_path)

        from flask import abort
        abort(404)

    # Teardown
    app.teardown_appcontext(close_db)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
