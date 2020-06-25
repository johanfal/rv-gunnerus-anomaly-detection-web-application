import React from "react";
import MultiSelect from "@khanacademy/react-multi-select";
import Chart from "./Chart";
import io from "socket.io-client";

export class ChartDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: [], // signals
      options: [], // multi-select options
      chartItems: {}, // rendered charts
      connected: false, // connection status of Socket IO
      allSignals: [], // all signals available for visualization
      thread_created: false, // boolean if thread has been created
      error: false, // handle threading error
    };
    // Property definitions from parent:
    this.system = this.props.system;
    this.inputs = this.props.inputs;
    this.outputs = this.props.outputs;
    this.timesteps = this.props.modelTimesteps;
    this.sampleFiles = this.props.sampleFiles;
  }

  // If component is succesfully mounted
  componentDidMount() {
    fetch(`keras_model/${this.sampleFiles}`); // fetch model from server API
    fetch(`scaler/${this.sampleFiles}`); // fetch scaler from server API
    // Convert inputs and outputs to strings for easier parsing to API server:
    const strInputs = this.inputs.join(",");
    const strOutputs = this.outputs.join(",");
    this.onReload(); // handle window reload
    this.connect(); // connect socket IO

    // Start threading object in API, and generate the first input values to
    // the prediction model:
    fetch(`create_thread/${this.system}/${strInputs}/${strOutputs}`).then(
      (response) =>
        response.json().then((data) => {
          if (data.thread_created) {
            this.setSignalSelection();
            this.setState({
              thread_created: data.thread_created,
            });
          } else {
            this.setState({
              thread_created: data.thread_created,
              error: true,
            });
          }
        })
    );
  }

  connect = () => {
    /*
      Establish conenction between server and client through Socket IO
      websocket.
    */
    this.socket = io.connect(`/?system=${this.system}`);
  };

  onReload = () => {
    /*
      Restart necessary parts of the API threading and socket connections upon
      reloading the browser window.
    */
    if (window.performance) {
      if (performance.navigation.type === 1) {
        fetch("reload"); // stop thread activity through API call
      }
    }
  };

  setSignalSelection = () => {
    /*
      Get signals based on inputs and outputs in the model parameters.
    */
    const options = this.state.options;
    const outputs = this.outputs;
    // Non-repeating union of signals:
    const allSignals = [...new Set([...this.inputs, ...this.outputs])];
    for (let signal of allSignals) {
      options.push({
        label: outputs.includes(signal) // if signal will be predicted
          ? `${signal} (with prediction)` // label with prediction
          : signal, // label without prediction
        value: signal, // value used as access key
      });
    }
    this.setState({
      options: options, // update options for multi-select dropdown menu
      allSignals: allSignals, // set all signals
    });
  };

  componentDidUpdate(_prevProps, prevState) {
    /*
      Handle changes to component states before rerender.
    */
    // Booleans to determine if state and Socket IO status will be updated:
    let updateState = false;
    let updateConnectionStatus = false;
    // Current parameters:
    const selected = this.state.selected; // selected
    const connected = this.state.connected; // connection status
    let chartItems = this.state.chartItems; // Chart component items
    // Determine newly added and/or deleted signals:
    const added = selected.filter((sig) => !prevState.selected.includes(sig));
    const deleted = prevState.selected.filter(
      (sig) => !selected.includes(sig)
    );

    // If a signal has been newly selected:
    if (added.length > 0) {
      // If Socket IO is not connected:
      if (!connected) {
        updateConnectionStatus = true;
      }
      updateState = true; // state needs to be updated to reflect changes

      // Add newly selected charts:
      chartItems = this.addNewCharts(added, chartItems, connected);
    }

    // If a signal has been newly deselected:
    if (deleted.length > 0) {
      updateState = true; // state needs to be updated to reflect changes
      // Delete newly deselected charts:
      chartItems = this.deleteDeselectedCharts(deleted, chartItems);
    }

    if (updateState) {
      this.setUpdatedState(chartItems, updateConnectionStatus);
    }
  }

  addChart = (sensor, key, pred, samples, connected, values) => {
    /*
      Returns a Chart component based on defined properties:
        - sensor: name of the current sensor
        - key: unique identifier
        - pred: boolean, true if the signal is part of predicted outputs
        - samples: boolean, true if sample files are used
        - connected: boolean, true if signal is connected and receiving values
        - values: latest id, timestep, reading, and pred (if applicable)
    */
    return (
      <Chart
        sensorId={sensor}
        key={key}
        pred={pred}
        samples={samples}
        connected={connected}
        values={values}
      />
    );
  };

  addNewCharts = (newlySelected, selectedItems, connected) => {
    /*
      Append newly selected charts to selectedItems with correct parameters
      necessary for the AddChart() function.
    */
    for (let sig of newlySelected) {
      // If current signal is an output column in the prediction model:
      const isSignalToPredict = this.outputs.includes(sig); // boolean
      // Set initial values as undefined:
      const values = {
        id: null,
        time: null,
        signal: null,
        pred: null,
      };
      // Add current signal from newly selected as a new chart:
      selectedItems[sig] = this.addChart(
        sig,
        sig,
        isSignalToPredict,
        this.sampleFiles,
        connected,
        values
      );
    }
    return selectedItems;
  };

  deleteDeselectedCharts = (newlyDeselected, selectedItems) => {
    /*
      Deleted newly deselected chart from selectedItems object
    */
    for (let sig of newlyDeselected) {
      delete selectedItems[sig];
    }
    return selectedItems;
  };

  getValues = () => {
    /*
      Socket IO call to API server, which fetches data each time the server
      emits new values. When new values are received, the values are sent
      to the checkReading() function immediately. The values include columns
      for id, time, and all relevant signals. If the signals are part of the
      predicted outputs, the predicted values of these signals are also
      included with a key suffix of "_pred".
    */
    if (this.state.selected.length > 0) {
      this.socket.on("values", (values) => this.checkReading(values));
    }
  };

  checkReading = (values) => {
    /*
      Determines whether or not the values last received are valid or false.
      If the values are valid, the storeReading() function is called.
    */
    var connected = this.state.connected;
    if (values === false) {
      // If disconnected, update the Socket IO status:
      this.socket.disconnect();
      this.setState({
        connected: false,
      });
      connected = false;
    }
    // If connected, update and store reading in Chart items:
    this.storeReading(values, connected);
  };

  storeReading = (values, connected) => {
    /*
      Update Charts based on last received values from API server.
    */
    var chartItems = {};
    const selected = this.state.selected;
    const time = values.time;
    const id = values.id;
    for (let sig of selected) {
      // If current signal is an output column in the prediction model:
      const isSignalToPredict = this.outputs.includes(sig); // boolean

      // Add current signal as a new Chart with updated values:
      chartItems[sig] = this.addChart(
        sig,
        sig,
        isSignalToPredict,
        this.sampleFiles,
        connected,
        {
          id: id,
          time: time,
          signal: values[sig],
          // Add prediction signal if isSignalToPredict is true:
          pred: isSignalToPredict ? values[`${sig}_pred`] : null,
        }
      );
    }
    // Update chartItems state with new values:
    this.setState({ chartItems: chartItems });
  };

  setUpdatedState = (selectedItems, updateConnectionStatus) => {
    /*
      If a new signal has been newly selected or deselected, update the
      chart items to reflect these changes. If the connection status needs to
      be changed, connected is set to true, and the threading used in the
      API client (enabling parallel multi-processing) will be started.
      Consecutively, the client should start listening for new values through
      the Socket IO connection. This is established through the getValues()
      function.
    */
    if (updateConnectionStatus) {
      this.setState({
        chartItems: selectedItems,
        connected: true,
      });
      fetch("start_thread"); // start threading for parallelism
      this.getValues(); // fetch newly emitted values from server
    } else {
      this.setState({
        chartItems: selectedItems,
      });
    }
  };

  componentWillUnmount() {
    /*
      Handle component termination
    */
    if (this.state.connected) {
      this.socket.disconnect();
    }
  }

  // Render component:
  render() {
    const selected = this.state.selected;
    const options = this.state.options;
    const chartItems = this.state.chartItems;
    const error = this.state.error;
    const noSignals = Object.keys(this.state.allSignals).length === 0;
    const thread_created = this.state.thread_created;
    return (
      <div className="selector-chart-container">
        <div className="selector-container">
          <MultiSelect
            id="selector"
            options={options}
            selected={selected}
            onSelectedChanged={(selected) => this.setState({ selected })}
            overrideStrings={{
              selectSomeItems:
                error && !thread_created
                  ? "Failed to create threading. Please reload the page"
                  : !thread_created
                  ? "Initializing, please wait.."
                  : noSignals
                  ? "No signals found.."
                  : "Select signals",
              allItemsAreSelected: "Showing all signals",
              selectAll: "Select all",
            }}
            disableSearch={true}
            isLoading={noSignals || !thread_created ? true : false}
          />
        </div>
        <div className="charts-container">{Object.values(chartItems)}</div>
      </div>
    );
  }
}

export default ChartDashboard;
