from flask import Flask
from sqlalchemy.exc import IntegrityError

from config import Config
from extensions import bcrypt, db, migrate
from routes.helpers import ValidationError, error


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    import models  # noqa: F401  (registers the tables)
    from routes.auth import auth_bp
    from routes.health import health_bp
    from routes.trip_details import details_bp
    from routes.trips import trips_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(trips_bp, url_prefix="/api")
    app.register_blueprint(details_bp, url_prefix="/api")

    # TODO(v2): add CSRF tokens. v1 relies on SameSite=Lax cookies only.
    register_error_handlers(app)

    @app.cli.command("seed")
    def seed_command():
        """Add a demo user and a sample trip."""
        from seed import seed

        seed()

    return app


def register_error_handlers(app):
    """Every error comes back as {"error": "..."} so the frontend can show it."""

    @app.errorhandler(ValidationError)
    def validation(e):
        return error(e.message, 422)

    @app.errorhandler(IntegrityError)
    def integrity(e):
        db.session.rollback()
        return error("That conflicts with existing data.", 409)

    @app.errorhandler(404)
    def not_found(e):
        return error("Not found.", 404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error("That method is not allowed here.", 405)

    @app.errorhandler(500)
    def server_error(e):
        db.session.rollback()
        return error("Something went wrong on our side.", 500)

