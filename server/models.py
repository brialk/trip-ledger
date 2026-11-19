from datetime import datetime, timezone

from sqlalchemy import CheckConstraint

from extensions import bcrypt, db

# One shared list keeps the API, the database rules and the React dropdowns in sync
CATEGORIES = ["transport", "lodging", "food", "activities", "shopping", "other"]


def _now():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=_now, nullable=False)

    trips = db.relationship(
        "Trip", back_populates="user", cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        # Never include password_hash here
        return {"id": self.id, "username": self.username}


class Trip(db.Model):
    __tablename__ = "trips"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_trip_dates"),
        CheckConstraint("budget_cents >= 0", name="ck_trip_budget"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    destination = db.Column(db.String(120), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    budget_cents = db.Column(db.Integer, nullable=False, default=0)
    currency = db.Column(db.String(3), nullable=False, default="USD")  # display label only
    notes = db.Column(db.String(500), nullable=False, default="")
    created_at = db.Column(db.DateTime, default=_now, nullable=False)

    user = db.relationship("User", back_populates="trips")
    items = db.relationship(
        "ItineraryItem",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="ItineraryItem.item_date, ItineraryItem.start_time, ItineraryItem.id",
    )
    expenses = db.relationship(
        "Expense",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="Expense.spent_on.desc(), Expense.id.desc()",
    )

    @property
    def spent_cents(self):
        return sum(e.amount_cents for e in self.expenses)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "destination": self.destination,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "budget_cents": self.budget_cents,
            "spent_cents": self.spent_cents,
            "currency": self.currency,
            "notes": self.notes,
        }


class ItineraryItem(db.Model):
    __tablename__ = "itinerary_items"

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False, index=True)
    item_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(5), nullable=True)  # "14:30" or empty
    title = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(20), nullable=False, default="other")
    location = db.Column(db.String(120), nullable=False, default="")
    booked = db.Column(db.Boolean, nullable=False, default=False)
    notes = db.Column(db.String(500), nullable=False, default="")

    trip = db.relationship("Trip", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "trip_id": self.trip_id,
            "item_date": self.item_date.isoformat(),
            "start_time": self.start_time,
            "title": self.title,
            "category": self.category,
            "location": self.location,
            "booked": self.booked,
            "notes": self.notes,
        }


class Expense(db.Model):
    __tablename__ = "expenses"
    __table_args__ = (CheckConstraint("amount_cents > 0", name="ck_expense_amount"),)

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.id"), nullable=False, index=True)
    description = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(20), nullable=False, default="other")
    amount_cents = db.Column(db.Integer, nullable=False)
    spent_on = db.Column(db.Date, nullable=False)

    trip = db.relationship("Trip", back_populates="expenses")

    def to_dict(self):
        return {
            "id": self.id,
            "trip_id": self.trip_id,
            "description": self.description,
            "category": self.category,
            "amount_cents": self.amount_cents,
            "spent_on": self.spent_on.isoformat(),
        }
