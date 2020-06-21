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

const MAX_FILENAME_LENGTH = 19;
const activeStyle = {
  borderColor: "#00b3a1",
};

const re = /(?:\.([^.]+))?$/;

export const Upload = (props) => {
  const str_format = props.format.replace(",", "/");
  const MAX_SIZE = 31457280; // 30 MB
  const [uploaded, setUploaded] = useState(false);
  const [filename, setFilename] = useState(null);
  const [fileProperties, setFileProperties] = useState({});
  const [metadataReceived, setMetadataReceived] = useState(false);

  const resetAll = () => {
    props.resetProps(props.id);
    setUploaded(false);
    setFilename(null);
    setFileProperties({});
    setMetadataReceived(false);
  };

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    resetAll();
    if (acceptedFiles.length > 1) {
      alert(`You attempted to upload more than one '${str_format}' file.`);
    } else if (fileRejections.length > 0) {
      if (fileRejections.length > 1 || acceptedFiles.length > 0) {
        alert(`You attempted to upload more than one file.`);
      } else if (fileRejections[0].errors[0].code === "file-too-large") {
        alert(
          `You have attempted to upload a file that exceeds the maximum` +
            ` allowed file size of ${parseInt(MAX_SIZE * 0.00000095367432)} MB.`
        );
      } else {
        const rejectedExtension = re.exec(fileRejections[0].file.name)[0];
        alert(
          `You attempted to upload a file with format ` +
            `'${rejectedExtension}'. Make sure you upload a file with ` +
            `format '${str_format}' instead.`
        );
      }
    } else if (acceptedFiles.length === 1) {
      const data = new FormData();
      var name = acceptedFiles[0].name;
      const fileExtension = re.exec(name)[0];
      data.append("file", acceptedFiles[0]);
      data.append("filename", name);
      setUploaded(true);

      props.sendFilename(name, props.id); // send filename and type to parent

      if (props.id === "keras-model") {
        // if(props.id === 'keras-model' && !props.useSampleFiles){
        onModelUpload(data);
      }
      // if(props.id === 'scaler' && !props.useSampleFiles){
      if (props.id === "scaler") {
        onScalerUpload(data);
      }

      const nl = name.length;
      const fl = fileExtension.length;
      if (nl > MAX_FILENAME_LENGTH + fl) {
        name =
          name.substring(0, 15) +
          "..." +
          name.substring(nl - fl - 3, nl - fl) +
          fileExtension;
      }
      setFilename(name);
    }
  });

  const onModelUpload = (data) => {
    fetch(`keras_model/${false}`, {
      method: "POST",
      body: data,
    }).then((response) => {
      response.json().then((data) => {
        if (data.fileprops !== false) {
          const modelProperties = {
            inp: data.fileprops.inp,
            out: data.fileprops.out,
            timesteps: data.fileprops.timesteps,
          };
          setFileProperties(modelProperties);
          props.sendModelProperties(modelProperties);
        } else {
          setFileProperties(false);
          props.sendFilename(null, props.id);
          props.sendModelProperties({
            input: null,
            output: null,
            timesteps: null,
          });
        }

        setMetadataReceived(true);
      });
    });
  };

  const onScalerUpload = (data) => {
    fetch(`scaler/${false}`, {
      method: "POST",
      body: data,
    }).then((response) => {
      response.json().then((data) => {
        if (data.fileprops !== false) {
          setFileProperties({
            type: data.fileprops.type,
            features: data.fileprops.features,
            samples: data.fileprops.samples,
          });
        } else {
          setFileProperties(false);
          props.sendFilename(null, props.id);
        }

        setMetadataReceived(true);
      });
    });
  };

  useEffect(() => {
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
  }, [props.useSampleFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: props.format,
    onDrop,
    minSize: 0,
    maxSize: MAX_SIZE,
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
    }),
    [isDragActive]
  );

  const getFileSummary = (id) => {
    if (!fileProperties) {
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
