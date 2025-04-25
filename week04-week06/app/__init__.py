# app/__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

# Initialize the db and migrate objects
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    # Initialize the Flask app
    app = Flask(__name__)

    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///users.db')  # Use environment variable for database URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')  # Use environment variable for SECRET_KEY

    # Initialize the db and migrate extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register the Blueprint for routes
    from app.routes import main_bp
    app.register_blueprint(main_bp)

    return app
