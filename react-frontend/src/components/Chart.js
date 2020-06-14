import React, {createRef, Component } from 'react';

import D3TsChart from '../d3-helpers/d3-ts-chart';

const MAX_POINTS_TO_STORE = 50;
const DEFAULT_X_TICKS = 20;
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
export class Chart extends Component {
    constructor(props) {
        super(props)


        this.state = {
            data: [],
            last_time_str: null,
            last_date_str: '',
            connected: false,
            error: '',
            status: null,
        }

        this.seriesList = [
            {
                name: 'sensor-data',
                type: 'LINE',
                stroke: '#038C7E',
                strokeWidth: 5,
                label: 'Reading',
                labelClass: 'readings',
            },
            {
                name: 'prediction',
                type: 'LINE',
                stroke: '#E67002',
                strokeWidth: 3,
                label: 'Prediction',
                labelClass: 'prediction'
            },
            {
                name: 'anomaly',
                type: 'AREA',
                fill: 'rgba(216, 13, 49, 0.35)',
                stroke: 'transparent',
                strokeWidth: 0,
                label: 'Anomaly',
                labelClass: 'anomaly',
            }
        ]
        this.tsChart = new D3TsChart();
        this.wrapper = createRef();
    }

    socket;

        componentDidMount() {

        // At this point, this.props includes the input from the called component in "App.js"
        if (this.props['sensor_id'] === undefined) throw new Error('You have to pass \'sensorId\' prop to Chart component');
        if (this.props['x-ticks'] > MAX_POINTS_TO_STORE) throw new Error(`You cannot display more than ${MAX_POINTS_TO_STORE} 'x-ticks'. `);

        const node = this.wrapper.current; // used for node ref

        this.tsChart.init({
            elRef: node.getElementsByClassName('chart-container')[0],
            classList: {
                svg: 'anomaly_chart'
            }
        });

            this.tsChart.addSeries(this.seriesList[0]); // readings
            this.tsChart.addSeries(this.seriesList[1]); // anomaly
            this.tsChart.addSeries(this.seriesList[2]); // prediction


            this.attachFocusWatcher();
    }

    static getDerivedStateFromProps(next_props, prev_state){
        // You are currently working on finding a condition that removes duplicates :)
        // Almost there!

        if(next_props.values.time === undefined){
            return {last_time_str: null,
                    last_date_str: '',
                    connected: false,}
        }
        const values = next_props.values;

        const datetime = new Date(values.time);
        const timestamp = Date.parse(datetime);
        const date_str = datetime.toLocaleDateString('en-GB');
        const time_str = datetime.toLocaleTimeString('en-GB');
        var last_timestamp = '';
        const data = prev_state.data;
        if(prev_state.data.length > 0){
            last_timestamp = prev_state.data[prev_state.data.length-1].timestamp
        }

        if(timestamp !== last_timestamp){
            const pointsToStore = Math.max(data.length - MAX_POINTS_TO_STORE, 0);
            const pred_value = values.signal + Math.floor(Math.random()*100)/100-0.5;
            var new_values;
            if(next_props.pred){
                new_values = {
                    timestamp: timestamp,
                    value: values.signal,
                    pred: pred_value,
                    anomaly: Math.abs(pred_value-values.signal) > 0.25 ? 1 : 0
                }
            } else {
                new_values = {
                    timestamp: timestamp,
                    value: values.signal,
                    anomaly: Math.abs(pred_value-values.signal) > 0.25 ? 1 : 0
                }
            }
            // Need to replace 0 below with anomaly 1 or 0
            data.push(new_values);

            return {data: data.slice(pointsToStore),
                    connected: true,
                    error: false,
                    last_date_str: date_str,
                    last_time_str: time_str
                }
        } else{
            return {
                data: data,
                connected: true,
                error:false,
                last_date_str: date_str,
                last_time_str: time_str
            }
        }
    }

    shouldComponentUpdate(_next_props, _next_state){return true;}

    componentDidUpdate(_prev_props, _prev_state){
        this.updateChart();
    }

        // Reading consists of:
        // - Timestamp
        // - Value
        // - Z-score

        // Modifications:
        // - Anomaly
        // - Predicted value

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

    /**
     * `highestValueInView` is used to calculate out the highest value in the currently
     * shown data in order to normalize the zscores 0/1 to it
     */
    updateChart() {
        const xTicks = Math.max(this.state.data.length - (this.props['x-ticks'] || DEFAULT_X_TICKS), 0);
        const data = this.state.data.slice(xTicks);
        var highestValueInView = Math.max(...data.map(p => p.value));
        if(this.props.pred){
            let highestPredInView = Math.max(...data.map(p => p.pred));
            highestValueInView = Math.max(highestValueInView, highestPredInView)
        }
        const anomalyLine = data.map(p => ({ timestamp: p.timestamp, value: p.anomaly ? highestValueInView : 0 }));

        this.tsChart.adjustAxes(data, this.props.pred);
        this.tsChart.setSeriesData('sensor-data', data, false);
        this.tsChart.setSeriesData('anomaly', anomalyLine, false);
        if(this.props.pred){
            this.tsChart.setSeriesData('prediction', data, false);
        }
    }

    toggleSeries = ({ target }) => {
        target.classList.toggle('hidden');
        this.tsChart.toggleSeries(target.id);
    }

    // Render Chart component
    render = () => (
        <div className="card" ref={this.wrapper}>
            <h2>{!this.state.last_time_str ? 'Connecting...' : `${this.props.sensor_id.toUpperCase()}: ${this.props.values.signal}`}</h2>

            <span className={'status ' + (this.state.connected ? 'success' : 'danger')}>
                {this.state.error}
                <i className="pulse"></i>
                {this.state.connected ? 'Connected' : 'Disconnected'}
            </span>

            <div className={'chart-container ' + (this.state.error ? 'faded' : '')}></div>

            <div className="legend">
                {this.seriesList.map((series) => {
                    return (
                        <span
                            id={series.name}
                            key={series.name}
                            className={series.labelClass}
                            onClick={this.toggleSeries}>
                            <i className="box"></i>
                            {series.label}
                        </span>
                    );
                })}
            </div>

            <span className={'timestamp ' + (this.state.connected ? 'success' : 'danger')}>
                {(this.state.connected) ? '' : 'Last reading was at '}
                {`${this.state.last_date_str} ${this.state.last_time_str}`}
            </span>

        </div>
    )
}

export default Chart;