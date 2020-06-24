import React from "react";
import "../styles/main.scss";

import About from "./About";
import ChartDashboard from "./ChartDashboard";
import Header from "./Header";
import ModelSpecifications from "./ModelSpecifications";
import Upload from "./Upload";

export class Startpage extends React.Component {
  /*
    The startpage component handles all of the interactions between different
    components, and makes sure that the correct components are displayed based
    on user specifications. There are three main display options supported by
    the startpage:
      - Selection page: intended for uploading model and scaler, and providing
        specifications related to inputs and outputs used by the model.
      - Chart dashboard: visualization of real-time values and anomaly
        detection based on the provided model file and scaler.
      - About page: short summary of the purpose of the web application.
  */
  constructor(props) {
    super(props);
    this.state = {
      selectedSystem: [],
      selectedInputs: [],
      selectedOutputs: [],
      useSampleFiles: false,
      settingsComplete: false, // determines display
      modelFilename: null,
      scalerFilename: null,
      modelProperties: {
        input: null,
        output: null,
        timesteps: null,
      },
      about: false, // determines display
    };

    // Bind functions used to receive data from child components:
    this.onModelComplete = this.onModelComplete.bind(this);
    this.onFileUploaded = this.onFileUploaded.bind(this);
    this.onInputsUpdate = this.onInputsUpdate.bind(this);
    this.onOutputsUpdate = this.onOutputsUpdate.bind(this);
    this.onSystemUpdate = this.onSystemUpdate.bind(this);
  }

  onModelComplete = (modelSelections) => {
    /*
    Executes when model parameters are received from the ModelSpecifications
    child component.
    */
    this.setState({
      selectedSystem: modelSelections["selectedSystem"],
      selectedInputs: modelSelections["selectedInputs"],
      selectedOutputs: modelSelections["selectedOutputs"],
      settingsComplete: true,
    });
  };

  onFileUploaded = (filename, id) => {
    /*
    Executes when a file has been succesfully uploaded.
    */
    if (id === "keras-model") {
      this.setState({ modelFilename: filename });
    }
    if (id === "scaler") {
      this.setState({ scalerFilename: filename });
    }
  };

  onModelProperties = (modelProps) => {
    /*
    Executes when model properties have been constructed in in the Upload
    child component.
    */
    this.setState({ modelProperties: modelProps });
  };

  setSampleBool = () => {
    /*
    Executes when the user clicks to use sample files. the function only sets
    new states if the useSampleFiles variable was previously false.
    */
    if (!this.state.useSampleFiles) {
      this.setState({
        useSampleFiles: true,
        modelFilename: "sample_model.h5",
        scalerFilename: "sample_scaler.pckl",
      });
    }
  };

  resetUploadStates = (id) => {
    /*
    If new upload is instantiated in the Upload child component, reset states
    affected in the Startpage parent.
    */
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
    /*
    Executes if a new system is selected.
    */
    this.setState({ selectedSystem: selectedSystem });
  };

  onInputsUpdate = (selectedInputs) => {
    /*
    Executes if new inputs are selected.
    */
    this.setState({ selectedInputs: selectedInputs });
  };

  onOutputsUpdate = (selectedOutputs) => {
    /*
    Executes if new outputs are selected.
    */
    this.setState({ selectedOutputs: selectedOutputs });
  };

  onAboutClick = () => {
    /*
    Executes on about click.
    */
    this.setState({ about: !this.state.about });
  };

  render() {
    const settingsComplete = this.state.settingsComplete;
    const useSampleFiles = this.state.useSampleFiles;
    const modelProperties = this.state.modelProperties;
    const selectedSystem = this.state.selectedSystem[0];
    const selectedInputs = this.state.selectedInputs;
    const selectedOutputs = this.state.selectedOutputs;
    const modelFilename = this.state.modelFilename;
    const modelTimesteps = this.state.modelProperties.timesteps;
    const scalerFilename = this.state.scalerFilename;
    const about = this.state.about;
    const showSelectionParameters = !!modelFilename && !!scalerFilename;
    return (
      <div className="startpage">
        <div className="about-button-container">
          <button id="about-btn" onClick={this.onAboutClick}>
            {!about ? "About" : "Back"}
          </button>
        </div>
        <Header dashboard={settingsComplete} about={about} />
        {about ? (
          <About />
        ) : !settingsComplete ? (
          [
            <div>
              <div id="upload-content">
                <Upload
                  id="keras-model"
                  key="keras-model-upload"
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
                  key="scaler-upload"
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
              <div className="model-selectors-container">
                {showSelectionParameters ? (
                  <ModelSpecifications
                    inputSignals={modelProperties.inp}
                    outputSignals={modelProperties.out}
                    sendModelSelections={(modelSelections) =>
                      this.onModelComplete(modelSelections)
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
          <ChartDashboard
            system={selectedSystem}
            inputs={selectedInputs}
            outputs={selectedOutputs}
            sampleFiles={useSampleFiles}
            modelFilename={modelFilename}
            modelTimesteps={modelTimesteps}
            scalerFilename={scalerFilename}
          />
        )}
      </div>
    );
  }
}

export default Startpage;
