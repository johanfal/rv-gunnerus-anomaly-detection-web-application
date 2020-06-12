from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class MainEngines(db.Model):
    """User model, which converts to a call to a defined table in the
    Heroku-PostgreSQL.database. A table could also be Pythonically made
    using the below methods from SQL Alchemy, as well as a create_all()
    method. Read the SQL Alchemy documentation for information about
    implementing new tables."""
    # Table name (if not specified, table name will default to class name):
    __tablename__ = "MainEngines"

    # Define all desired columns (if reading from an existing table, the
    # column names are case sensitive and must match exactly. Thus, it is
    # possible to exclude columns which are unwanted):
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
        """Get a dictionary of all column names based on the class methods in
        the table 'MainEngines'. The dictionary filters out methods that are
        not signal names by removing underscore."""
        return {
                key:value for key, value in self.__dict__.items() \
                if not key.startswith('__') and not callable(value) \
                and not key.startswith('_')
            }