import React from "react";

export const About = () => {
  return (
    <div className="about-container">
      This application allows users to upload and test machine learning
      models, developed sequentially through{" "}
      <a
        className="about-link"
        href="https://www.tensorflow.org/"
        target="_blank"
        rel="noopener noreferrer"
      >
        TensorFlow
      </a>{" "}
      and{" "}
      <a
        className="about-link"
        href="https://keras.io/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Keras
      </a>
      , aimed at anomaly detection for predictive maintenance. After uploading
      the desired model (and corresponding scaler) for testing, the user can
      view data streams in real-time for available signals of a selected
      system transmitting data. For predicted signals, the user can set
      threshold values for anomaly detection, and successive values exceeding
      the given thresholds are presented visually as anomalies.
      <br />
      <br />
      Currently, NTNU's research vessel, R/V Gunnerus, is used as a data
      source for implementing anomaly detection models and subsequent testing
      in this application. At the time of launch, the application database
      only supports one system aboard the vessel, namely the Nogva main
      engines. Historical data is supplied from the server from an interval
      where a simulated fault was triggered, causing the exhaust temperatures
      to rise. Although the current implementation uses historical data, the
      application is easily modified to receive data from a server updating in
      real-time. In addition to this web application, a modeling API was
      developed, providing the framework for developing recurrent neural
      network (RNN) models.
      <br />
      <br />
      The application was made as part of a Master's assignment in marine
      technology at the Norwegian University of Science and Technology, NTNU.
      The application intends to serve as a tool used in the education of
      engineering students, and is especially related to the development and
      use of digital twins in maritime applications at the Department of
      Marine Technology.
      <br />
      <br />
      <img
        id="gunnerus-rendering"
        src="./img/gunnerus_rendering_green.png"
        alt="Gunnerus digital twin rendering"
      ></img>
      <div style={{ textAlign: "center", fontSize: "16px" }}>
        <em>Rendering of R/V Gunnerus and a virtual twin</em>
      </div>
    </div>
  );
};

export default About;
