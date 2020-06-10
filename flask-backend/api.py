import time, random

from threading import Thread, Event
from flask import Flask, render_template, request, redirect, url_for
import eventlet
from flask_socketio import SocketIO, send, emit
from sqlalchemy.orm import load_only

from functions import *
from models import *

# Instantiate Flask application
app = Flask(__name__)
eventlet.monkey_patch()
# Add secret key
app.secret_key = 'change this'

# Configure PostgreSQL Heroku database
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://lxwpcwfzestkpm:45f3f577' \
                                        '60a95897b082549bb1df75ddcd6de7e662' \
                                        '87e5a200e66550cfd56aef@ec2-50-17-9' \
                                        '0-177.compute-1.amazonaws.com:5432' \
                                        '/d8q777aul5jc81'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # prevent console warning

# Initialize PostgreSQL Heroku database with SQL Alchemy
db = SQLAlchemy(app)

# Initialize Flask-SocketIO
socketio = SocketIO(app)
socketio.init_app(app, cors_allowed_origins="*")

INTERVAL = 1 # update interval in seconds

thread = Thread()
thread_stop_event = Event()

class PushThread(Thread):
    def __init__(self):
        self.delay = INTERVAL
        self.index = 1
        super(PushThread, self).__init__()

    def get_data(self):
        """Get data from the current index."""
        while not thread_stop_event.isSet():
            number1 = random.randint(0,4)
            if number1 < 1: number1 = 1
            else: number1 = 0
            number2 = random.randint(1,101)
            print(f" ix: {self.index}, sensor: {self.id}, socket: {self.sid}")
            # socketio.emit('get', {'new': self.index, 'sensor_id':self.id})
            socketio.emit('reading', {'timestamp':time.time(), 'value':number2, 'anomaly':number1})
            time.sleep(self.delay)
            self.index += 1
    def run(self):
        self.get_data()

global threads
threads = {}

socketio.connections = {} # handle connected signals

@app.route('/')
def index():
    return

@app.route('/signals', methods = ['GET', 'POST'])
def get_signals():
    return {'signals': MainEngines.__table__.columns.keys()}

@app.route('/timestamp_values/<id>/<time>/<col>', methods = ['GET', 'POST'])
def get_values(id, time, col):
    fields = [time, col]
    values = MainEngines.query.options(load_only(*fields)).get(id)
    return values.get_dict()

@socketio.on('test_message')
def handle_test_message(message):
    print('received message: ' + message)

@socketio.on('connect')
def on_connect():
    socket_id = request.sid
    sensor_id = request.args.get('sensor')
    print(f"New client '{sensor_id}' connected with connection id: {socket_id}")

    socketio.connections[socket_id] = {
        'sensor_id': sensor_id,
        index: 0
    }
    if sensor_id not in threads.keys():
        print(threads.keys())
        print(f"Starting thread for socket: '{socket_id}'...")
        threads[sensor_id] = PushThread()
        threads[sensor_id].id = sensor_id
        threads[sensor_id].sid = socket_id
        threads[sensor_id].start()
    else: print(f"Attempted to create duplicate thread for {sensor_id}")

# @socketio.on('threading')
# def get_thread(data):
#     return
    # Idea is to return new index and response


@socketio.on('disconnect')
def disconnect():
    del socketio.connections[request.sid]
    print(f'Client {request.sid} has been disconnected.')
    print(f'Number of remaining connections: {len(socketio.connections)}')


# @socketio.on('reading')
# def reading(data):
#     response = {
#         'timestamp': 0,
#         'value': 0,
#         'predicted': 0,
#     }
#     emit('reading', response)

# if __name__ == '__main__':
#     socketio.run(app, debug=True)