import React from "react";
import MultiSelect from "@khanacademy/react-multi-select";
import Chart from "./Chart";
import io from "socket.io-client";

// You are struggling to update index within the compDidUpdate function.
// Is there a better way to do this?

export class ChartDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: [], // signals
      options: [], // multi-select options
      chartItems: {}, // rendered charts
      sioStatus: false, // socket status
      allSignals: [],
    };
    this.system = this.props.system;
    this.inputs = this.props.inputs;
    this.outputs = this.props.outputs;
    this.timesteps = this.props.modelTimesteps;
  }
  socket;
  // If component is succesfully mounted
  componentDidMount() {
    fetch("keras_model/true");
    fetch("scaler/true");
    const strInputs = this.inputs.join(",");
    const strOutputs = this.outputs.join(",");
    fetch(`instantiate_thread/${this.system}/${strInputs}/${strOutputs}`);
    this.onReload(); // call reload function
    this.setSignalSelection(); // get list of signals based on API call to database
  }

  getStatus = (obj) => Object.keys(obj).length > 0;

  // Restart API thread if the page is reloaded
  onReload = () => {
    if (window.performance) {
      if (performance.navigation.type === 1) {
        fetch("reload"); // restart thread through API call
      }
    }
  };

  setSignalSelection = () => {
    const options = this.state.options;
    const outputs = this.outputs;
    const allSignals = [...new Set([...this.inputs, ...this.outputs])];
    for (let signal of allSignals) {
      options.push({
        label: outputs.includes(signal)
          ? `${signal} (with prediction)`
          : signal,
        value: signal,
      });
    }
    this.setState({
      options: options,
      allSignals: allSignals,
    });
  };

  // Get list of signals
  // signals = () => {
  //   let chartItems = this.state.chartItems;

  //   // API get-request
  //   fetch(`signals/${system}`).then((response) =>
  //     response.json().then((data) => {
  //       this.signals = data.signals;

  //       // Filter out 'id' and 'time' from list of possible signals
  //       this.signals = this.signals.filter((e) => e !== "id" && e !== "time");

  //       // Loop through signals
  //       for (let i = 0; i < this.signals.length; i++) {
  //         // Add signal as selector option with label and value
  //         this.options.push({
  //           label: this.signals[i],
  //           value: this.signals[i],
  //         });
  //       }

  //       // Update mounted states
  //       this.setState({
  //         options: this.options,
  //         chartItems: chartItems,
  //         sioStatus: this.getStatus(chartItems),
  //       });
  //     })
  //   );
  // };

  connect = () => {
    this.socket = io.connect(`/?system=${this.system}`);
  };

  componentDidUpdate(_prevProps, prevState) {
    let updateState = false; // affects useState at end of lifecycle method
    const selected = this.state.selected;
    const sioStatus = this.state.sioStatus;
    let chartItems = this.state.chartItems;
    const added = selected.filter((sig) => !prevState.selected.includes(sig));
    const deleted = prevState.selected.filter((sig) => !selected.includes(sig));

    this.manageSocketConnection(sioStatus, prevState.sioStatus);

    // If a signal is selected
    if (added.length > 0) {
      updateState = true;
      chartItems = this.addNewCharts(added, chartItems);
    }

    // If a signal is deselected
    if (deleted.length > 0) {
      updateState = true;
      chartItems = this.deleteUnselectedCharts(deleted, chartItems);
    }

    // Update socketIO connection or disconnection
    if (sioStatus) {
      if (added.length > 0 || deleted.length > 0 || prevState.modified) {
        this.socket.disconnect();
        this.connect();
      }
    }

    // If socketIO is connected, get values
    if (sioStatus) {
      this.getValues(selected);
    }

    if (updateState) {
      this.setUpdatedState(chartItems);
    }
  }

  manageSocketConnection = (currentStatus, previousStatus) => {
    if (currentStatus !== previousStatus) {
      currentStatus ? this.connect() : this.socket.disconnect();
    }
  };

  addNewCharts = (newlySelected, selectedItems) => {
    for (let sig of newlySelected) {
      const isSignalToPredict = this.outputs.includes(sig); // boolean
      selectedItems[sig] = this.addChart(sig, sig, isSignalToPredict, {
        id: undefined,
        time: undefined,
        signal: undefined,
      });
    }
    return selectedItems;
  };

  deleteUnselectedCharts = (newlyDeselected, selectedItems) => {
    for (let sig of newlyDeselected) {
      delete selectedItems[sig];
    }
    return selectedItems;
  };

  getValues = (selected) => {
    if (selected.length > 0) {
      fetch(`/update_selected/${selected.join()}`);
      this.socket.on("values", (values) => this.storeReading(values));
    }
  };

  storeReading = (values) => {
    var chartItems = {};
    const selected = this.state.selected;
    const time = values.time;
    const id = values.id;
    for (let sig of selected) {
      const isSignalToPredict = this.outputs.includes(sig); // boolean
      chartItems[sig] = this.addChart(sig, sig, isSignalToPredict, {
        id: id,
        time: time,
        signal: values[sig],
      });
    }
    this.setState({ chartItems: chartItems });
  };

  addChart = (sensor, key, pred, values) => {
    return <Chart sensorId={sensor} key={key} values={values} pred={pred} />;
  };

  setUpdatedState = (selectedItems) => {
    this.setState({
      chartItems: selectedItems,
      sioStatus: this.getStatus(selectedItems),
      modified: true,
    });
  };

  render() {
    const selected = this.state.selected;
    const options = this.state.options;
    const chartItems = this.state.chartItems;
    const noSignals = Object.keys(this.state.allSignals).length === 0;
    return (
      <div className="selector-chart-container">
        <div className="selector-container">
          <MultiSelect
            id="selector"
            options={options}
            selected={selected}
            onSelectedChanged={(selected) => this.setState({ selected })}
            overrideStrings={{
              selectSomeItems: noSignals
                ? "No signals found.."
                : "Select signals",
              allItemsAreSelected: "Showing all signals",
              selectAll: "Select all",
            }}
            disableSearch={true}
            isLoading={noSignals ? true : false}
          />
        </div>
        <div className="charts-container">{Object.values(chartItems)}</div>
      </div>
    );
  }
}

export default ChartDashboard;
