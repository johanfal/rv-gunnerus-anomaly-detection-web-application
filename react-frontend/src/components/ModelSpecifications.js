import React from 'react'
import MultiSelect from "@khanacademy/react-multi-select";

export class ModelSpecifications extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            options: [],
            selected: [],
        }
        this.selectedInputs = []
        this.selectedOutputs = []
        this.maxSelect = 1
        this.type = 'system'
    }

    componentDidMount(){
        fetch('systems').then(response => response.json().then(data => {
            let options = []
            let optionsEnabled = []
            let optionsDisabled = []
            console.log(data.systems)
            console.log('here')
            for(let [system, hasData] of Object.entries(data.systems)){
                if(hasData){
                    optionsEnabled.push({
                        label: hasData ? system : `${system} (has no data)`,
                        value: system,
                        disabled: false,
                    })
                } else{
                    optionsDisabled.push({
                        label: `${system} (has no data)`,
                        value: system,
                        disabled: true,
                    })
                }
                options = optionsEnabled.concat(optionsDisabled);
            }
            this.setState({options: options})
        }))
    }

    onSelect = (selected) => {
        const maxSelect = this.maxSelect
        const type = this.type
        if(selected.length > maxSelect){
            alert(`You can only select ${maxSelect} ${type}.`)
        }
        else{
            this.setState({selected})
        }
    }

    onSelectedIO = (selected) => {

    }
    onSelectedOutput = (selected) => {

    }

    render() {
        const options = this.state.options;
        const selected = this.state.selected;
        const type = this.type;
        const maxSelect = this.maxSelect;
        const reachMaxed = selected.length === maxSelect;
        const hasLoaded = options.length > 0
        console.log(options, options.length < 1)
        return (
            <div className="system-selector-container">
                <div className="mod-selector-container">
                    <div className="mod-spec-text">
                        Select system on R/V Gunnerus from database:
                    </div>
                    <MultiSelect className="model_selector" id={this.props.type}
                        options={options}
                        selected={selected}
                        onSelectedChanged={selected => this.onSelect(selected)}
                        overrideStrings={{
                            selectSomeItems: hasLoaded ? `Select ${type}` : 'Loading, please wait..',
                            allItemsAreSelected: `${selected}`,
                            }}
                        hasSelectAll={maxSelect > 1 ? true : false}
                        disableSearch={false}
                        isLoading={hasLoaded ? false : true}
                    />
                </div>
                <div className="io-selector-container">
                    {reachMaxed ? <ShapeSpecifications
                        system={selected}
                        type="input"
                        maxSelect={this.props.inputSignals}
                        onSelectedInput={this.handleInput}
                    /> : null}
                    {reachMaxed ? <ShapeSpecifications
                        system={selected}
                        type="output"
                        maxSelect={this.props.outputSignals}
                        onSelectedOutput={this.handleOutput}
                    /> : null}
                </div>
            </div>
        )
    }
}

export default ModelSpecifications;

































class ShapeSpecifications extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            options: [],
            selected: []
        }
        this.SIGNAL_MAX = 20; // set to prevent exceeding server capabilities

    }

    componentDidMount(){
        fetch(`signals/${this.props.system}`).then(response => response.json().then(data => {
            let options = []
            for(let system of data.signals){
                if(system !== 'id' && system !== 'time'){
                    options.push({
                        label: system,
                        value: system,
                    })
                }
            }
            console.log(options)
            this.setState({options: options})
            }
        ))
    }

    onSelect = (selected) => {
        const maxSelect = this.props.maxSelect
        const type = this.props.type
        const signalMax = this.SIGNAL_MAX
        if(selected.length > maxSelect){
            alert(`Maximum specified ${type} signals in your model is ${maxSelect}!`)
        }
        else if(selected.length > signalMax){
            alert(`The maximum number of signals is set to ${signalMax} to preserve server capabilities.`)
        }
        else{
            this.setState({selected})
        }
    }


    render() {
        const type = this.props.type;
        const maxSelect = this.props.maxSelect;
        const options = this.state.options;
        const selected = this.state.selected;
        const typeStr = type === 'input' ? type : 'predicted output'
        const hasLoaded = options.length > 0;
        return (
            <div className="mod-selector-container">
                <div className="mod-spec-text">
                    Select the {typeStr} signals used in prediction model ({selected.length} of {maxSelect} selected):
                </div>
                <MultiSelect className="model_selector" id={this.props.type}
                    options={options}
                    selected={selected}
                    onSelectedChanged={selected => this.onSelect(selected)}
                    overrideStrings={{
                        selectSomeItems: `Select ${typeStr} signals used in prediction model..`,
                        allItemsAreSelected: `${selected}`,
                        }}
                    hasSelectAll={maxSelect > 1 ? true : false}
                    disableSearch={true}
                    isLoading={hasLoaded ? false : true}
                />
            </div>
        )
    }
}
