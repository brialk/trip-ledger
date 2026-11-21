"""Small helpers shared by every route file."""
from datetime import date, datetime
from functools import wraps

from flask import jsonify, request, session

from extensions import db


class ValidationError(Exception):
    """Raised when the data a user sent is not acceptable (HTTP 422)."""

    def __init__(self, message):
        super().__init__(message)
        self.message = message


def error(message, status):
    return jsonify({"error": message}), status


def current_user():
    from models import User  # imported here to avoid a circular import

    user_id = session.get("user_id")
    return db.session.get(User, user_id) if user_id else None


def login_required(view):
    """Block anonymous visitors. The logged-in User is passed to the view."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        user = current_user()
        if user is None:
            session.clear()
            return error("Please log in to continue.", 401)
        return view(user, *args, **kwargs)

    return wrapper


def json_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValidationError("Send a JSON object in the request body.")
    return data


# ---- tiny validators: each returns a clean value or raises ValidationError

def req_text(data, field, label, max_len=120):
    value = data.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"{label} is required.")
    value = value.strip()
    if len(value) > max_len:
        raise ValidationError(f"{label} must be {max_len} characters or fewer.")
    return value


def opt_text(data, field, label, max_len=500):
    value = data.get(field)
    if value is None:
        return ""
    if not isinstance(value, str):
        raise ValidationError(f"{label} must be text.")
    value = value.strip()
    if len(value) > max_len:
        raise ValidationError(f"{label} must be {max_len} characters or fewer.")
    return value


def req_date(data, field, label):
    value = data.get(field)
    if not isinstance(value, str):
        raise ValidationError(f"{label} is required (YYYY-MM-DD).")
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ValidationError(f"{label} must be a real date like 2027-03-14.")


def req_cents(data, field, label, minimum=0):
    value = data.get(field)
    # bool is a subclass of int in Python, so rule it out on purpose
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValidationError(f"{label} must be a whole number of cents.")
    if value < minimum:
        raise ValidationError(f"{label} must be at least {minimum}.")
    if value > 100_000_000_00:
        raise ValidationError(f"{label} is too large.")
    return value


def opt_time(data, field, label):
    value = data.get(field)
    if value in (None, ""):
        return None
    if not isinstance(value, str):
        raise ValidationError(f"{label} must be a time like 14:30.")
    try:
        datetime.strptime(value, "%H:%M")
    except ValueError:
        raise ValidationError(f"{label} must be a time like 14:30.")
    return value


def one_of(value, allowed, label):
    if value not in allowed:
        raise ValidationError(f"{label} must be one of: {', '.join(allowed)}.")
    return value
