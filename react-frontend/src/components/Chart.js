import React, { createRef } from "react";
import D3TsChart from "./ChartVisuals";

const MAX_POINTS_TO_STORE = 50; // Stored in client memory
const DEFAULT_X_TICKS = 30; // Granularity along x-axis

export class Chart extends React.Component {
  constructor(props) {
    super(props);
    // Series for sensor data, prediction and anomalies:
    this.seriesList = [
      {
        name: "sensor-data",
        type: "LINE",
        stroke: "#038C7E",
        strokeWidth: 5,
        label: "Reading",
        labelClass: "readings",
      },
    ];
    if (this.props.pred) {
      // if current signal has prediction properties
      this.seriesList.push(
        {
          name: "prediction",
          type: "LINE",
          stroke: "#E67002",
          strokeWidth: 3,
          label: "Prediction",
          labelClass: "prediction",
        },
        {
          name: "anomaly",
          type: "AREA",
          fill: "rgba(216, 13, 49, 0.35)",
          stroke: "transparent",
          strokeWidth: 0,
          label: "Anomaly",
          labelClass: "anomaly",
        }
      );
    }
    // Set threshold values for examples (predetermined based on experience):
    var threshold = 0;
    if (this.props.examples) {
      if (this.props.sensorId === "me1_exhausttemp1") {
        threshold = 6.5;
      }
      if (this.props.sensorId === "me1_exhausttemp2") {
        threshold = 15;
      }
    }
    // Instantiate a new D3TsChart:
    this.tsChart = new D3TsChart();
    this.wrapper = createRef(); // handle references to component node
    this.updateThreshold = this.updateThreshold.bind(this);

    this.state = {
      data: [], // storing values from the last MAX_POINTS_TO_STORE timesteps
      lastDatetime: null, // last registered datetime
      lastTimeStr: "", // last registered time
      lastDateStr: "", // last registered date
      connected: false, // status of signal
      error: "", // error message
      threshold: threshold, // threshold value as defined above
      predToggled: true, // boolean toggle status for prediction values
      anomToggled: true, // boolean toggle status for registered anomalies
    };
  }

  // If component is succesfully mounted
  componentDidMount() {
    const node = this.wrapper.current; // used for node ref

    // Initialize chart preliminaries:
    this.tsChart.init({
      elRef: node.getElementsByClassName("chart-container")[0],
      classList: {
        svg: "anomaly_chart",
      },
    });

    // Add series from seriesList:
    this.tsChart.addSeries(this.seriesList[0]); // readings
    if (this.props.pred) {
      this.tsChart.addSeries(this.seriesList[1]); // anomaly
      this.tsChart.addSeries(this.seriesList[2]); // prediction
    }

    this.attachFocusWatcher(); // call handler for window focus
  }

  // On change in props, affecting state over time:
  static getDerivedStateFromProps(nextProps, prevState) {
    // If next registered time is null (no valid reading provided):
    if (nextProps.values.time === null) {
      return { lastTimeStr: "", lastDateStr: "", connected: false };
    }
    let connected;
    let error;
    let datetime;
    nextProps.connected ? (connected = true) : (connected = false);
    connected ? (error = "") : (error = "Error: No new values found");
    const values = nextProps.values;
    connected
      ? (datetime = new Date(values.time))
      : (datetime = prevState.lastDatetime);
    const threshold = prevState.threshold;
    const timestamp = Date.parse(datetime);
    const dateStr = datetime.toLocaleDateString("en-GB");
    const timeStr = datetime.toLocaleTimeString("en-GB");
    const data = prevState.data;
    // Calculate storage slicer:
    const pointsToStore = Math.max(data.length - MAX_POINTS_TO_STORE, 0);
    var lastTimestamp = "";

    // Get last valid timestamp:
    if (prevState.data.length > 0) {
      lastTimestamp = prevState.data[prevState.data.length - 1].timestamp;
    }

    // Verify that the current timestamp differs from the last timestamp
    // to prevent excessive rerendering and faults in the chart:
    if (timestamp !== lastTimestamp) {
      // Initial definition of newValues:
      const newValues = {
        timestamp: timestamp,
        value: values.signal,
      };
      if (nextProps.pred) {
        // Adjust newValues if the current chart has a prediction state:
        newValues["pred"] = values.pred;
        newValues["deviation"] = Math.abs(newValues.value - newValues.pred);
        newValues["anomaly"] =
          threshold === 0 ? 0 : newValues["deviation"] > threshold ? 1 : 0;
      }
      data.push(newValues); // add newValues to existing data storage
      return {
        data: data.slice(pointsToStore), // slice data storage
        connected: connected,
        error: error,
        lastDatetime: datetime,
        lastDateStr: dateStr,
        lastTimeStr: timeStr,
      };
    } else {
      return {
        data: data.slice(pointsToStore),
        connected: connected,
        error: error,
        lastDatetime: datetime,
        lastDateStr: dateStr,
        lastTimeStr: timeStr,
      };
    }
  }

  // On component update:
  componentDidUpdate(_prev_props, _prevState) {
    this.updateChart(); // call chart update function
  }

