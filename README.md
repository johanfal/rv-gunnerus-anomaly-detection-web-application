# R/V Gunnerus anomaly detection web application
Web application for visually testing anomaly detection models on simulated real-time data from NTNU's R/V Gunnerus. The application is developed with a Flask backend and React frontend, with a PostgreSQL database hosted on Heroku.

Below are a set of animations demonstrating the functionality of the web application.

## Start page
<div style="text-align: justify">
The user is first met with a start page, where a trained sequential model developed using TensorFlow and Keras can be uploaded. In addition, the necessary data scaler used in the model development must be uploaded. This can be done by drag and drop or through browsing files.
</div>
<br>

<div align="center" style="text-align:center;font-size:80%">
    <img alt="start page" border="0"
    src="https://i.ibb.co/LZVh0XD/startpage.png"/>
    <div>
        <em>Start page.</em>
    </div>
    <br>
    <br>
</div>

<div style="text-align: justify">
Below, the user uploads an example model and scaler before selecting a desired component from a list of R/V Gunnerus components available. Since only data from the Nogva main engines have been uploaded to the PostgreSQL database, the rest of the components are greyed out.
</div>
<br>

<div align="center" style="text-align:center;font-size:80%">
    <img alt="start page"
    src="https://media.giphy.com/media/Vefe5cRw8Yqhy4fK8B/source.gif"/>
    <div>
        <em>Start page &mdash; file uploading and parameter selection.</em>
    </div>
    <br>
    <br>
</div>


<div style="text-align: justify">
Successively, the user selects which inputs and outputs were used during the training of the model. The application tells the user how many inputs and outputs the model expects based on the uploaded model properties, and the selected inputs and outputs must coincide with these properties.
</div>

<br>
<div style="text-align: justify">
After selecting component, inputs, and outputs a continue button becomes visible.
</div>
<br>

## Visualization dashboard
<div style="text-align: justify">
After successfully uploading files and choosing model parameters, the user is redirected to a dashboard used to visualize detected anomalies. As seen below, a list of available signals in the chosen model component can be selected for visualization. Only signals used by the Keras model are available for visualization.
</div>
<br>
<div style="text-align: justify">
All of the signal values can ba plotted in real-time at a frequency of 1&nbsp;Hz. In addition, signal output values predicted by the model are available for relevant signals, which in the example below is exemplified by the first main engine's two exhaust temperature sensors. Detected anomalies are also visualized based on a deviance in actual and predicted value exceeding a user-defined threshold value.
</div>
<br>

<div align="center" style="text-align:center;font-size:80%">
    <img alt="visual start" border = "0"
    src="https://s7.gifyu.com/images/plotting_functionality.gif"/>
    <div>
        <em>Dashboard visualization &mdash; readings, predictions, and detected anomalies.</em>
    </div>
    <br>
    <br>
</div>



<div style="text-align: justify">
As seen above, the user can deselect parts of the plot, as well as update the threshold value in real-time. A status bar with the signal name, latest reading, and connection status is placed at the top of the plotting window.
</div>
<br>

## Using example files

<div style="text-align: justify">
Instead of uploading a Keras model and corresponding scaler, the user can utilize an example model and scaler to test the functionality of the web page.
</div>
<br>

<div align="center" style="text-align:center;font-size:80%">
    <img alt="example files"
    src="https://s7.gifyu.com/images/using_sample_files.gif"/>
    <div>
        <em>Start page &mdash; using example model and scaler.</em>
    </div>
    <br>
    <br>
</div>

<div style="text-align: justify">
As seen above, the example file parameters are filled automatically, and the user can continue to the visualization dashboard as seen previously.
</div>
<br>

## Error handling for uploads

<div style="text-align: justify">
Multiple error handling features have been included to prevent undesired behavior. This includes checking file type, file size, number of files uploaded and the specific Keras model and scaler parameters for corruption. Some error handling is shown below.
</div>
<br>

<div align="center" style="text-align:center;font-size:80%">
    <img alt="erroneous uploads"
    src="https://s7.gifyu.com/images/error_uploads.gif">
    <div>
        <em>Start page &mdash; handling erroneous uploads.</em>
    </div>
    <br>
    <br>
</div>

## About

<div style="text-align: justify">
An about page was made to provide a brief description of the web page, its intention, and where the source code resources for both the web page and modeling API can be found.
</div>
<br>

<div align="center" style="text-align:center;font-size:80%">
    <img alt="about page"
    src="https://i.ibb.co/qF6w9L0/about.png">
    <div>
        <em>About page &mdash; with links to GitHub repositories.</em>
    </div>
    <br>
    <br>
</div>
