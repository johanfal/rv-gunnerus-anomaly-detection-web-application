import React, { createRef } from "react";

import D3TsChart from "./ChartVisuals";

const MAX_POINTS_TO_STORE = 50;
const DEFAULT_X_TICKS = 30;
// const SOCKETIO_ERRORS = ['reconnect_error', 'connect_error', 'connect_timeout', 'connect_failed', 'error'];

/**
 *  Component cycle:
 * 1. `componentDidMount()`
 *     => Initialize a `D3TsChart()` with nod data
 * 2. `socket.connect()` pings WebSocket then on each `on('reading')` event:
 *     => `storeReading()` in component `state`
 *     => `updateChart()` seperates original data from peak detection series
 *         then calls `D3TsChart.setSeriesData()`
 *
 * 3. `componentWillUnmount()` disconects from socket.
 */
export class Chart extends React.Component {
  constructor(props) {
    super(props);
    var threshold = 0;
    var ofx = 0;
    if (this.props.samples) {
      if (this.props.sensorId === "me1_exhausttemp1") {
        ofx = 1.5;
        threshold = 5;
      }
      if (this.props.sensorId === "me1_exhausttemp2") {
        ofx = 10;
        threshold = 5;
      }
    }
    this.state = {
      data: [],
      lastTimeStr: null,
      lastDateStr: "",
      connected: false,
      error: "",
      status: null,
      threshold: threshold,
      ofx: ofx,
      predToggled: true,
      anomToggled: true,
    };
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

    this.tsChart = new D3TsChart();
    this.wrapper = createRef();
    this.updateThreshold = this.updateThreshold.bind(this);
  }

  socket;

  componentDidMount() {
    // At this point, this.props includes the input from the called component in "App.js"
    if (this.props["sensorId"] === undefined)
      throw new Error("You have to pass 'sensorId' prop to Chart component");
    if (this.props["x-ticks"] > MAX_POINTS_TO_STORE)
      throw new Error(
        `You cannot display more than ${MAX_POINTS_TO_STORE} 'x-ticks'. `
      );

    const node = this.wrapper.current; // used for node ref

    this.tsChart.init({
      elRef: node.getElementsByClassName("chart-container")[0],
      classList: {
        svg: "anomaly_chart",
      },
    });

    this.tsChart.addSeries(this.seriesList[0]); // readings
    if (this.props.pred) {
      this.tsChart.addSeries(this.seriesList[1]); // anomaly
      this.tsChart.addSeries(this.seriesList[2]); // prediction
    }

    this.attachFocusWatcher();
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.values.time === undefined) {
      return { lastTimeStr: null, lastDateStr: "", connected: false };
    }
    const values = nextProps.values;
    const threshold = prevState.threshold;
    const datetime = new Date(values.time);
    const timestamp = Date.parse(datetime);
    const dateStr = datetime.toLocaleDateString("en-GB");
    const timeStr = datetime.toLocaleTimeString("en-GB");
    const data = prevState.data;
    const pointsToStore = Math.max(data.length - MAX_POINTS_TO_STORE, 0);
    var lastTimestamp = "";
    if (prevState.data.length > 0) {
      lastTimestamp = prevState.data[prevState.data.length - 1].timestamp;
    }

    if (timestamp !== lastTimestamp) {
      const newValues = {
        timestamp: timestamp,
        value: values.signal,
      };
      if (nextProps.pred) {
        newValues["pred"] = values.pred + prevState.ofx;
        newValues["deviation"] = Math.abs(values.signal - newValues.pred);
        newValues["anomaly"] =
          threshold === 0 ? 0 : newValues["deviation"] > threshold ? 1 : 0;
      }

      data.push(newValues);
      return {
        data: data.slice(pointsToStore),
        connected: true,
        error: false,
        lastDateStr: dateStr,
        lastTimeStr: timeStr,
      };
    } else {
      return {
        data: data.slice(pointsToStore),
        connected: true,
        error: false,
        lastDateStr: dateStr,
        lastTimeStr: timeStr,
      };
    }
  }

  shouldComponentUpdate(_nextProps, _nextState) {
    return true;
  }

  componentDidUpdate(_prev_props, _prevState) {
    this.updateChart();
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
    const xTicks = Math.max(
      this.state.data.length - (this.props["x-ticks"] || DEFAULT_X_TICKS),
      0
    );
    const data = this.state.data.slice(xTicks);
    var highestValueInView = Math.max(...data.map((p) => p.value));
    if (this.props.pred) {
      let highestPredInView = Math.max(...data.map((p) => p.pred));
      highestValueInView = Math.max(highestValueInView, highestPredInView);
    }
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
    if (target.id === "anomaly") {
      this.setState({ anomToggled: !this.state.anomToggled });
    } else if (target.id === "prediction") {
      this.setState({ predToggled: !this.state.predToggled });
    }
    target.classList.toggle("hidden");
    this.tsChart.toggleSeries(target.id);
  };

  updateThreshold = (event) => {
    event.preventDefault();
    const thresholdValue = this.thresholdField.value;
    if (thresholdValue !== "") {
      this.setState({ threshold: thresholdValue });
    }
  };

  // Render Chart component
  render = () => (
    <div className="card" ref={this.wrapper}>
      <h2>
        {!this.state.lastTimeStr
          ? "Connecting..."
          : `${this.props.sensorId.toUpperCase()}: ${this.props.values.signal}`}
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
              {series.label === "Anomaly" && this.state.anomToggled
                ? `${series.label} (T: ${this.state.threshold})`
                : series.label === "Prediction" && this.state.predToggled
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
        className={"timestamp " + (this.state.connected ? "success" : "danger")}
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
                  autocomplete="off"
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
