import React from 'react';
import MultiSelect from "@khanacademy/react-multi-select";
import Chart from '../components/Chart';
import io from 'socket.io-client';

// You are struggling to update index within the compDidUpdate function.
// Is there a better way to do this?

export class Selector extends React.Component {
    constructor(props){
        super(props);
        this.state = {
        selected: [], // signals
        options: [], // multi-select options
        chart_items: {}, // rendered charts
        sio_status: false, // socket status
        // index: 1, // timestep tracker
        }
    }
    socket;
    system = this.props.system;

    getStatus = (obj) =>  Object.keys(obj).length > 0

    // If component is succesfully mounted
    componentDidMount() {
        this.on_reload(); // call reload function
        this.signals(); // get list of signals based on API call to database
    }

    // Restart API thread if the page is reloaded
    on_reload = () => {
        if(window.performance) {
            if(performance.navigation.type === 1) {
                fetch('reload') // restart thread through API call
            }
        }
    }

    // Get list of signals
    signals = () => {
        const selected = this.state.selected;
        let chart_items = this.state.chart_items;

        // API get-request
        fetch('signals').then(response => response.json().then(data => {
            this.signals = data.signals;
            this.options = []

            // Filter out 'id' and 'time' from list of possible signals
            this.signals = this.signals.filter(e => e !== 'id' && e !== 'time')

            // Loop through signals
            for(let i = 0; i < this.signals.length; i++){

                // Add signal as selector option with label and value
                this.options.push({
                                    label: this.signals[i],
                                    value: this.signals[i]
                                })
            }

            for(let sig of selected){
                chart_items[sig]= <Chart sensor_id={sig} key={sig} />
            }

            // Update mounted states
            this.setState({
                            options: this.options,
                            chart_items: chart_items,
                            sio_status: this.getStatus(chart_items)
                        })
        }));
    }

    connect = () => {
        this.socket = io.connect(`/?system=${this.system}`)
    }

    componentDidUpdate(_prevProps, prevState){
        let update_state = false; // update with setState at end of lifecycle method
        const curr_selected = this.state.selected;
        const sio_status = this.state.sio_status;
        let chart_items = this.state.chart_items;
        const added = curr_selected.filter(sig => !prevState.selected.includes(sig));
        const deleted = prevState.selected.filter(sig => !curr_selected.includes(sig));

        if(sio_status !== prevState.sio_status){
            sio_status ? this.connect() : this.socket.disconnect();
        }

        // If a signal is selected
        if(added.length > 0){
            update_state = true;
            for(let sig of added){
                    console.log('added ' + sig)
                    chart_items[sig] = <Chart sensor_id={sig} key={sig} />
                }
        }

        // If a signal is deselected
        if(deleted.length > 0){
            update_state = true;
            for(let sig of deleted){
                delete chart_items[sig];
                console.log('deleted ' + sig)
            }
        }

        if(sio_status){
            if(added.length > 0 || deleted.length > 0 || prevState.modified){
                this.socket.disconnect()
                this.connect()
                // SOMETHNIG BOUT THIS IS WORKING HUN
            }
        }
        this.get_values(sio_status)

        if(update_state){
            this.setState({
                chart_items: chart_items,
                sio_status: this.getStatus(chart_items),
                modified: true
            })
        }
    }

    get_values = (sio_status) => {
        if(sio_status){
            // this.socket.emit('register_index', prev_index)
                this.socket.on('new_index', (data) => {
                    console.log(data.new_index, this.state.selected);

                // fetch(
                //     `/timestamp_values/${index}/${curr_selected}`
                // )
            });
        }
    }

    render() {
        const selected = this.state.selected;
        const options = this.state.options;
        const chart_items = this.state.chart_items;

        return (
        <div className="selector-chart-container">
            <div className="selector-container">
                <MultiSelect id="selector"
                    options={options}
                    selected={selected}
                    onSelectedChanged={selected => this.setState({selected})}
                    overrideStrings={{
                        selectSomeItems: "Select signals..",
                        allItemsAreSelected: "All signals selected",
                        selectAll: "Select all",
                        }}
                    disableSearch={true}
                    isLoading={false}
                />
            </div>
            <div className="charts-container">
                {Object.values(chart_items)}
            </div>
        </div>
        )
    }
}

export default Selector;