import React from 'react';
import '../styles/main.scss';
import Upload from './Upload';
import Threshold from './Threshold';
import ModelSpecifications from './ModelSpecifications';

function Startpage() {
    return (
    <div className="startpage">
      <div id="upload-content">
        <Upload id="keras-model" name='Keras model' format='.h5'/>
        <Upload id="scaler" name='scaler' format='.pckl'/>
      </div>
      <p style={{textAlign: 'center', color: 'white'}}>Or use&nbsp;
          <a className="sample-link" href="sample_model.h5">sample model and scaler</a>
      </p>
      {/* <div className="question-container">
      <div className="tooltip-container">
          <span className="tooltiptext">
            Keras models are saved in .h5-format, and contain necessary weights and biases to predict new values. It is important
            that the model is applied to the same parameters that was used during training. The predicted outcome will correspond
            with chosen output columns when training the model.
          </span>
      </div>
        <a className="question-tooltip">
          ?
        </a>
      </div> */}
      <div className="model-specifications">
        <Threshold />
      </div>
      <div className="model-selectors-container">
        <ModelSpecifications input_signals="12" output_signals="2"/>
      </div>
    </div>
    )
  };

export default Startpage;