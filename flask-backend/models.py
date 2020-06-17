from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class NogvaEngines(db.Model):
    """User model, which converts to a call to a defined table in the
    Heroku-PostgreSQL.database. A table could also be Pythonically made
    using the below methods from SQL Alchemy, as well as a create_all()
    method. Read the SQL Alchemy documentation for information about
    implementing new tables."""
    # Table name (if not specified, table name will default to class name):
    __tablename__ = 'Nogva Engines'

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
        the table 'NogvaEngines'. The dictionary filters out methods that are
        not signal names by removing underscore."""
        return {
                key:value for key, value in self.__dict__.items() \
                if not key.startswith('__') and not callable(value) \
                and not key.startswith('_')
            }

class dpHeading(db.Model):
    """Signals in table not implemented."""

    __tablename__ = 'DP Heading'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class dpThruster(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'DP Thruster'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class dpWind(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'DP Wind'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class drive_ps(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'Drive ps'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class drive_sb(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'Drive sb'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class etd_ps(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'ETD ps'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class etd_sb(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'ETD sb'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class gpsGga(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'GPS GGA'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class gpsVtg(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'GPS VTG'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class hcx_port_mp(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'HCX port MP'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class hcx_stbd_mp(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'HCX stbd MP'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class msb1(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'MSB1'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class msb2(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'MSB2'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class SeapathGPSGga(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'Seapath GPS GGA'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class SeapathGPSVbw(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'Seapath GPS VBW'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class SeapathGPSVtg(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'Seapath GPS VTG'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class SeapathMRU(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'Seapath MRU'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

class SeapathMRU_rates(db.Model):
    """Signals in table not implemented."""
    __tablename__ = 'Seapath MRU rates'

    id = db.Column(db.Integer, primary_key=True, nullable=False)
    pass

def get_models():
    return {
        'DP Heading': dpHeading,
        'DP Thruster': dpThruster,
        'DP Wind': dpWind,
        'Drive ps': drive_ps,
        'Drive sb': drive_sb,
        'ETD ps': etd_ps,
        'ETD sb': etd_sb,
        'GPS GGA': gpsGga,
        'GPS VTG': gpsVtg,
        'HCX port MP': hcx_port_mp,
        'HCX stbd MP': hcx_stbd_mp,
        'MSB1': msb1,
        'MSB2': msb2,
        'Nogva Engines': NogvaEngines,
        'Seapath GPS GGA': SeapathGPSGga,
        'Seapath GPS VBW': SeapathGPSVbw,
        'Seapath GPS VTG': SeapathGPSVtg,
        'Seapath MRU': SeapathMRU,
        'Seapath MRU rates': SeapathMRU_rates,
    }
