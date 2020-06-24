from werkzeug.utils import secure_filename
from models import *  # all table classes and function get_table_classes()
from tensorflow.keras.models import load_model
import os
import pickle
import time
from threading import Event, Thread

import eventlet
import numpy as np
from flask import Flask, redirect, render_template, request, url_for
from flask_socketio import SocketIO, emit, send
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import load_only, session

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

# Directories for uploaded files and sample files:
UPLOADS_DIR = os.path.join(app.instance_path, 'uploads')
SAMPLES_DIR = os.path.join(app.instance_path, 'samples')
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Prevent unnecessary console warning:
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initiate database engine:
engine = create_engine(
    app.config['SQLALCHEMY_DATABASE_URI'],
    pool_size=40,
    max_overflow=80)

# Initialize PostgreSQL Heroku database with SQL Alchemy:
db = SQLAlchemy(app)
db.init_app(app)

# Initialize Flask-SocketIO:
socketio = SocketIO(app)
socketio.init_app(app, cors_allowed_origins='*')

INTERVAL = 1  # fetch interval from database in seconds (data frequency)


# Instantiating variables for global scope:
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
thread_stop_event = Event()  # define threading-event (used for termination)


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
    # Properties of current system table, used to retrieve table columns:
    table_props = inspect(engine).get_columns(system_table)
    signals = []  # placeholder for signals

    # Name of each column of the selected system:
    for col in table_props:
        signals.append(col['name'])
    return {'signals': signals}


@app.route('/start_thread')
def start_thread():
    """Start thread for processing parallelism."""
    if not thread.is_alive():
        thread.start()
    return {'thread_alive': True}


@app.route('/reload', methods=['GET'])
def stop_thread():
    """If the client window is reloaded and a thread is active in the
    background, this function discontinues the thread, meaning that upon page
    reload, a new thread will be initiated with new properties."""
    global engine, thread, thread_stop_event
    if thread.is_alive():
        thread_stop_event = Event()  # define stop event
        thread_stop_event.set()  # set stop event
        del thread  # delete thread to prevent double-initiation
        thread = Thread()  # create new thread object
        print(f'Upon page reload, the thread has been discontinued.')
        return {'thread_stopped': True}
    engine.dispose()
    return {'thread_stopped': False}


@app.route('/keras_model/<use_sample>', methods=['GET', 'POST'])
def save_uploaded_model(use_sample):
    """Receives uploaded Keras model file from frontend client. If use_sample
    is true, the sample model, uploaded locally, is used instead."""
    global keras_model, model_properties
    if use_sample == 'true':  # load sample model
        sample_model_path = os.path.join(SAMPLES_DIR, 'sample_model.h5')
        keras_model = load_model(sample_model_path)
    else:  # load uploaded model based on filename request from client
        file = request.files['file']  # request from client
        model_path = os.path.join(
            UPLOADS_DIR, secure_filename(
                file.filename))
        file.save(model_path)  # save to UPLOADS_DIR with provided filename
        print(f"succesfully saved model to '{model_path}'")
        try:
            # Attempt to load Keras model with native Keras function:
            keras_model = load_model(model_path)
        except BaseException:
            # Something went wrong during Keras model loading:
            model_properties = False
    try:
        # Attempt to set properties through native Keras attributes:
        model_properties = {
            'inp': keras_model.input_shape[2],
            'out': keras_model.output_shape[1],
            'timesteps': keras_model.input_shape[1]
        }
    except BaseException:
        # Something went wrong when reading model properties:
        model_properties = False
    return {'fileprops': model_properties}


@app.route('/scaler/<use_sample>', methods=['GET', 'POST'])
def save_uploaded_scaler(use_sample):
    """Receives uploaded sklearn scaler file from frontend client. If
    use_sample is true, the sample scaler, uploaded locally, is used
    instead."""
    global scaler
    if use_sample == 'true':  # load sample scaler
        sample_scaler_path = os.path.join(
            SAMPLES_DIR, secure_filename('sample_scaler.pckl'))
        with open(sample_scaler_path, 'rb') as f:
            scaler = pickle.load(f)[0]  # retrieve scaler from pickle object
            # Set scaler properties:
            scaler_propertis = {
                'type': str(scaler),
                'features': scaler.n_features_in_,
                'samples': scaler.n_samples_seen_
            }
    else:  # load uploaded scaler based on filename requested from client
        file = request.files['file']  # request from client
        uploaded_scaler_path = os.path.join(
            UPLOADS_DIR, secure_filename(file.filename))
        # Save to UPLOADS_DIR with provided filename
        file.save(uploaded_scaler_path)
        print(f"succesfully saved scaler to '{uploaded_scaler_path}'")
        try:
            with open(uploaded_scaler_path, 'rb') as f:
                try:  # Attempt to load scaler with native pickle function:
                    # Scaler part of modeling API exported file, containing
                    # [scaler, df_train, df_test]:
                    scaler = pickle.load(f)[0]
                except BaseException:
                    # Scaler uploaded independently of modeling API:
                    scaler = pickle.load(f)
            # Attempt to set properties through native Sklearn attributes:
            scaler_propertis = {
                'type': str(scaler),
                'features': scaler.n_features_in_,
                'samples': scaler.n_samples_seen_
            }
        except BaseException:
            # Something went wrong when loading scaler or reading properties:
            scaler_propertis = False
    return {'fileprops': scaler_propertis}


