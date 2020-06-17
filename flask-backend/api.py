import time, random, pickle, os

from flask import Flask, render_template, request, redirect, url_for
from flask_socketio import SocketIO, send, emit
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import load_only
from threading import Thread, Event
import eventlet
from tensorflow.keras.models import load_model
import numpy as np

from models import *

# Instantiate Flask application
app = Flask(__name__)

eventlet.monkey_patch() # ensure appropriate threading behavior

# Add secret key
app.secret_key = "b'\xb14AG\xab\xd8\x14\xb6^h\x05\xba@\xce 6'"
# app.secret_key = os.environ.get('SECRET')

# Configure PostgreSQL Heroku database with the database URL
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://dzetpohgmhykyo:224b34d1' \
                                        '3893d313b360dd10966bbfdb905ab323ef' \
                                        '15c7fa9cc3d712a9a909c7@ec2-34-225-' \
                                        '162-157.compute-1.amazonaws.com:54' \
                                        '32/d8s9d5jbimqmeo'

# Prevent unnecessary console warning:
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initiate database engine:
engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])

# Initialize PostgreSQL Heroku database with SQL Alchemy:
db = SQLAlchemy(app)
db.init_app(app)
# Initialize Flask-SocketIO:
socketio = SocketIO(app)
socketio.init_app(app, cors_allowed_origins="*")

INTERVAL = 1 # fetch interval from database in seconds (data frequency)

thread = Thread() # define thread object
thread_stop_event = Event() # define event used for stopping thread

# Global variables:
global timesteps, X_pred, X_tran, n_input_columns, keras_model, scaler, models

# Get dict of all model classes with table names as key, as defined in models.py:
models = get_models()

# Load sample Keras model (input shape: (n, 30, 12), output shape: (1,2)):
if False:
    keras_model = load_model('sample_model.h5')
    timesteps = keras_model.input_shape[1] # timesteps used in model
    n_input_columns = keras_model.input_shape[2] # number of input columns
    n_output_columns = keras_model.output_shape[1] # number of predicted columns
    # Load sample scaler:
    with open('sample_scaler.pckl', 'rb') as f:
        # Get scaler from pickled transformed data from API modeling:
        try: scaler = pickle.load(f)[0]
        # Get stand-alone scaler:
        except: scaler = pickle.load(f)

    # Retrieve the first t values to use for prediction, where t is the trained timesteps:
    X_pred = get_first_pred_values(timesteps, n_input_columns) # shape: (t, n)
    # Transform data from scaler:
    X_tran = np.array([scaler.transform(X_pred)]) # shape: (1, t, n)
    pred_values_tran = keras_model.predict(X_tran) # first prediction

@app.route('/systems', methods = ['GET', 'POST'])
def get_systems():
    """Return a list of systems based on the entry tables in the PostgreSQL
    database, which are instantiated through SQL Alchemy in 'models.py'."""
    systems = {}
    tables = engine.table_names()
    for table in tables:
        if not models[table].query.first():
            systems[table] = False # if result is None (empty table)
        else:
            systems[table] = True # if result is not None (non-empty table)
    return {'systems':systems} # return boolean dictionary with tables as keys

@app.route('/signals/<system_table>', methods = ['GET', 'POST'])
def get_signals(system_table):
    """Return a list of signals based on the entry table in the PostgreSQL
    database, which is instantiated through SQL Alchemy in 'models.py'. The
    function takes a string 'system_table' as input variable, which is the
    name of the selected system from the database."""
    table_props = inspect(engine).get_columns(system_table)
    signals = []

    # Get the name of each column of the selected system:
    for col in table_props:
        signals.append(col['name'])
    return {'signals': signals}

@app.route('/update_selected/<system_table>/<cols_str>', methods = ['GET', 'POST'])
def get_values(system_table, cols_str):
    """Updates fields and starts separate thread if no thread is alive."""
    columns = cols_str.split(',') # create a list from columns string
    fields = ['time']
    fields.extend(columns)
    thread.fields = fields
    thread.system = system_table
    if not thread.is_alive():
        thread.start()
    return {'thread_alive':True}
    # return values.get_dict()

