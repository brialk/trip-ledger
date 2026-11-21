from flask import Blueprint, jsonify

from extensions import db
from models import CATEGORIES, Trip
from routes.helpers import (
    ValidationError, error, json_body, login_required, opt_text,
    req_cents, req_date, req_text,
)

trips_bp = Blueprint("trips", __name__)

CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "MXN"]


def get_my_trip(user, trip_id):
    """Load a trip ONLY if it belongs to this user. Someone else's trip looks
    exactly like a trip that does not exist (404), so ids can't be guessed."""
    return Trip.query.filter_by(id=trip_id, user_id=user.id).first()


def _clean_trip(data):
    title = req_text(data, "title", "Title")
    destination = req_text(data, "destination", "Destination")
    start = req_date(data, "start_date", "Start date")
    end = req_date(data, "end_date", "End date")
    if end < start:
        raise ValidationError("End date can't be before the start date.")
    currency = data.get("currency", "USD")
    if currency not in CURRENCIES:
        raise ValidationError(f"Currency must be one of: {', '.join(CURRENCIES)}.")
    return {
        "title": title,
        "destination": destination,
        "start_date": start,
        "end_date": end,
        "budget_cents": req_cents(data, "budget_cents", "Budget"),
        "currency": currency,
        "notes": opt_text(data, "notes", "Notes"),
    }


@trips_bp.get("/options")
def options():
    """Dropdown choices for the frontend (public, no secrets)."""
    return jsonify({"categories": CATEGORIES, "currencies": CURRENCIES}), 200


@trips_bp.get("/trips")
@login_required
def list_trips(user):
    trips = (
        Trip.query.filter_by(user_id=user.id).order_by(Trip.start_date, Trip.id).all()
    )
    return jsonify([t.to_dict() for t in trips]), 200


@trips_bp.post("/trips")
@login_required
def create_trip(user):
    fields = _clean_trip(json_body())
    trip = Trip(user_id=user.id, **fields)
    db.session.add(trip)
    db.session.commit()
    return jsonify(trip.to_dict()), 201


@trips_bp.get("/trips/<int:trip_id>")
@login_required
def get_trip(user, trip_id):
    trip = get_my_trip(user, trip_id)
    if trip is None:
        return error("Trip not found.", 404)
    return jsonify(trip.to_dict()), 200


@trips_bp.patch("/trips/<int:trip_id>")
@login_required
def update_trip(user, trip_id):
    trip = get_my_trip(user, trip_id)
    if trip is None:
        return error("Trip not found.", 404)
    data = json_body()
    # KNOWN ISSUE: shrinking the trip dates does not re-check existing itinerary items,
    # so an item can end up outside the new date range. TODO(v2): validate or warn.
    # PATCH: start from the current values, overlay what was sent, re-validate all
    merged = {
        "title": trip.title, "destination": trip.destination,
        "start_date": trip.start_date.isoformat(), "end_date": trip.end_date.isoformat(),
        "budget_cents": trip.budget_cents, "currency": trip.currency, "notes": trip.notes,
    }
    merged.update({k: v for k, v in data.items() if k in merged})
    for key, value in _clean_trip(merged).items():
        setattr(trip, key, value)
    db.session.commit()
    return jsonify(trip.to_dict()), 200


@trips_bp.delete("/trips/<int:trip_id>")
@login_required
def delete_trip(user, trip_id):
    trip = get_my_trip(user, trip_id)
    if trip is None:
        return error("Trip not found.", 404)
    db.session.delete(trip)
    db.session.commit()
    return "", 204
