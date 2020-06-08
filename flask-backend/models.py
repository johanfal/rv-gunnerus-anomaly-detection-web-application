from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class MainEngines(db.Model):
    """User model."""
    __tablename__ = "MainEngines"
    id = db.Column(db.Integer, primary_key=True, nullable=False)
    time = db.Column(db.DateTime, unique=True, nullable=False)
    me1_backupbatt = db.Column(db.Float)
    me1_boostpress = db.Column(db.Float)
    me1_enginespeed = db.Column(db.Integer)
    me1_exhausttemp1 = db.Column(db.Float)
    me1_exhausttemp2 = db.Column(db.Float)
    me1_fuelrate = db.Column(db.Float)
    me1_hours = db.Column(db.Integer)
    me1_lopress = db.Column(db.Float)
    me1_luboiltemp = db.Column(db.Float)
    me1_power = db.Column(db.Float)
    me1_startbatt = db.Column(db.Float)
    me1_coolanttemp = db.Column(db.Float)
    def get_dict(self):
        dct = {key:value for key, value in self.__dict__.items() if not key.startswith('__') and not callable(value) and not key.startswith('_')}
        return dct


class Users(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(25), unique=True, nullable=False)
    password = db.Column(db.String(), nullable=False)