from werkzeug.utils import secure_filename
from models import *  # all table classes and function get_table_classes()
from tensorflow.keras.models import load_model
import os
import glob
import pickle
import random
import time
from threading import Event, Thread

import eventlet
import numpy as np
from flask import Flask, redirect, render_template, request, url_for
from flask_socketio import SocketIO, emit, send
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import load_only
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # remove delete

# Instantiate Flask application
app = Flask(__name__)

eventlet.monkey_patch()  # ensure appropriate threading behavior

# Add secret key
app.secret_key = "b'\xb14AG\xab\xd8\x14\xb6^h\x05\xba@\xce 6'"
# app.secret_key = os.environ.get('SECRET')

# Configure PostgreSQL Heroku database with the database URL
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://dzetpohgmhykyo:224b34d1' \
                                        '3893d313b360dd10966bbfdb905ab323ef' \
                                        '15c7fa9cc3d712a9a909c7@ec2-34-225-' \
                                        '162-157.compute-1.amazonaws.com:54' \
                                        '32/d8s9d5jbimqmeo'

UPLOADS_DIR = os.path.join(app.instance_path, 'uploads')
SAMPLES_DIR = os.path.join(app.instance_path, 'samples')
os.makedirs(UPLOADS_DIR, exist_ok=True)

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

INTERVAL = 1  # fetch interval from database in seconds (data frequency)


# Instantiating variables for global space:
[
    keras_model,
    model_properties,
    n_input_columns,
    scaler,
    table_classes,
    timesteps,
    X_pred,
    X_tran,
] = [None] * 8

thread = Thread()  # define thread object
thread_stop_event = Event()  # define event used for stopping thread


@app.route('/systems', methods=['GET', 'POST'])
def get_systems():
    """Return a list of systems based on the entry tables in the PostgreSQL
    database, which are instantiated through SQL Alchemy in 'models.py'."""
    global table_classes
    # Dict of all model classes from models.py with table names as key:
    table_classes = get_table_classes()
    systems = {}
    tables = engine.table_names()
    for table in tables:
        if not table_classes[table].query.first():
            systems[table] = False  # if result is None (empty table)
        else:
            systems[table] = True  # if result is not None (non-empty table)
    # return boolean dictionary with tables as keys
    return {'systems': systems}


@app.route('/signals/<system_table>', methods=['GET', 'POST'])
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


@app.route('/update_selected/<cols_str>',
           methods=['GET', 'POST'])
def get_values(system_table, cols_str):
    """Updates fields based on currently selected signals and starts
    thread-based parallelism if no thread is alive."""
    columns = cols_str.split(',')  # create a list from columns string
    selected_fields = ['time']
    selected_fields.extend(columns)
    thread.selected_fields = selected_fields

    if not thread.is_alive():
        thread.start()
    return {'thread_alive': True}


@app.route('/reload', methods=['GET'])
def stop_thread():
    """If the client window is reloaded and a thread is active in the
    background, this function discontinues the thread, meaning that upon
    page reload, a new thread will be initiated with new properties."""
    global engine, thread_stop_event
    if thread.is_alive():
        global thread_stop_event
        thread_stop_event = Event()
        thread_stop_event.set()
        print(f"Upon page reload, the thread has been discontinued.")
        return {'thread_stopped': True}
    engine.dispose()
    return {'thread_stopped': False}


@app.route('/keras_model/<use_sample>', methods=['GET', 'POST'])
def save_uploaded_model(use_sample):
    """Receives uploaded Keras model file from frontend client. If use_sample
    is true, the sample model, uploaded locally, is used instead."""
    global keras_model, model_properties
    if use_sample == 'true':
        sample_model_path = os.path.join(SAMPLES_DIR, 'sample_model.h5')
        keras_model = load_model(sample_model_path)
    else:
        file = request.files['file']
        model_path = os.path.join(
            UPLOADS_DIR, secure_filename(
                file.filename))
        file.save(model_path)
        print(f"succesfully saved model to '{model_path}'")
        try:
            keras_model = load_model(model_path)
        except BaseException:
            model_properties = False
    try:
        model_properties = {
            'inp': keras_model.input_shape[2],
            'out': keras_model.output_shape[1],
            'timesteps': keras_model.input_shape[1]
        }
    except BaseException:
        model_properties = False
    return {'fileprops': model_properties}


@app.route('/scaler/<use_sample>', methods=['GET', 'POST'])
def save_uploaded_scaler(use_sample):
    """Receives uploaded sklearn scaler file from frontend client. If
    use_sample is true, the sample scaler, uploaded locally, is used
    instead."""
    global scaler
    if use_sample == 'true':
        sample_scaler_path = os.path.join(
            SAMPLES_DIR, secure_filename('sample_scaler.pckl'))
        with open(sample_scaler_path, 'rb') as f:
            scaler = pickle.load(f)[0]
            fileprops = {
                'type': str(scaler),
                'features': scaler.n_features_in_,
                'samples': scaler.n_samples_seen_
            }
    else:
        file = request.files['file']
        uploaded_scaler_path = os.path.join(
            UPLOADS_DIR, secure_filename(file.filename))
        file.save(uploaded_scaler_path)
        print(f"succesfully saved scaler to '{uploaded_scaler_path}'")
        try:
            with open(uploaded_scaler_path, 'rb') as f:
                try:
                    scaler = pickle.load(f)[0]
                except BaseException:
                    scaler = pickle.load(f)
            fileprops = {
                'type': str(scaler),
                'features': scaler.n_features_in_,
                'samples': scaler.n_samples_seen_
            }
        except BaseException:
            fileprops = False
    return {'fileprops': fileprops}