@app.route('/create_thread/<system>/<input_cols>/<output_cols>',
           methods=['GET', 'POST'])
def initiate_thread(system, input_cols, output_cols):
    global thread, thread_stop_event
    # convert strings from client to lists with comma-delimiter:
    input_cols = input_cols.split(',')
    output_cols = output_cols.split(',')

    if not thread.is_alive():
        print(f'Creating thread object..')
        thread = ValueThread(system, input_cols, output_cols)
    else:
        print(f'Attempting to connect while thread is active')
    return {'thread_created': True}


@socketio.on('connect')
def on_connect():
    """SocketIO connect event."""
    global thread, thread_stop_event
    sio_id = request.sid
    thread.sio_id = sio_id  # socket IO identification
    thread_stop_event.clear()
    print(
        f"New client '{request.args.get('system')}' connected with "
        f"connection id: {sio_id}"
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
        # Variable for columns that will be queried from database:
        self.fetch_columns = ['time']
        self.fetch_columns.extend(self.input_cols)
        self.output_cols = output_cols  # predicted output columns of model
        self.output_indices = self.get_output_indices()
        self.delay = INTERVAL  # frequency of updates
        # model timesteps used
        self.timesteps = model_properties['timesteps']
        # Set initial index (database follows a not-null approach, meaning the
        # first row index is 1):
        self.index = self.timesteps  # initial index
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
        with app.app_context():  # enable database access through SQLAlchemy
            X_pred = []  # Placeholder for each timestep of signal values
            for i in range(1, timesteps):
                ordered_values = []
                values = db.session.query(table_classes[system]).options(
                    load_only(*input_cols)).get(i).get_dict()
                for col in input_cols:
                    ordered_values.append(values[col])
                # append current timestep values
                X_pred.append(ordered_values)
        # Return transformed values with shape (timesteps, features):
        db.session.close()
        return scaler.transform(X_pred)

    def get_output_indices(self):
        """Returns a list with the position of each output column in the
        ordered input list. During reverse transform of data (from normalized
        to original magnitude of values) the order of the signals matters.
        Since the original data is fetched, and can be transmitted to the
        client before normalization, only the predicted values must be reverse
        transformed before being sent to the client."""
        indices = []
        for pred_sig in self.output_cols:
            indices.append(self.input_cols.index(pred_sig))
        return indices

    def get_data(self):
        """Continuously emit information about the current database index to
        the client, which fetches data based on the index."""
        # Create placeholder list for predicted values, which must be filled
        # with all input columns to reverse transform properly:
        pred_vals_list = [[None] * len(self.input_cols)]
        while not thread_stop_event.is_set():
            with app.app_context():
                start_time = time.time()

                # Query values as dictionary containing input_cols and time:
                try:
                    values = db.session.query(
                        table_classes[self.system]).options(
                        load_only(*self.fetch_columns)).get(
                        self.index).get_dict()
                    values['time'] = str(values['time'])
                    ordered_values = []
                    # Order values correctly according to model, and exclude
                    # time:
                    for col in self.input_cols:
                        ordered_values.append(values[col])
                    # Scale new values:
                    scaled_values = scaler.transform([ordered_values])
                    # Add new values to the end of X_pred:
                    self.X_pred = np.append(
                        self.X_pred, scaled_values, axis=0)

                    # Predict values at the next timestep (the input must be a
                    # numpy array with shape (1,timesteps, features)):
                    pred_values = keras_model.predict(
                        np.array([self.X_pred]))
                    pred_value_counter = 0
                    # Add values to placeholder list for predictions:
                    for index in self.output_indices:
                        pred_vals_list[0][index] = pred_values[0][
                            pred_value_counter
                        ]
                        pred_value_counter += 1
                    # Inverse transform predicted values:
                    pred_vals_list = scaler.inverse_transform(pred_vals_list)
                    # Add predicted values from placeholder list to values
                    # dict:
                    pred_value_counter = 0
                    for pred_col in self.output_cols:
                        pred_key = f'{pred_col}_pred'
                        values[pred_key] = pred_vals_list[0][
                            self.output_indices[pred_value_counter]
                        ]
                        pred_value_counter += 1

                    socketio.emit('values', values)
                    self.X_pred = self.X_pred[1:]
                    # Time used for prediction, manipulations, and emission:
                    calculation_time = time.time() - start_time
                    if calculation_time > 1:
                        sleep_time = 0
                    else:
                        sleep_time = self.delay - calculation_time
                    time.sleep(sleep_time)
                    self.index += 1

                except BaseException:
                    thread_stop_event.set()
        db.session.close()
        try:
            thread_stop_event.set()
        except BaseException:
            pass
        socketio.emit('values', False)
        engine.dispose()
        print('Engine disposed after threading')

    def run(self):
        self.get_data()


if __name__ == '__main__':
    socketio.run(app, debug=True)
