import React from "react";
import MultiSelect from "@khanacademy/react-multi-select";

// Model specification class for system selection
export class ModelSpecifications extends React.Component {
  constructor(props) {
    super(props);
    if (props.useSampleFiles) {
      this.state = {
        options: [],
        selected: ["Nogva Engines"],
        selectedInputs: [],
        selectedOutputs: [],
      };
      this.props.sendSystemUpdate(this.state.selected);
    } else {
      this.state = {
        options: [],
        selected: [],
        selectedInputs: [],
        selectedOutputs: [],
      };
    }
    this.maxSelect = 1;
    this.onSelectedInput = this.onSelectedInput.bind(this);
    this.onSelectedOutput = this.onSelectedOutput.bind(this);
  }

  componentDidMount() {
    fetch("systems").then((response) =>
      response.json().then((data) => {
        let options = [];
        let optionsEnabled = [];
        let optionsDisabled = [];
        for (let [system, hasData] of Object.entries(data.systems)) {
          if (hasData) {
            optionsEnabled.push({
              label: hasData ? system : `${system} (has no data)`,
              value: system,
              disabled: false,
            });
          } else {
            optionsDisabled.push({
              label: `${system} (has no data)`,
              value: system,
              disabled: true,
            });
          }
          options = optionsEnabled.concat(optionsDisabled);
        }
        this.setState({ options: options });
      })
    );
  }

  onSelect = (selected) => {
    const maxSelect = this.maxSelect;
    if (selected.length > maxSelect) {
      alert(`You can only select ${maxSelect} system.`);
    } else {
      this.setState({ selected });
      this.props.sendSystemUpdate(selected);
    }
  };

  onSelectedInput = (selectedInputs) => {
    this.setState({ selectedInputs: selectedInputs });
    this.props.sendInputsUpdate(selectedInputs);
  };
  onSelectedOutput = (selectedOutputs) => {
    this.setState({ selectedOutputs: selectedOutputs });
    this.props.sendOutputsUpdate(selectedOutputs);
  };

  onContinue = () => {
    const modelParameters = {
      system: this.state.selected,
      selectedInputs: this.state.selectedInputs,
      selectedOutputs: this.state.selectedOutputs,
    };
    this.props.sendModelParameters(modelParameters);
  };

