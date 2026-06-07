import os
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "figurinhas-secret-key-dev")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")

    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    SQLITE_PATH = os.path.join(basedir, "database", "data.db")

    # Uploads
    UPLOAD_FOLDER = os.path.join(basedir, "static", "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "svg", "webp"}

    # WhatsApp
    WHATSAPP_NUMBER = os.getenv("WHATSAPP_NUMBER", "5511999999999")

    # Admin
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

    # Server
    @property
    def port(self):
        return int(os.getenv("PORT", 5000))

    @property
    def is_production(self):
        return self.FLASK_ENV == "production"

    @property
    def is_postgres(self):
        return bool(self.DATABASE_URL and self.DATABASE_URL.startswith("postgres"))