@app.route('/reload', methods = ['GET'])
def stop_thread():
    """If the client window is reloaded and a thread is active in the
    background, this function discontinues the thread, meaning that upon
    page reload, a new thread will be initiated with new properties."""
    if thread.is_alive():
        global thread_stop_event
        thread_stop_event.set()
        print(f"Upon page reload, the thread has been discontinued.")
        return {'thread_stopped': True}
    engine.dispose()
    return {'thread_stopped': False}

@socketio.on('connect')
def on_connect():
    """SocketIO connect event."""
    global thread
    socket_id = request.sid
    system_id = request.args.get('system')
    thread_stop_event.clear()
    print(f"New client '{system_id}' connected with connection id: {socket_id}")
    if not thread.is_alive():
        print(f"Starting thread for socket: '{socket_id}'...")
        thread = ValueThread()
        thread.id = system_id
        thread.sid = socket_id
    else: print(f"Attempting to connect while thread is active")

# SocketIO disconnect event
def disconnect():
    """SocketIO disconnect event."""
    system_id = request.args.get('system')
    engine.dispose()
    print('Engine disposed after disconnecting')
    print(f"Client '{system_id}' has been disconnected.")

class ValueThread(Thread):
    """Handles signal thread, which allows the dynamic relationship between
    the database and client, allowing for a realtime transmission of data
    through websockets."""

    def __init__(self):
        """Instantiate class object."""
        self.delay = INTERVAL # frequency of updates
        self.index = timesteps+1 # initial index
        self.X_pred = []
        self.get_first_pred_values()
        super(ValueThread, self).__init__()

    def get_data(self):
        """Continuously emit information about the current database index to
        the client, which fetches data based on the index."""
        while not thread_stop_event.is_set():
            with app.app_context():
                # values = NogvaEngines.query.options(load_only(*self.fields)).get(self.index)
                # 'ME1_BackupBatt', 'ME1_Boostpress', 'ME1_EngineSpeed','ME1_ExhaustTemp1', 'ME1_ExhaustTemp2', 'ME1_FuelRate', 'ME1_Hours','ME1_LOPress', 'ME1_LubOilTemp', 'ME1_POWER', 'ME1_StartBatt','ME1_coolantTemp'
                # Format: (rowNums, timesteps, signals)
                pred_values = []
                values = db.session.query(self.system).get(self.index).get_dict()
                for key in NogvaEngines.__table__.columns.keys():
                    if key != 'id' and key != 'time':
                        pred_values.append(values[key])
                print('Keys: ', NogvaEngines.__table__.columns.keys())
                print(pred_values)
                # Does (1,1,12) work?
                values['time'] = str(values['time'])
                socketio.emit('values', values)
                pred_vals = values
                del pred_vals['time']
                counter = 1
                for key, value in values.items():
                    print(counter, key, value)
                    counter += 1
                # pred_vals = model.predict(values)
                print('\n\nPred:')
                # print(pred_vals)
                print('\n\n')
                time.sleep(self.delay)
                self.index += 1
        engine.dispose()
        print('Engine disposed after threading')

    def run(self):
        self.get_data()

def get_first_pred_values(timesteps, n_input_columns):
    with app.app_context():
        X_pred = [] # Placeholder for each timestep of signal values
        for i in range(1,timesteps + 1):
            values = NogvaEngines.query.get(i).get_dict()
            # Set first and second column to id and time, respectively:
            pred_values = []
            for key in NogvaEngines.__table__.columns.keys():
                if key != 'id' and key != 'time':
                    # Append current signal to values at current timestep:
                    pred_values.append(values[key])
            X_pred.append(pred_values) # append timestep values to total list
        return np.array(X_pred)
        # return np.reshape(X_pred, (1,timesteps,n_input_columns))

if __name__ == '__main__':
    socketio.run(app, debug=True)