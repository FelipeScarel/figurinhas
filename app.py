from flask import Flask, send_from_directory
from config import Config
from database import init_db, close_db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure upload directories exist
    import os

    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(Config.UPLOAD_FOLDER, "products"), exist_ok=True)
    os.makedirs(os.path.join(Config.UPLOAD_FOLDER, "orders"), exist_ok=True)

    # Database init
    init_db()

    # Seed admin and sample data
    with app.app_context():
        from seeds.seed import seed_all

        seed_all()

    # Register blueprints
    from controllers.auth import auth
    from controllers.orders import orders
    from controllers.admin import admin

    app.register_blueprint(auth)
    app.register_blueprint(orders)
    app.register_blueprint(admin)

    # Serve uploaded files
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # Teardown
    app.teardown_appcontext(close_db)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
