"""Demo data. Run with:  flask seed   (safe to run again; it won't duplicate)."""
from datetime import date

from extensions import db
from models import Expense, ItineraryItem, Trip, User

DEMO_USER = "demo"
DEMO_PASSWORD = "demo-pass-123"


def seed():
    if User.query.filter_by(username=DEMO_USER).first():
        print("Demo user already exists - nothing to do.")
        return
    user = User(username=DEMO_USER)
    user.set_password(DEMO_PASSWORD)
    db.session.add(user)
    db.session.flush()

    trip = Trip(
        user_id=user.id, title="Lisbon Getaway", destination="Lisbon, Portugal",
        start_date=date(2027, 5, 1), end_date=date(2027, 5, 7),
        budget_cents=250000, currency="USD", notes="Pastel de nata tour is a must.",
    )
    db.session.add(trip)
    db.session.flush()

    db.session.add_all([
        ItineraryItem(trip_id=trip.id, item_date=date(2027, 5, 1), start_time="15:00",
                      title="Check in at hotel", category="lodging", location="Baixa", booked=True),
        ItineraryItem(trip_id=trip.id, item_date=date(2027, 5, 2), start_time="09:30",
                      title="Tram 28 ride", category="transport", location="Alfama"),
        ItineraryItem(trip_id=trip.id, item_date=date(2027, 5, 2), start_time="19:30",
                      title="Fado dinner", category="food", location="Bairro Alto", booked=True),
        ItineraryItem(trip_id=trip.id, item_date=date(2027, 5, 4), start_time="10:00",
                      title="Day trip to Sintra", category="activities", location="Sintra"),
        Expense(trip_id=trip.id, description="Hotel (7 nights)", category="lodging",
                amount_cents=105000, spent_on=date(2027, 5, 1)),
        Expense(trip_id=trip.id, description="Airport taxi", category="transport",
                amount_cents=3200, spent_on=date(2027, 5, 1)),
        Expense(trip_id=trip.id, description="Fado dinner", category="food",
                amount_cents=8450, spent_on=date(2027, 5, 2)),
        Expense(trip_id=trip.id, description="Sintra tickets", category="activities",
                amount_cents=4200, spent_on=date(2027, 5, 4)),
    ])
    db.session.commit()
    print(f"Created demo user '{DEMO_USER}' (password: {DEMO_PASSWORD}) with one sample trip.")