  // Handle window focus
  attachFocusWatcher() {
    window.focused = true;
    window.onblur = () => {
      window.focused = false;
    };
    window.onfocus = () => {
      window.focused = true;
    };
  }

  updateChart() {
    /*
    Update necessary parts of the chart, including axes, y-axis value domain,
    and applying data from the latest timestep.
  */
    // Calculate number of values registered along x-axis (if more than
    // DEFAULT_X_TICKS values have been registered, the number of ticks maxes
    // out at DEFAULT_X_TICKS):
    const xTicks = Math.max(
      this.state.data.length - (this.props["x-ticks"] || DEFAULT_X_TICKS),
      0
    );
    const data = this.state.data.slice(xTicks); // get relevant values
    // Calculate highest value currently seen:
    var highestValueInView = Math.max(...data.map((p) => p.value));
    if (this.props.pred) {
      // If prediction values are included, calculate highest pred value:
      let highestPredInView = Math.max(...data.map((p) => p.pred));
      highestValueInView = Math.max(highestValueInView, highestPredInView);
    }

    // Apply anomaly line based on the currently registered maximum in-view
    // value (makes the anomalies take up the entirety of the y-domain):
    const anomalyLine = data.map((p) => ({
      timestamp: p.timestamp,
      value: p.anomaly ? highestValueInView : 0,
    }));

    this.tsChart.adjustAxes(data, this.props.pred);
    this.tsChart.setSeriesData("sensor-data", data, false);
    if (this.props.pred) {
      this.tsChart.setSeriesData("anomaly", anomalyLine, false);
      this.tsChart.setSeriesData("prediction", data, false);
    }
  }

  toggleSeries = ({ target }) => {
    /*
    On click, toggle series based on target id.
  */
    if (target.id === "anomaly") {
      this.setState({ anomToggled: !this.state.anomToggled });
    } else if (target.id === "prediction") {
      this.setState({ predToggled: !this.state.predToggled });
    }
    target.classList.toggle("hidden");
    this.tsChart.toggleSeries(target.id);
  };

  updateThreshold = (event) => {
    /*
    On click, update threshold value.
  */
    event.preventDefault();
    const thresholdValue = this.thresholdField.value;
    if (thresholdValue !== "") {
      // prevent empty, non-numeric values
      this.setState({ threshold: thresholdValue });
    }
  };

  // Render Chart component
  render = () => (
    <div className="card" ref={this.wrapper}>
      <h2>
        {!this.state.lastTimeStr
          ? `${this.props.sensorId.toUpperCase()} connecting...`
          : !this.state.connected
          ? `${this.props.sensorId.toUpperCase()}`
          : `${this.props.sensorId.toUpperCase()}: ${
              this.props.values.signal
            }`}
      </h2>

      <span
        className={"status " + (this.state.connected ? "success" : "danger")}
      >
        {this.state.error}
        <i className="pulse"></i>
        {this.state.connected ? "Connected" : "Disconnected"}
      </span>

      <div
        className={"chart-container " + (this.state.error ? "faded" : "")}
      ></div>

      <div className="legend">
        {this.seriesList.map((series) => {
          return (
            <span
              id={series.name}
              key={series.name}
              className={series.labelClass}
              onClick={this.toggleSeries}
            >
              <i className="box"></i>
              {series.label === "Anomaly" &&
              this.state.anomToggled &&
              this.state.connected
                ? `${series.label} (T: ${this.state.threshold})`
                : series.label === "Prediction" &&
                  this.state.predToggled &&
                  this.state.connected
                ? `${series.label} (dev: ${
                    this.state.data.length > 0
                      ? this.state.data[this.state.data.length - 1][
                          "deviation"
                        ].toFixed(2)
                      : 0
                  })`
                : series.label}
            </span>
          );
        })}
      </div>
      <span
        className={
          "timestamp " + (this.state.connected ? "success" : "danger")
        }
      >
        {this.state.connected
          ? `${this.state.lastDateStr} ${this.state.lastTimeStr}`
          : !this.state.lastTimeStr
          ? "No readings registered.."
          : `Last reading was at ${this.state.lastDateStr} ${this.state.lastTimeStr}`}
      </span>

      {this.props.pred
        ? [
            <div className="threshold-container">
              <hr
                style={{
                  border: "1px solid rgb(230,230,230)",
                  color: "rgb(230,230,230)",
                  backgroundColor: "rgb(230,230,230)",
                  marginBottom: "0px",
                }}
              />
              <br />

              <form
                className="threshold-form"
                onSubmit={(event) => this.updateThreshold(event)}
              >
                Anomaly threshold (T):
                <input
                  className="threshold-input"
                  type="number"
                  name="threshold"
                  autoComplete="off"
                  step="0.01"
                  ref={(threshold) => (this.thresholdField = threshold)}
                  onClick={(event) => this.updateThreshold(event)}
                />
                <button
                  className="threshold-submit"
                  onClick={(event) => this.updateThreshold(event)}
                >
                  Update
                </button>
              </form>
            </div>,
          ]
        : null}
    </div>
  );
}

export default Chart;
