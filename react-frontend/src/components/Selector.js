import React from 'react';
import MultiSelect from "@khanacademy/react-multi-select";
import Chart from '../components/Chart';

export class Selector extends React.Component {
    constructor(props){
        super(props);
        this.state = {
        selected: [4,5],
        options: [],
        elements: [],
        items: []
        }
    }

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
        console.log(this.state.selected)
        }

    render() {


        const elements = ['1'];

        const items = []

        for (const [index, value] of elements.entries()) {
            items.push(<Chart sensor_id={value} />)
        }



        const selected = this.state.selected;
        const options = this.state.options;
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
                        selectAll: "Select all"
                        }}
                />
            </div>
            <div className="charts-container">
                {items}
            </div>
        </div>
        )
    }
}

export default Selector;