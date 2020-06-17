import React from 'react'
import MultiSelect from "@khanacademy/react-multi-select";

export class ModelSpecifications extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            options: [],
            selected: ['Nogva Engines'],
            selectedInputs: [],
            selectedOutputs: [],
        }
        this.maxSelect = 1;
        this.type = 'system';
        this.onSelectedInput = this.onSelectedInput.bind(this);
        this.onSelectedOutput = this.onSelectedOutput.bind(this);
    }

    componentDidMount(){
        fetch('systems').then(response => response.json().then(data => {
            let options = []
            let optionsEnabled = []
            let optionsDisabled = []
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

    onSelectedInput = (selected) => {
        console.log('Input: ' + selected)
        this.setState({selectedInputs: selected})

    }
    onSelectedOutput = (selected) => {
        console.log('Output: ' + selected)
        this.setState({selectedOutputs: selected})
    }

    onContinue = () => {
        console.log('click')
        const modelParameters = {
            system: this.state.selected,
            selectedInputs: this.state.selectedInputs,
            selectedOutputs: this.state.selectedOutputs
        }
        this.props.sendModelParameters(modelParameters)
    }

    render() {
        const options = this.state.options;
        const selected = this.state.selected;
        const type = this.type;
        const maxSelect = this.maxSelect;
        const reachedSystemMax = selected.length === maxSelect;
        const reachedInputMax = this.state.selectedInputs.length === this.props.inputSignals;
        const reachedOutputMax = this.state.selectedOutputs.length === this.props.outputSignals;
        const allowContinue = reachedOutputMax && reachedInputMax;
        console.log(reachedInputMax, reachedOutputMax)
        const hasLoaded = options.length > 0
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
                            selectSomeItems: hasLoaded ? `Select ${type}` : 'Loading systems from database, please wait..',
                            allItemsAreSelected: `${maxSelect > 1 ? `All ${type}s selected`: selected}`,
                            }}
                        hasSelectAll={maxSelect > 1 ? true : false}
                        disableSearch={false}
                        isLoading={hasLoaded ? false : true}
                    />
                </div>
                <div className="io-selector-container">
                    {reachedSystemMax ? <ShapeSpecifications
                        system={selected}
                        type="input"
                        maxSelect={this.props.inputSignals}
                        sendUpdate={this.onSelectedInput}
                    /> : null}
                    {reachedSystemMax ? <ShapeSpecifications
                        system={selected}
                        type="output"
                        maxSelect={this.props.outputSignals}
                        sendUpdate={this.onSelectedOutput}
                    /> : null}
                    <div className="continue-with-IO">
                        {reachedSystemMax ?
                            <button
                            id="continue-with-IO"
                            ref={contBtn => {this.contBtn = contBtn;}}
                            disabled={!allowContinue}
                            onClick={this.onContinue}
                            type="submit"
                            >
                            <span id="cont-btn">Continue</span>
                        </button> : null
                        }
                    </div>
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
            selected: ['me1_exhausttemp2']
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
            this.props.sendUpdate(selected);
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
                    Select the {typeStr} signals used by your ML model ({selected.length} of {maxSelect} selected):
                </div>
                <MultiSelect className="model_selector" id={this.props.type}
                    options={options}
                    selected={selected}
                    onSelectedChanged={selected => this.onSelect(selected)}
                    overrideStrings={{
                        selectSomeItems: `Select ${typeStr} signals used by your ML model..`,
                        allItemsAreSelected: `${maxSelect > 1 ? `All ${type} signals selected`: selected}`,
                        }}
                    hasSelectAll={maxSelect > 1 ? true : false}
                    disableSearch={false}
                    isLoading={hasLoaded ? false : true}
                />
            </div>
        )
    }
}
