import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

const baseStyle = {
  position: "relative",
  display: "inline-block",
  width: "275px",
  textAlign: "center",
  verticalAlign: "middle",
  padding: "10px 30px 10px 30px",
  margin: "20px",
  borderWidth: 2,
  borderRadius: 4,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  outline: "none",
  transition: "border .24s ease-in-out",
};

const MAX_FILENAME_LENGTH = 19; // affects display, not upload restrictions
const activeStyle = {
  borderColor: "#00b3a1",
};

const re = /(?:\.([^.]+))?$/; // used to extract file formats

export const Upload = (props) => {
  /*
    The functional component handles uploading of model and scaler files.
    Based on the id property provided by the Startpage parent, the component
    is tailored towards the specific id.
  */
  const str_format = props.format.replace(",", "/"); // suitable for display
  const MAX_SIZE = 31457280; // 30 MB
  // Define hooks:
  const [uploaded, setUploaded] = useState(false);
  const [filename, setFilename] = useState(null);
  const [fileProperties, setFileProperties] = useState({});
  const [metadataReceived, setMetadataReceived] = useState(false);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    /*
    Function based on the useDropzone component to handle file uploads, either
    through drag and drop or through browsing locally stored files. A number
    of error handling conditions are included to prevent the user from
    uploading erroneous files. acceptedFiles and rejectedFiles are provided
    by the useDropzone component, and are determined based on the file format
    of the chosen file to be uploaded.
  */
    resetAll(); // reset parameters
    if (acceptedFiles.length > 1) {
      // error: more than one accepted file
      alert(`You attempted to upload more than one '${str_format}' file.`);
    } else if (rejectedFiles.length > 0) {
      // error: more than one rejected
      if (rejectedFiles.length > 1 || acceptedFiles.length > 0) {
        // error: number of files
        alert(`You attempted to upload more than one file.`);
      } else if (rejectedFiles[0].errors[0].code === "file-too-large") {
        // error: file size
        alert(
          `You have attempted to upload a file that exceeds the maximum` +
            ` allowed file size of ${parseInt(
              MAX_SIZE * 0.00000095367432
            )} MB.`
        );
      } else {
        // error: uploaded format not coinciding with specified format
        const rejectedExtension = re.exec(rejectedFiles[0].file.name)[0];
        alert(
          `You attempted to upload a file with format ` +
            `'${rejectedExtension}'. Make sure you upload a file with ` +
            `format '${str_format}' instead.`
        );
      }
    } else if (acceptedFiles.length === 1) {
      // correct upload
      // Create and store file and filename in a FormData object:
      const data = new FormData();
      var name = acceptedFiles[0].name;
      const fileExtension = re.exec(name)[0];
      data.append("file", acceptedFiles[0]);
      data.append("filename", name);
      setUploaded(true); // mark upload succesful

      props.sendFilename(name, props.id); // send filename and type to parent

      if (props.id === "keras-model") {
        onModelUpload(data);
      }
      if (props.id === "scaler") {
        onScalerUpload(data);
      }

      const nl = name.length; // name length
      const fl = fileExtension.length; // length of file extension
      // Handle display of filename if filename exceeds a given limit:
      if (nl > MAX_FILENAME_LENGTH + fl) {
        /*
          Instead of displaying the full filename, the first 15 characters are
          shown before '...', followed by the last 3 characters of the
          filename and the file extension.
        */
        name =
          name.substring(0, 15) +
          "..." +
          name.substring(nl - fl - 3, nl - fl) +
          fileExtension;
      }
      setFilename(name);
    }
  });

  const resetAll = () => {
    /*
    Reset parameters when onDrop is called (new file is uploaded).
  */
    props.resetProps(props.id);
    setUploaded(false);
    setFilename(null);
    setFileProperties({});
    setMetadataReceived(false);
  };

  const onModelUpload = (data) => {
    /*
    If uploaded file is a Keras model file, retrieve properties by sending the
    model to the backend server.
  */
    fetch(`keras_model/${false}`, {
      method: "POST",
      body: data, // sending file from client to server
    }).then((response) => {
      response.json().then((data) => {
        // If provided model is deemed valid by the server, the
        // client receives model properties:
        if (data.fileprops !== false) {
          const modelProperties = {
            inp: data.fileprops.inp,
            out: data.fileprops.out,
            timesteps: data.fileprops.timesteps,
          };
          setFileProperties(modelProperties);
          // Send model properties to Startpage parent component:
          props.sendModelProperties(modelProperties);
        } else {
          // Not succesfully received properties:
          setFileProperties(false);
          props.sendFilename(null, props.id);
          props.sendModelProperties({
            input: null,
            output: null,
            timesteps: null,
          });
        }

        // Metadata received (used for both valid and invalid properties):
        setMetadataReceived(true);
      });
    });
  };

  const onScalerUpload = (data) => {
    /*
      If uploaded file is a pickle file, it is assumed that a scaler has been
      uploaded, which is sent to the server for unpickling and reading scaler
      properties. The client receives these properties if the scaler is valid.
    */
    fetch(`scaler/${false}`, {
      method: "POST",
      body: data, // sending file from client to server
    }).then((response) => {
      response.json().then((data) => {
        if (data.fileprops !== false) {
          // If provided scaler is deemed valid by the server, the
          // client receives scaler properties:
          setFileProperties({
            type: data.fileprops.type,
            features: data.fileprops.features,
            samples: data.fileprops.samples,
          });
        } else {
          setFileProperties(false);
          // Send model properties to Startpage parent component:
          props.sendFilename(null, props.id);
        }

        // Metadata received (used for both valid and invalid properties):
        setMetadataReceived(true);
      });
    });
  };

  // On component update (effect hook)
  useEffect(() => {
    /*
      Handle use of sample files based on the useSampleFiles property from
      Startpage parent component. Since predetermined files will not cause a
      call to the onDrop() function, the effect hook is necessary to retrieve
      properties through an API call and display the sample file properties to
      the user.
    */
    if (props.useSampleFiles) {
      setUploaded(true);
      if (props.id === "keras-model") {
        setFilename("sample_model.h5");
        fetch(`keras_model/${true}`).then((response) => {
          response.json().then((data) => {
            const modelProperties = {
              inp: data.fileprops.inp,
              out: data.fileprops.out,
              timesteps: data.fileprops.timesteps,
            };
            setFileProperties(modelProperties);
            props.sendModelProperties(modelProperties);
            setMetadataReceived(true);
          });
        });
      }
      if (props.id === "scaler") {
        setFilename("sample_scaler.pckl");
        fetch(`scaler/${true}`).then((response) => {
          response.json().then((data) => {
            setFileProperties({
              type: data.fileprops.type,
              features: data.fileprops.features,
              samples: data.fileprops.samples,
            });
            setMetadataReceived(true);
          });
        });
      }
    }
  }, [props.useSampleFiles]); // only run if prop has been changed in parent

  // Call to useDropzone component:
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: props.format,
    onDrop,
    minSize: 0,
    maxSize: MAX_SIZE,
  });

  // useMemo for handling drag activities:
  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
    }),
    [isDragActive]
  );

  const getFileSummary = (id) => {
    /*
    Gets a summary of the uploaded  file based on id ('keras-model' or
    'scaler'). This is applied to the upload dropbox upon render.
  */
    if (!fileProperties) {
      // if file properties are false
      return (
        <div id="fileprops-error" style={{ color: "red" }}>
          <br />
          <em>Could not read {props.name} properties..</em>
        </div>
      );
    }

    if (id === "keras-model") {
      return !metadataReceived ? (
        <em>
          <br />
          Reading model parameters..
        </em>
      ) : (
        <div id="model-upload-properties">
          <em>Specifications found for uploaded model:</em>
          <br />
          Number of input columns: {fileProperties.inp} <br />
          Number of predicted output columns: {fileProperties.out} <br />
          Timesteps used per prediction: {fileProperties.timesteps} <br />
        </div>
      );
    }
    if (id === "scaler") {
      return !metadataReceived ? (
        <em>
          <br />
          Reading scaler parameters..
        </em>
      ) : (
        <div id="model-upload-properties">
          <em>Specifications found for uploaded scaler:</em>
          <br />
          Scaler type: {fileProperties.type} <br />
          Number of columns scaled: {fileProperties.features} <br />
          Samples experienced by scaler: {fileProperties.samples} <br />
        </div>
      );
    }
  };

  return (
    <div className="upload-container">
      <div className="question-container">
        <div className="tooltip-container">
          {props.id === "keras-model" ? (
            <span className="tooltiptext" id="model-tooltip">
              Keras models are saved in .h5-format, and contain necessary
              weights and biases to predict new values. It is important that
              the model is applied to the same parameters that was used during
              training. The predicted outcome will correspond with chosen
              output columns when training the model. Read more about Keras
              models{" "}
              <a
                className="tooltip-link"
                href="https://keras.io/api/"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </a>
              .
            </span>
          ) : (
            <span className="tooltiptext" id="scaler-tooltip">
              A scaler is used to normalize data, which is essential when
              different features have different ranges. The application
              supports scalers from sklearn's peprocessing API. Scalers have
              no internal method for saving. Therefore, Python's pickle module
              (.pckl) should be used to pickle the scaler instead. Read more
              about scalers and preprocessing{" "}
              <a
                className="tooltip-link"
                href={
                  "https://scikit-learn.org/stable/modules/classes." +
                  "html#module-sklearn.preprocessing"
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </a>
              .
            </span>
          )}
        </div>
        <a className="question-tooltip">?</a>
      </div>
      <div {...getRootProps({ style })} className="upload">
        <input {...getInputProps()} />
        {!uploaded
          ? [
              <div>
                <br />
                Drag and drop {props.name} here,
                <br />
                or click to select from files.
                <br />
                <br />
                <br />(<em>File format must be {str_format}</em>)
              </div>,
            ]
          : [
              <div>
                <br />
                {props.name.charAt(0).toUpperCase() + props.name.slice(1)}
                <div style={{ color: "rgb(71, 255, 71)" }}>
                  '{filename}' uploaded.
                </div>
                <br />
                <div>{getFileSummary(props.id)}</div>
              </div>,
            ]}
      </div>
    </div>
  );
};

export default Upload;
