"""Itinerary items and expenses. Both live inside a trip, so every route
first loads the trip through get_my_trip() (ownership check)."""
from flask import Blueprint, jsonify

from extensions import db
from models import CATEGORIES, Expense, ItineraryItem
from routes.helpers import (
    ValidationError, error, json_body, login_required, one_of, opt_text,
    opt_time, req_cents, req_date, req_text,
)
from routes.trips import get_my_trip

details_bp = Blueprint("details", __name__)

NO_TRIP = "Trip not found."


def _in_trip_range(trip, day, label):
    if not (trip.start_date <= day <= trip.end_date):
        raise ValidationError(
            f"{label} must be between {trip.start_date} and {trip.end_date} (the trip dates)."
        )


# ------------------------------------------------------------ itinerary
def _clean_item(trip, data):
    day = req_date(data, "item_date", "Date")
    _in_trip_range(trip, day, "Date")
    booked = data.get("booked", False)
    if not isinstance(booked, bool):
        raise ValidationError("Booked must be true or false.")
    return {
        "item_date": day,
        "start_time": opt_time(data, "start_time", "Time"),
        "title": req_text(data, "title", "Title"),
        "category": one_of(data.get("category", "other"), CATEGORIES, "Category"),
        "location": opt_text(data, "location", "Location", 120),
        "booked": booked,
        "notes": opt_text(data, "notes", "Notes"),
    }


def _get_item(trip, item_id):
    return ItineraryItem.query.filter_by(id=item_id, trip_id=trip.id).first()


@details_bp.get("/trips/<int:trip_id>/items")
@login_required
def list_items(user, trip_id):
    trip = get_my_trip(user, trip_id)
    if trip is None:
        return error(NO_TRIP, 404)
    return jsonify([i.to_dict() for i in trip.items]), 200


@details_bp.post("/trips/<int:trip_id>/items")
@login_required
def create_item(user, trip_id):
    trip = get_my_trip(user, trip_id)
    if trip is None:
        return error(NO_TRIP, 404)
    item = ItineraryItem(trip_id=trip.id, **_clean_item(trip, json_body()))
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@details_bp.patch("/trips/<int:trip_id>/items/<int:item_id>")
@login_required
def update_item(user, trip_id, item_id):
    trip = get_my_trip(user, trip_id)
    item = _get_item(trip, item_id) if trip else None
    if item is None:
        return error("Itinerary item not found.", 404)
    merged = item.to_dict()
    merged.update({k: v for k, v in json_body().items() if k in merged and k not in ("id", "trip_id")})
    for key, value in _clean_item(trip, merged).items():
        setattr(item, key, value)
    db.session.commit()
    return jsonify(item.to_dict()), 200


@details_bp.delete("/trips/<int:trip_id>/items/<int:item_id>")
@login_required
def delete_item(user, trip_id, item_id):
    trip = get_my_trip(user, trip_id)
    item = _get_item(trip, item_id) if trip else None
    if item is None:
        return error("Itinerary item not found.", 404)
    db.session.delete(item)
    db.session.commit()
    return "", 204


# ------------------------------------------------------------ expenses
def _clean_expense(trip, data):
    day = req_date(data, "spent_on", "Date")
    return {
        "description": req_text(data, "description", "Description"),
        "category": one_of(data.get("category", "other"), CATEGORIES, "Category"),
        "amount_cents": req_cents(data, "amount_cents", "Amount", minimum=1),
        "spent_on": day,
    }


def _get_expense(trip, expense_id):
    return Expense.query.filter_by(id=expense_id, trip_id=trip.id).first()


@details_bp.get("/trips/<int:trip_id>/expenses")
@login_required
def list_expenses(user, trip_id):
    trip = get_my_trip(user, trip_id)
    if trip is None:
        return error(NO_TRIP, 404)
    return jsonify([e.to_dict() for e in trip.expenses]), 200


@details_bp.post("/trips/<int:trip_id>/expenses")
@login_required
def create_expense(user, trip_id):
    trip = get_my_trip(user, trip_id)
    if trip is None:
        return error(NO_TRIP, 404)
    expense = Expense(trip_id=trip.id, **_clean_expense(trip, json_body()))
    db.session.add(expense)
    db.session.commit()
    return jsonify(expense.to_dict()), 201


@details_bp.patch("/trips/<int:trip_id>/expenses/<int:expense_id>")
@login_required
def update_expense(user, trip_id, expense_id):
    trip = get_my_trip(user, trip_id)
    expense = _get_expense(trip, expense_id) if trip else None
    if expense is None:
        return error("Expense not found.", 404)
    merged = expense.to_dict()
    merged.update({k: v for k, v in json_body().items() if k in merged and k not in ("id", "trip_id")})
    for key, value in _clean_expense(trip, merged).items():
        setattr(expense, key, value)
    db.session.commit()
    return jsonify(expense.to_dict()), 200


@details_bp.delete("/trips/<int:trip_id>/expenses/<int:expense_id>")
@login_required
def delete_expense(user, trip_id, expense_id):
    trip = get_my_trip(user, trip_id)
    expense = _get_expense(trip, expense_id) if trip else None
    if expense is None:
        return error("Expense not found.", 404)
    db.session.delete(expense)
    db.session.commit()
    return "", 204


# ------------------------------------------------------------ budget summary
@details_bp.get("/trips/<int:trip_id>/summary")
@login_required
def summary(user, trip_id):
    trip = get_my_trip(user, trip_id)
    if trip is None:
        return error(NO_TRIP, 404)
    by_category = {c: 0 for c in CATEGORIES}
    for e in trip.expenses:
        by_category[e.category] += e.amount_cents
    spent = trip.spent_cents
    budget = trip.budget_cents
    return jsonify({
        "budget_cents": budget,
        "spent_cents": spent,
        "remaining_cents": budget - spent,   # negative means over budget
        "over_budget": spent > budget,
        "percent_used": round(spent / budget * 100) if budget else None,
        "by_category": by_category,
        "currency": trip.currency,
    }), 200
