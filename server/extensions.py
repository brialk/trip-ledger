"""Shared extension objects. They are created here (empty) and connected
to the app inside create_app(), which avoids circular imports."""
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
