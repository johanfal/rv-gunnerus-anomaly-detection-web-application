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

eventlet.monkey_patch() # ensure appropriate threading behavior

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

INTERVAL = 2 # update interval in seconds

thread = Thread()
thread_stop_event = Event()

class ValueThread(Thread):
    """Handles signal thread, which allows the dynamic relationship between
    the database and client, allowing for a realtime transmission of data
    through websockets."""

    def __init__(self):
        """Instantiate class object."""
        self.delay = INTERVAL # frequency of updates
        self.index = 1 # initial index
        super(ValueThread, self).__init__()

    def get_data(self):
        """Continuously emit information about the current database index to
        the client, which fetches data based on the index."""
        while not thread_stop_event.is_set():
            print(f" ix: {self.index}, system: {self.id}, socket: {self.sid}")
            socketio.emit('index', {'index': self.index})
            time.sleep(self.delay)
            self.index += 1

    def run(self):
        self.get_data()

@app.route('/signals', methods = ['GET', 'POST'])
def get_signals():
    """Return a list of signals based on the entry table in the PostgreSQL
    database, which is instantiated through SQL Alchemy in 'models.py'."""
    return {'signals': MainEngines.__table__.columns.keys()}

@app.route('/timestamp_values/<id>/<cols_str>', methods = ['GET', 'POST'])
def get_values(id, cols_str):
    columns = cols_str.split(',') # create a list from columns string
    print(columns, type(columns))
    fields = ['time']
    fields.extend(columns)
    values = MainEngines.query.options(load_only(*fields)).get(id)
    return values.get_dict()

@app.route('/reload', methods = ['GET'])
def stop_thread():
    """If the client window is reloaded and a thread is active in the
    background, this function discontinues the thread, meaning that upon
    page reload, a new thread will be initiated with new properties."""
    if thread.isAlive():
        global thread_stop_event
        thread_stop_event.set()
        print(f"The page has been reloaded, and the thread is discontinued.")
        return {'thread_stopped': True}
    return {'thread_stopped': False}

@socketio.on('connect')
def on_connect():
    global thread
    socket_id = request.sid
    system_id = request.args.get('system')
    thread_stop_event.clear()
    if True: # prevent thread with False
        print(f"New client '{system_id}' connected with connection id: {socket_id}")

        if not thread.is_alive():
            print(f"Starting thread for socket: '{socket_id}'...")
            thread = ValueThread()
            thread.id = system_id
            thread.sid = socket_id
            thread.start()
        else: print(f"Attempted to create duplicate thread for {system_id}")

@socketio.on('disconnect')
def disconnect():
    system_id = request.args.get('system')
    print(f"Client '{system_id}' has been disconnected.")

if __name__ == '__main__':
    socketio.run(app, debug=True)