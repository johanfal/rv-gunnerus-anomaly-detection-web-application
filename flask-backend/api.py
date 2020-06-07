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
db = SQLAlchemy(app)


@app.route('/get_values', methods = ['GET', 'POST'])
def get_all_values():
    values = MainEngines.query.all()
    print(values[0])
    print(type(values))
    return {'values': values}

if __name__ == '__main__':
    socketio.run(app, debug=True)