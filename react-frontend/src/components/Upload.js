import React, {useMemo} from 'react';
import {useDropzone} from 'react-dropzone';

const baseStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 20px 10px 20px',
    borderWidth: 2,
    borderRadius: 4,
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    outline: 'none',
    transition: 'border .24s ease-in-out',
  };
  
  const activeStyle = {
    borderColor: '#2196f3',
  };
  
  const acceptStyle = {
    borderColor: '#00e676',
  };
  
  const rejectStyle = {
    borderColor: '#ff1744',
  };

export const Upload = (props) => {
    const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragAccept,
        isDragReject
      } = useDropzone({accept: '.h5, .keras'});
    
      const style = useMemo(() => ({
        ...baseStyle,
        ...(isDragActive ? activeStyle : {}),
        ...(isDragAccept ? acceptStyle : {}),
        ...(isDragReject ? rejectStyle : {})
      }), [
        isDragActive,
        isDragReject,
        isDragAccept
      ]);
      return (
        <div className="upload">
          <div {...getRootProps({style})}>
            <input {...getInputProps()} />
            <p>
                Drag and drop Keras model here, or click to select from files
                <br/><br/>
                (<em>Keras model format is .h5</em>)
            </p>
          </div>
          <div>
            <br/>
            <br/>
            <br/>
            <p>Or&nbsp;
              <a className="sample-link" href="sample_model.h5">use sample model</a>
            </p>
          </div>
        </div>
      );
}

export default Upload;