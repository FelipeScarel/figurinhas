import os
import uuid
from werkzeug.utils import secure_filename
from config import Config


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    )


def save_upload(file, subfolder="orders"):
    if not file or file.filename == "":
        return None
    if not allowed_file(file.filename):
        return None

    original_ext = file.filename.rsplit(".", 1)[1].lower()
    hashed_name = f"{uuid.uuid4().hex}.{original_ext}"

    upload_dir = os.path.join(Config.UPLOAD_FOLDER, subfolder)
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, hashed_name)
    file.save(filepath)

    return f"uploads/{subfolder}/{hashed_name}"
