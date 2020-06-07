import time
from flask import Flask, render_template

from flask_socketio import SocketIO, send, emit


from models import *

# Instantiate Flask application
app = Flask(__name__)

# Add secret key
app.secret_key = 'change this'


# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://lxwpcwfzestkpm:45f3f577' \
                                        '60a95897b082549bb1df75ddcd6de7e662' \
                                        '87e5a200e66550cfd56aef@ec2-50-17-9' \
                                        '0-177.compute-1.amazonaws.com:5432' \
                                        '/d8q777aul5jc81'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # prevent console warning

db = SQLAlchemy(app)

@app.route('/get_values', methods = ['GET', 'POST'])
def get_all_values():
    values = MainEngines.query.get(1)
    return_values = {
        'id': values.id,
        'time': values.time,
        # 'exh_temp1': values.me1_exhausttemp1,
        # 'exh_temp2': values.me1_exhausttemp2,
        # 'engine_speed': values.me1_enginespeed,
        'me1_backupbatt': values.me1_backupbatt,
        'me1_boostpress': values.me1_boostpress,
        'me1_enginespeed': values.me1_enginespeed,
        'me1_exhausttemp1': values.me1_exhausttemp1,
        'me1_exhausttemp2': values.me1_exhausttemp2,
        'me1_fuelrate': values.me1_fuelrate,
        'me1_hours': values.me1_hours,
        'me1_lopress': values.me1_lopress,
        'me1_luboiltemp': values.me1_luboiltemp,
        'me1_power': values.me1_power,
        'me1_startbatt': values.me1_startbatt,
        'me1_coolanttemp': values.me1_coolanttemp
    }

    return return_values

if __name__ == '__main__':
    socketio.run(app, debug=True)