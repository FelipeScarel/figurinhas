import os
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "figurinhas-secret-key-dev")
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    SQLITE_PATH = os.path.join(basedir, "database", "data.db")
    UPLOAD_FOLDER = os.path.join(basedir, "static", "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "svg", "webp"}
    WHATSAPP_NUMBER = os.getenv("WHATSAPP_NUMBER", "5511999999999")
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

    @property
    def is_postgres(self):
        return bool(self.DATABASE_URL and self.DATABASE_URL.startswith("postgres"))