@app.route('/instantiate_thread/<system>/<input_cols>/<output_cols>',
           methods=['GET', 'POST'])
def initiate_thread(system, input_cols, output_cols):
    input_cols = input_cols.split(",")
    output_cols = output_cols.split(",")

    global thread, thread_stop_event
    if not thread.is_alive():
        print(f"Initiating thread...")
        thread = ValueThread(system, input_cols, output_cols)
    else:
        print(f"Attempting to connect while thread is active")
    return {'thread_instantiated': True}


@socketio.on('connect')
def on_connect():
    """SocketIO connect event."""
    global thread, thread_stop_event
    sio_id = request.sid
    thread.sio_id = sio_id  # socket IO identification
    thread_stop_event.clear()
    print(
        f"New client '{request.args.get('system')}' connected with connection id: {sio_id}"
    )


@socketio.on('disconnect')
def disconnect():
    """SocketIO disconnect event."""
    global engine
    sys_id = request.args.get('system')
    engine.dispose()
    print('Engine disposed after disconnecting')
    print(f"Client '{sys_id}' has been disconnected.")


class ValueThread(Thread):
    """Handles signal thread, which allows the dynamic relationship between
    the database and client, allowing for a realtime transmission of data
    through websockets."""

    def __init__(self, system, input_cols, output_cols):
        """Instantiate class object."""
        self.system = system
        self.input_cols = input_cols  # inputs used for prediction in model
        self.output_cols = output_cols  # predicted output columns of model
        self.delay = INTERVAL  # frequency of updates
        # model timesteps used
        self.timesteps = model_properties['timesteps']
        self.index = model_properties['timesteps'] + 1  # initial index
        # Get the input values for the first timestep-values:
        self.X_pred = self.get_first_input_values()
        super(ValueThread, self).__init__()

    def get_first_input_values(self):
        """First input values corresponding with the Keras model timesteps.
        If the model uses n timesteps, the function fetches the first n values
        of the requested system from the database, and returns a scaled numpy
        array-vector of size n, which is used for predicting new values. The
        input_columns variables coincide with the columns used to create the
        model, and are the same as the chosen inputs during model and scaler
        uploading."""
        timesteps = self.timesteps
        input_cols = self.input_cols
        system = self.system
        global table_classes  # Delete (only when startpage is disabled)
        # Delete (only when startpage is disabled)
        table_classes = get_table_classes()
        with app.app_context():  # enable database access through SQLAlchemy
            X_pred = []  # Placeholder for each timestep of signal values
            for i in range(1, timesteps + 1):
                ordered_values = []
                values = table_classes[system].query.options(
                    load_only(*input_cols)).get(i).get_dict()
                for col in input_cols:
                    ordered_values.append(values[col])
                # append current timestep values
                X_pred.append(ordered_values)
        # Transform, reshape to (1, t, n), and convert to numpy array:
        return np.array([scaler.transform(X_pred)])

    def get_data(self):
        """Continuously emit information about the current database index to
        the client, which fetches data based on the index."""
        while not thread_stop_event.is_set():
            with app.app_context():
                # values = NogvaEngines.query.options(load_only(*self.selected_fields)).get(self.index)
                # 'ME1_BackupBatt', 'ME1_Boostpress', 'ME1_EngineSpeed','ME1_ExhaustTemp1', 'ME1_ExhaustTemp2', 'ME1_FuelRate', 'ME1_Hours','ME1_LOPress', 'ME1_LubOilTemp', 'ME1_POWER', 'ME1_StartBatt','ME1_coolantTemp'
                # Format: (rowNums, timesteps, signals)
                pred_values = []
                values = db.session.query(
                    self.system).get(
                    self.index).get_dict()
                for key in NogvaEngines.__table__.columns.keys():
                    if key != 'id' and key != 'time':
                        pred_values.append(values[key])
                # print('Keys: ', NogvaEngines.__table__.columns.keys())
                print(pred_values)
                # Does (1,1,12) work?
                values['time'] = str(values['time'])
                socketio.emit('values', values)
                pred_vals = values
                del pred_vals['time']
                counter = 1
                for key, value in values.items():
                    # print(counter, key, value)
                    counter += 1
                # pred_vals = model.predict(values)
                # print('\n\nPred:')
                # print(pred_vals)
                # print('\n\n')
                time.sleep(self.delay)
                self.index += 1
        engine.dispose()
        print('Engine disposed after threading')

    def run(self):
        self.get_data()


if __name__ == '__main__':
    socketio.run(app, debug=True)
