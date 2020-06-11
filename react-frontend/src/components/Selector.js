import React from 'react';
import MultiSelect from "@khanacademy/react-multi-select";
import Chart from '../components/Chart';
import io from 'socket.io-client';


// updateChartStatus = (status) => {
//     this.setState({status: status})
// }

export class Selector extends React.Component {
    constructor(props){
        super(props);
        this.state = {
        selected: [], // signals
        options: [], // multi-select options
        chart_items: {}, // rendered charts
        io_status: false // socket status
        }
    }
    socket;
    system = this.props.system;
    getStatus = (obj) =>  Object.keys(obj).length > 0

    componentDidMount() {
        this.on_reload();
        this.signals();
    }

    // Restart API thread if the page is reloaded
    on_reload = () => {
        if(window.performance) {
            if(performance.navigation.type === 1) {
                fetch('reload')
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
            // Filter out 'id' and 'time' as possible signals
            this.signals = this.signals.filter(e => e !== 'id' && e !== 'time')

            // Loop through signals
            for(let i = 0; i < this.signals.length; i++){

                // Add signal as selector option with label and value
                this.options.push({
                                    label: this.signals[i],
                                    value: i+1
                                })
            }

            for(let sig of selected){
                chart_items[sig]= <Chart sensor_id={sig} key={sig} />
            }

            // Update mounted states
            this.setState({
                            options: this.options,
                            chart_items: chart_items,
                            io_status: this.getStatus(chart_items)
                        })
        }));
    }

    connect = () => {
        io.connect(`/?system=${this.system}`)
    }

    componentDidUpdate(_prevProps, prevState){

        console.log(prevState)
        console.log(this.state)
        const curr_selected = this.state.selected;
        const status = this.state.io_status;
        let chart_items = this.state.chart_items;
        const added = curr_selected.filter(sig => !prevState.selected.includes(sig));
        const deleted = prevState.selected.filter(sig => !curr_selected.includes(sig));

        if(status !== prevState.io_status){
            status ? this.socket = io.connect(`/?system=${this.system}`) : this.socket.disconnect();

            // status ? this.test1() : this.test2() // REMOVE
        }

        // If a signal is selected
        if(added.length > 0){
            for(let sig of added){
                    console.log('added ' + sig)
                    chart_items[sig] = <Chart sensor_id={sig} key={sig} />
                }

            this.setState({
                            prev_selected: curr_selected,
                            chart_items: chart_items,
                            io_status: this.getStatus(chart_items)
                        })
                    }

                    // If a signal is deselected
                    if(deleted.length > 0){
                        for(let sig of deleted){
                            delete chart_items[sig];
                            console.log('deleted ' + sig)
            }

            this.setState({
                            chart_items: chart_items,
                            io_status: this.getStatus(chart_items)
                        })
        }
    }

    render() {

        const selected = this.state.selected;
        const options = this.state.options;
        const chart_items = this.state.chart_items;

        return (
        <div>
            <div className="selector-container">
                <MultiSelect id='selector'
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