import React, { setState } from 'react';
import MultiSelect from "@khanacademy/react-multi-select";
import { formatPrefix } from 'd3';

// var signals;


// var options = [];
// console.log(signals)
// for(let i = 0; i < signals.length; i++){
//     options.push(
//         {
//             'label': signals[i],
//             'value': i
//         }
//     )
// }
const options = [
  {label: "Exhaust temperature 1", value: 1},
  {label: "Exhaust temperature 2", value: 2},
  {label: "Engine speed", value: 3},
];

// fetch('signals').then(response => response.json().then(data => {

// })
// );

export class Selector extends React.Component {
    constructor(props){
        super(props);
        this.state = {
        selected: [],
        options: [],
        opt: []
        }
    }

    componentDidMount() {
        fetch('signals').then(response => response.json().then(data => {
            this.signals = data.signals
            this.opt = []
            for(let i = 0; i < this.signals.length; i++){
                if(this.signals[i] !== 'id' && this.signals[i] !== 'time'){
                this.opt.push(
                                {
                                    label: this.signals[i],
                                    value: i
                            }
                        )
                }
                    }
            this.setState({
                opt: this.opt
            })
            })
        );

    }

    componentDidUpdate(){
        console.log(this.state)
    }

    render() {
        const {selected} = this.state;
        const options = this.state.opt;
        // const {options} = this.options;
        return <MultiSelect id='selector'
            options={options}
            selected={selected}
            onSelectedChanged={selected => this.setState({selected})}
            overrideStrings={{
                selectSomeItems: "Select signals..",
                allItemsAreSelected: "All signals selected",
                selectAll: "Select all"
                }}
        />
    }
}

export default Selector;