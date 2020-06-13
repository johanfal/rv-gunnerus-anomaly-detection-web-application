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
        sio_status: false // socket status
        }
    }
    socket;
    system = this.props.system;

    // If component is succesfully mounted
    componentDidMount() {

        this.on_reload(); // call reload function
        this.signals(); // get list of signals based on API call to database
    }

    getStatus = (obj) =>  Object.keys(obj).length > 0

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

    componentDidUpdate(_prev_props, prev_state){
        let update_state = false; // update with setState at end of lifecycle method
        const selected = this.state.selected;
        const sio_status = this.state.sio_status;
        let chart_items = this.state.chart_items;
        const added = selected.filter(sig => !prev_state.selected.includes(sig));
        const deleted = prev_state.selected.filter(sig => !selected.includes(sig));

        this.manage_io_connection(sio_status, prev_state.sio_status)

        // If a signal is selected
        if(added.length > 0){
            update_state = true;
            chart_items = this.add_new_charts(added, chart_items)
        }

        // If a signal is deselected
        if(deleted.length > 0){
            update_state = true;
            chart_items = this.delete_unselected_charts(deleted, chart_items)
        }

        // Update socketIO connection or disconnection
        if(sio_status){
            if(added.length > 0 || deleted.length > 0 || prev_state.modified){
                this.socket.disconnect()
                this.connect()
            }
        }

        // If socketIO is connected, get values
        if(sio_status){
            this.get_values(selected)
        }

        if(update_state){
            this.set_updated_state(chart_items)
        }
    }

    manage_io_connection = (current_status, previous_status) => {
        if(current_status !== previous_status){
            current_status ? this.connect() : this.socket.disconnect();
        }
    }

    add_new_charts = (newly_selected, selected_items) => {
        for(let sig of newly_selected){
            console.log('added ' + sig)
            selected_items[sig] = <Chart sensor_id={sig} key={sig} />;
        }
        return selected_items;
    }

    delete_unselected_charts = (newly_deselected, selected_items) => {
        for(let sig of newly_deselected){
            delete selected_items[sig];
            console.log('deleted ' + sig)
        }
        return selected_items;
    }

    set_chart_values = (values) => {
        let chart_items = this.state.chart_items;
        // Get values of selected signals
        // const values = this.get_values(selected)
        console.log('Now im here')
        // if(values !== false){
            // console.log('Adjustments here')
        // }
        return chart_items;
    }

    get_values = (selected) => {
        if(selected.length > 0){
            fetch(`/timestamp_values/${selected.join()}`)
            this.socket.on('values', (values) => {
                console.log(values);
            });
        }
    }

    set_updated_state = (selected_items) => {
        this.setState({
            chart_items: selected_items,
            sio_status: this.getStatus(selected_items),
            modified: true
        })
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