  render() {
    const options = this.state.options;
    const selected = this.state.selected;
    const system = this.props.system;
    const maxSelect = this.maxSelect;
    const reachedSystemMax = selected.length === maxSelect;
    const reachedInputMax =
      this.state.selectedInputs.length === this.props.inputSignals;
    const reachedOutputMax =
      this.state.selectedOutputs.length === this.props.outputSignals;
    const hasLoaded = options.length > 0;
    const allowContinue = reachedOutputMax && reachedInputMax && hasLoaded;
    const useSampleFiles = this.props.useSampleFiles;
    const inputSignals = this.props.inputSignals;
    const outputSignals = this.props.outputSignals;
    console.log(options);
    return (
      <div className="system-selector-container">
        <div className="mod-selector-container">
          <div className="mod-spec-text">
            {useSampleFiles
              ? "System on R/V Gunnerus used in sample model:"
              : "Select system on R/V Gunnerus from database:"}
          </div>
          <MultiSelect
            className="model_selector"
            options={options}
            selected={hasLoaded ? selected : []}
            onSelectedChanged={(selected) => this.onSelect(selected)}
            overrideStrings={{
              selectSomeItems: hasLoaded
                ? "Select system"
                : "Loading systems from database, please wait..",
              allItemsAreSelected: `${
                maxSelect > 1 ? "All systems selected" : selected
              }`,
            }}
            hasSelectAll={maxSelect > 1 ? true : false}
            disableSearch={false}
            isLoading={hasLoaded ? false : true}
          />
        </div>
        <div className="io-selector-container">
          {reachedSystemMax ? (
            <ShapeSpecifications
              system={selected}
              type="input"
              maxSelect={inputSignals}
              sendUpdate={(selected) => this.onSelectedInput(selected)}
              useSampleFiles={useSampleFiles}
            />
          ) : null}
          {reachedSystemMax ? (
            <ShapeSpecifications
              system={selected}
              type="output"
              maxSelect={outputSignals}
              sendUpdate={(selected) => this.onSelectedOutput(selected)}
              useSampleFiles={useSampleFiles}
            />
          ) : null}
          <div className="continue-with-IO">
            {reachedSystemMax ? (
              <button
                id="continue-with-IO"
                ref={(contBtn) => {
                  this.contBtn = contBtn;
                }}
                disabled={!allowContinue}
                onClick={() => this.onContinue()}
                type="submit"
              >
                <span id="cont-btn">Continue</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

// Model specification class for input and output signals selection
export default ModelSpecifications;

class ShapeSpecifications extends React.Component {
  constructor(props) {
    super(props);
    if (props.useSampleFiles) {
      if (props.type === "input") {
        this.state = {
          options: [],
          selected: [
            "me1_backupbatt",
            "me1_boostpress",
            "me1_enginespeed",
            "me1_exhausttemp1",
            "me1_exhausttemp2",
            "me1_fuelrate",
            "me1_hours",
            "me1_lopress",
            "me1_luboiltemp",
            "me1_power",
            "me1_startbatt",
            "me1_coolanttemp",
          ],
        };
      }
      if (props.type === "output") {
        this.state = {
          options: [],
          selected: ["me1_exhausttemp1", "me1_exhausttemp2"],
        };
      }
    } else {
      this.state = {
        options: [],
        selected: [],
      };
    }

    this.SIGNAL_MAX = 20; // set to prevent exceeding server capabilities
  }

  componentDidMount() {
    fetch(`signals/${this.props.system}`).then((response) =>
      response.json().then((data) => {
        const options = [];
        for (let system of data.signals) {
          if (system !== "id" && system !== "time") {
            options.push({
              label: system,
              value: system,
            });
          }
        }
        this.setState({
          options: options,
        });
        if (this.props.useSampleFiles) {
          this.props.sendUpdate(this.state.selected);
        }
      })
    );
  }

  onSelect = (selected) => {
    const maxSelect = this.props.maxSelect;
    const type = this.props.type;
    const signalMax = this.SIGNAL_MAX;
    if (this.props.useSampleFiles) {
      alert(`The ${type} signals area already set for the sample model.`);
    } else {
      if (selected.length > maxSelect) {
        alert(
          `Maximum specified ${type} signals in your model is ${maxSelect}!`
        );
      } else if (selected.length > signalMax) {
        alert(
          `The maximum number of signals is set to ${signalMax} to ` +
            `preserve server capabilities.`
        );
      } else {
        this.setState({ selected });
        this.props.sendUpdate(selected);
      }
    }
  };

  render() {
    const options = this.state.options;
    const selected = this.state.selected;
    const type = this.props.type;
    const maxSelect = this.props.maxSelect;
    const typeStr = type === "input" ? type : "predicted output";
    const typeStrTitle = typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
    const hasLoaded = options.length > 0;
    const system = this.props.system;
    const useSampleFiles = this.props.useSampleFiles;
    return (
      <div className="mod-selector-container">
        <div className="mod-spec-text">
          {useSampleFiles
            ? `${typeStrTitle} signals used in sample model ` +
              `(${selected.length} in total):`
            : `Select the ${typeStr} signals used by your ML ` +
              `model (${selected.length} of ${maxSelect} selected):`}
        </div>
        <MultiSelect
          className="model_selector"
          id={type}
          options={options}
          selected={hasLoaded ? selected : []}
          onSelectedChanged={(selected) => this.onSelect(selected)}
          overrideStrings={{
            selectSomeItems: hasLoaded
              ? `Select ${typeStr} signals used by your ML model`
              : `Loading ${type} signals from ${system}, please wait..`,
            allItemsAreSelected: `${
              maxSelect > 1 ? `All ${type} signals selected` : selected
            }`,
          }}
          hasSelectAll={maxSelect > 1 && !useSampleFiles ? true : false}
          disableSearch={false}
          isLoading={hasLoaded ? false : true}
        />
      </div>
    );
  }
}
