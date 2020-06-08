import time, random

from threading import Thread, Event
from flask import Flask, render_template, request

from flask_socketio import SocketIO, send, emit

from functions import *
from models import *

# Instantiate Flask application
app = Flask(__name__)

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

INTERVAL = 1 # update interval in seconds

thread = Thread()
thread_stop_event = Event()

class PushThread(Thread):
    def __init__(self):
        self.delay = INTERVAL
        super(PushThread, self).__init__()

    def get_data(self):
        """Get data from the current index."""
        while not thread_stop_event.isSet():
            number = round(random.randint(1,101))
            socketio.emit('newnumber', {'number': number})
            time.sleep(self.delay)

    def run(self):
        self.get_data()

# Handle connected signals
socketio.connections = {}

data = [
    {
        "readings": [1, 2, 1, 0, 1, 2, 1, 8, 9, 8, 1, 2, 0, 2, 1, 2, 3, 1, 2, 0, 8, 9, 2, 0, 3, 0, 2, 1, 2, 3, 8, 10, 2, 1, 2, 3, 0, 1, 2, 1, 2, 7, 6, 9, 1, 2, 0, 1, 2, 1],
        "zScores": [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0]
    },
    {
        "readings": [0, 2, 1, 2, 3, 10, 12, 1, 1, 2, 3, 0, 1, 2, 1, 2, 7, 6, 9, 1, 2, 0, 1, 2, 1, 2, 1, 3, 0, 2, 3, 1, 1, 2, 3, 10, 9, 12, 0, 2, 3, 1, 2, 0, 1, 7, 11, 0, 1, 2],
        "zScores": [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0]
    },
    {
        "readings": [2, 1, 3, 0, 2, 2, 9, 7, 2, 3, 1, 2, 9, 8, 2, 3, 1, 2, 0, 1, 2, 3, 0, 10, 9, 1, 2, 1, 0, 1, 2, 1, 8, 9, 8, 1, 2, 0, 2, 1, 2, 1, 14, 10, 0, 1, 1, 2, 0, 3],
        "zScores": [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0]
    }
]

data_s1 = data[0]
data_s2 = data[1]
data_s3 = data[2]


@app.route('/get_values', methods = ['GET', 'POST'])
def get_timestamp_values():
    values = MainEngines.query.get(1)
    return values.get_dict()

@socketio.on('test_message')
def handle_test_message(message):
    print('received message: ' + message)

@socketio.on('connect')
def connect():
    global thread
    print('\n\n\nConnected')
    print(f'New client connected with connection id: {request.sid}')
    # socketio.connections[request.sid] = {}
    sensor_id = request.args.get('sensor')
    if not thread.isAlive():
        print("Starting thread...")
        thread = PushThread()
        thread.start()


@socketio.on('custom_test')
def custom_test(message):
    print("\n\nThis is the id:")
    emit('test', {'data': 'connected'})


@app.route('/ping')
def ping():
    socketio.emit('ping event', {'data': 42})

    # connection_id = socket.id
    # sensor_id = socket['sensor']
    # print(f"New client connected with id {sensor_id}")

# @socketio.on('disconnect')
# def disconnect():
#     emit('event-disconnect', {'data': 'disconnected'})
#     # print(f'Client {data.id} disconnected')

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