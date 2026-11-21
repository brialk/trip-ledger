import re

from flask import Blueprint, jsonify, session

from extensions import db
from models import User
from routes.helpers import ValidationError, current_user, error, json_body

auth_bp = Blueprint("auth", __name__)

USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,30}$")


def _log_in(user):
    session.clear()
    session["user_id"] = user.id
    session.permanent = True  # keep me logged in for 7 days


@auth_bp.post("/signup")
def signup():
    data = json_body()
    username = (data.get("username") or "").strip() if isinstance(data.get("username"), str) else ""
    password = data.get("password")

    if not USERNAME_RE.match(username):
        raise ValidationError("Username must be 3-30 letters, numbers or underscores.")
    if not isinstance(password, str) or len(password) < 8:
        raise ValidationError("Password must be at least 8 characters.")
    if len(password) > 72:  # bcrypt only reads the first 72 bytes
        raise ValidationError("Password must be 72 characters or fewer.")

    if User.query.filter(db.func.lower(User.username) == username.lower()).first():
        return error("That username is already taken.", 409)

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    _log_in(user)
    return jsonify({"user": user.to_dict()}), 201


# TODO(v2): rate-limit login attempts (for example Flask-Limiter) to slow down password guessing.
@auth_bp.post("/login")
def login():
    data = json_body()
    username = data.get("username")
    password = data.get("password")
    user = None
    if isinstance(username, str) and isinstance(password, str):
        user = User.query.filter(
            db.func.lower(User.username) == username.strip().lower()
        ).first()
    # Same message for "no such user" and "wrong password" so nobody can
    # use the form to find out which usernames exist.
    if user is None or not user.check_password(password):
        return error("Incorrect username or password.", 401)
    _log_in(user)
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.delete("/logout")
def logout():
    session.clear()
    return "", 204


@auth_bp.get("/check_session")
def check_session():
    user = current_user()
    return jsonify({"user": user.to_dict() if user else None}), 200
