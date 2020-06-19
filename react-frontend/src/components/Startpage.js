import React from "react";
import "../styles/main.scss";
import Upload from "./Upload";
import ModelSpecifications from "./ModelSpecifications";
import ChartDashboard from "./ChartDashboard";

export class Startpage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedSystem: [],
      selectedInputs: [],
      selectedOutputs: [],
      useSampleFiles: false,
      settingsComplete: false,
      modelFilename: null,
      scalerFilename: null,
      modelProperties: {
        input: null,
        output: null,
        timesteps: null,
      },
    };
    this.showSelectionParameters = false;

    this.onModelComplete = this.onModelComplete.bind(this);
    this.onFileUploaded = this.onFileUploaded.bind(this);
    this.onInputsUpdate = this.onInputsUpdate.bind(this);
    this.onOutputsUpdate = this.onOutputsUpdate.bind(this);
    this.onSystemUpdate = this.onSystemUpdate.bind(this);
  }

  onModelComplete = (modelParameters) => {
    this.setState({
      selectedSystem: modelParameters["system"],
      selectedInputs: modelParameters["input"],
      selectedOutputs: modelParameters["output"],
      settingsComplete: true,
    });
  };

  onFileUploaded = (filename, id) => {
    if (id === "keras-model") {
      this.setState({ modelFilename: filename });
    }
    if (id === "scaler") {
      this.setState({ scalerFilename: filename });
    }
  };

  onModelProperties = (modelProps) => {
    this.setState({ modelProperties: modelProps });
  };

  setSampleBool = () => {
    if (!this.state.useSampleFiles) {
      this.setState({
        useSampleFiles: true,
        modelFilename: "sample_model.h5",
        scalerFilename: "sample_scaler.pckl",
      });
    }
  };

  checkFileUploades = () => {
    if (!!this.state.modelFilename && !!this.state.scalerFilename) {
      return true;
    }
  };

  resetUploadStates = (id) => {
    console.log(
      "Here to change useSampleFiles",
      id,
      id === "keras-model",
      id === "scaler"
    );
    if (id === "keras-model") {
      this.setState({
        selectedSystem: [],
        selectedInputs: [],
        selectedOutputs: [],
        useSampleFiles: false,
        modelFilename: null,
        modelProperties: {
          input: null,
          output: null,
          timesteps: null,
        },
      });
    }

    if (id === "scaler") {
      this.setState({
        selectedSystem: [],
        selectedInputs: [],
        selectedOutputs: [],
        useSampleFiles: false,
        scalerFilename: null,
      });
    }
  };

  onSystemUpdate = (selectedSystem) => {
    this.setState({ selectedSystem: selectedSystem });
  };

  onInputsUpdate = (selectedInputs) => {
    this.setState({ selectedInputs: selectedInputs });
  };

  onOutputsUpdate = (selectedOutputs) => {
    this.setState({ selectedOutputs: selectedOutputs });
  };

  render() {
    const showSelectionParameters = this.checkFileUploades();
    const settingsComplete = this.state.settingsComplete;
    const useSampleFiles = this.state.useSampleFiles;
    const modelProperties = this.state.modelProperties;
    const system = this.state.system;
    return (
      <div className="startpage">
        {!settingsComplete ? (
          [
            <div>
              <div id="upload-content">
                <Upload
                  id="keras-model"
                  name="Keras model"
                  format=".HDF5,.h5"
                  sendFilename={(filename, id) =>
                    this.onFileUploaded(filename, id)
                  }
                  useSampleFiles={useSampleFiles}
                  resetProps={(id) => this.resetUploadStates(id)}
                  sendModelProperties={(modelProps) =>
                    this.onModelProperties(modelProps)
                  }
                />
                <Upload
                  id="scaler"
                  name="scaler"
                  format=".pckl"
                  sendFilename={(filename, id) =>
                    this.onFileUploaded(filename, id)
                  }
                  useSampleFiles={useSampleFiles}
                  resetProps={(id) => this.resetUploadStates(id)}
                />
              </div>
              <div>
                <p style={{ textAlign: "center", color: "white" }}>
                  Or use&nbsp;
                  <a
                    className="sample-link"
                    onClick={() => this.setSampleBool()}
                  >
                    sample model and scaler
                  </a>
                </p>
              </div>
              {/* <div className="question-container">
                            <div className="tooltip-container">
                                <span className="tooltiptext">
                                    Keras models are saved in .h5-format, and contain necessary weights and biases to predict new values. It is important
                                    that the model is applied to the same parameters that was used during training. The predicted outcome will correspond
                                    with chosen output columns when training the model.
                                </span>
                            </div>
                                <a className="question-tooltip">?</a>
                        </div> */}
              <div className="model-specifications">{/* <Threshold /> */}</div>
              <div className="model-selectors-container">
                {showSelectionParameters ? (
                  <ModelSpecifications
                    inputSignals={modelProperties.inp}
                    outputSignals={modelProperties.out}
                    sendModelParameters={(modelParameters) =>
                      this.onModelComplete(modelParameters)
                    }
                    sendSystemUpdate={(selectedSystem) =>
                      this.onSystemUpdate(selectedSystem)
                    }
                    sendInputsUpdate={(selectedInputs) =>
                      this.onInputsUpdate(selectedInputs)
                    }
                    sendOutputsUpdate={(selectedOutputs) =>
                      this.onOutputsUpdate(selectedOutputs)
                    }
                    useSampleFiles={useSampleFiles}
                  />
                ) : null}
              </div>
            </div>,
          ]
        ) : (
          <ChartDashboard system={system} />
        )}
      </div>
    );
  }
}

export default Startpage;
