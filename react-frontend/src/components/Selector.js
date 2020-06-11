import React from 'react';
import MultiSelect from "@khanacademy/react-multi-select";
import Chart from '../components/Chart';


// updateChartStatus = (status) => {
//     this.setState({status: status})
// }

export class Selector extends React.Component {
    constructor(props){
        super(props);
        this.state = {
        selected: [], // Change to empty
        options: [],
        signal_connected: {}, // Make this dynamic, just as the previous state below
        chart_items: {}
        }

        this.state.prev_selected = this.state.selected;
        for(let i = 0; i < this.state.selected.length; i++){
            this.state.signal_connected[this.state.selected[i]] = true
            this.state.chart_items[this.state.selected[i]] = <Chart sensor_id={this.state.selected[i]} status = {this.state.signal_connected[this.state.selected[i]]}>{this.state.signal_connected[this.state.selected[i]]}</Chart>
        }
    }

    // updateChild(status){
    //     updateChartStatus(status)
    // }

    componentDidMount() {
        fetch('signals').then(response => response.json().then(data => {
            this.signals = data.signals;
            this.options = []
            // Filter out 'id' and 'time' as possible signals
            this.signals = this.signals.filter(e => e !== 'id' && e !== 'time')

            // Loop through signals
            for(let i = 0; i < this.signals.length; i++){

                // Add signal as selector option with label and value
                this.options.push(
                                {
                                    label: this.signals[i],
                                    value: i+1
                            }
                        )
            }

            // Update state with fetched signal options
            this.setState({options: this.options})
        }));

    }

    componentDidUpdate(){
        const previous = this.state.prev_selected
        const selected = this.state.selected
        const added = selected.filter(sig => !previous.includes(sig));
        const deleted = previous.filter(sig => !selected.includes(sig));

        // If a signal is selected
        if(added.length > 0){
            for(let i = 0; i < added.length; i++){
                    console.log('added ' + added[i])
                    this.state.signal_connected[added[i]] = true
                    this.state.chart_items[added[i]] = <Chart sensor_id={added[i]} status={this.state.signal_connected[added[i]]}>{this.state.signal_connected[added[i]]}</Chart>

                }
            this.setState({prev_selected: this.state.selected})
        }

        // If a signal is deselected
        if(deleted.length > 0){
            for(let i = 0; i < deleted.length; i++){
                // Need to find a way to delete signals
                this.state.signal_connected[deleted[i]] = false;
                this.state.chart_items[deleted[i]] = <Chart sensor_id={deleted[i]} status={this.state.signal_connected[deleted[i]]}>{this.state.signal_connected[deleted[i]]}</Chart>

                console.log('deleted ' + deleted[i])
            }
            this.setState({prev_selected: this.state.selected})
        }

        // Set previous states to the currently selected signals
    }

    // Look into 'getDerivedStateFromProps'
    // and using 'constructor(props)' in Charts
    // Spør HT?

    render() {

        const selected = this.state.selected;
        const options = this.state.options;
        const chart_items = this.state.chart_items;
        console.log(chart_items)
        // const {options} = this.options;
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