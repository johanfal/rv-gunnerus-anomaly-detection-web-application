import React, { useMemo, useCallback, useState } from 'react';
import {useDropzone} from 'react-dropzone';

const baseStyle = {
    position: 'relative',
    display: 'inline-block',
    width:'250px',
    textAlign: 'center',
    verticalAlign: 'middle',
    padding: '10px 30px 10px 30px',
    // margin:'20px 68px 20px 68px',
    // overflow: 'auto',
    margin: '20px',
    borderWidth: 2,
    borderRadius: 4,
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    outline: 'none',
    transition: 'border .24s ease-in-out',
  };

  const activeStyle = {
    borderColor: '#00b3a1',
  };

  const re = /(?:\.([^.]+))?$/;

export const Upload = (props) => {
  const str_format = props.format.replace(',','/')
  const MAX_SIZE = 31457280 // 30 MB
  const [uploaded, setUploaded] = useState(false);
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState(null);
  const [fileProperties, setFileProperties] = useState({});
  const [metadataReceived, setMetadataReceived] = useState(false);


  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setUploaded(null);
    setFile(null);
    setFilename(null);

    if(acceptedFiles.length > 1){
      alert(`You attempted to upload more than one '${str_format}' file.`)
    }
    else if(fileRejections.length > 0){
      if(fileRejections.length > 1 || acceptedFiles.length > 0){
        alert(`You attempted to upload more than one file.`)
      }
      else if(fileRejections[0].errors[0].code === 'file-too-large'){
        alert(`You have attempted to upload a file that exceeds the maximum` +
        ` allowed file size of ${parseInt(MAX_SIZE*0.00000095367432)} MB.`)
      }
      else{
        const rejectedExtension = re.exec(fileRejections[0].file.name)[0]
        alert(`You attempted to upload a file with format ` +
        `'${rejectedExtension}'. Make sure you upload a file with ` +
        `format '${str_format}' instead.`)
      }
    }
    else if(acceptedFiles.length === 1){
      const data = new FormData();
      var name = acceptedFiles[0].name;
      const fileExtension = re.exec(name)[0]
      data.append('file', acceptedFiles[0]);
      data.append('filename', name);

      setUploaded(true);
      setFile(acceptedFiles[0])

      if(props.id === 'keras-model'){
        onModelUpload(data);
      }
      if(props.id === 'scaler'){
        onScalerUpload(data);
      }

      const nl = name.length;
      const fl = fileExtension.length;
      if(nl > 30 + fl){
          name = name.substring(0,15) + '...' +
                  name.substring(nl-fl-2, nl-fl) + fileExtension
        }
        setFilename(name);
      }
      console.log(acceptedFiles)
      console.log(fileRejections)

    })


    const onModelUpload = (data) => {
        fetch(
          'keras_model', {
          method: 'POST',
          body: data
        }).then((response) => {
          response.json().then((data) => {
            setFileProperties({
              inp: data.fileprops.inp,
              out: data.fileprops.out,
              timesteps: data.fileprops.timesteps
          });

          setMetadataReceived(true);

          })
        })
    }

    const onScalerUpload = (data) => {
      console.log('Will handle this scaler bad boy!')
      fetch(
        'scaler', {
        method: 'POST',
        body: data
      }).then((response) => {
        response.json().then((data) => {
          setFileProperties({
            type: data.fileprops.type,
            features: data.fileprops.features,
            samples: data.fileprops.samples
        });

        setMetadataReceived(true);

        })
      })
    }

    const {
        getRootProps,
        getInputProps,
        isDragActive
      } = useDropzone({
                        accept: props.format,
                        onDrop,
                        minSize: 0,
                        maxSize: MAX_SIZE
                      });

      const style = useMemo(() => ({
        ...baseStyle,
        ...(isDragActive ? activeStyle : {}),
      }), [
        isDragActive
      ]);


      const getFileSummary = (id) => {
        if(id === 'keras-model'){
          return !metadataReceived ? <em>
            Reading model parameters..
            </em> : <div id="model-upload-properties">
            <em>Specifications found in uploaded model:</em><br/>
              Number of input columns: {fileProperties.inp} <br/>
              Number of predicted output columns: {fileProperties.out} <br/>
              Timesteps used per prediction: {fileProperties.timesteps} <br/>
            </div>
        }
        if(id === 'scaler'){
          return !metadataReceived ? <em>
            Reading scaler parameters..
            </em> : <div id="model-upload-properties">
            <em>Specifications found in uploaded scaler:</em><br/>
              Scaler type: {fileProperties.type} <br/>
              Number of columns scaled: {fileProperties.features} <br/>
              Samples during creation: {fileProperties.samples} <br/>
            </div>
        }
      }

      return (
        <div className="upload-container">
          <div {...getRootProps({style})} className="upload">
            <input {...getInputProps()} />
              {
              !uploaded ?
                [<p>
                  Drag and drop {props.name} here, or click to select from files.
                  <br/><br/>
                  (<em>File format must be {str_format}</em>)
                </p>] :
                [<p>
                  '{filename}' succesfully uploaded.
                  <br/><br/>
                    {getFileSummary(props.id)}
                </p>
                ]
              }
          </div>
        </div>
      );
}

export default Upload;