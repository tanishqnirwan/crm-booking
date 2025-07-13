from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from authlib.integrations.flask_client import OAuth #type: ignore

db = SQLAlchemy()
jwt = JWTManager()
oauth = OAuth() 