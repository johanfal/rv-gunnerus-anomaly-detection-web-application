import React, {useMemo} from 'react';
import {useDropzone} from 'react-dropzone';
import MultiSelect from "@khanacademy/react-multi-select";

const baseStyle = {
    display: 'inline-block',
    width:'250px',
    textAlign: 'center',
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
      } = useDropzone({accept: props.type});

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
        <div className="upload-container">
          <div {...getRootProps({style})} className="upload">
            <input {...getInputProps()} />
            <p>
                Drag and drop {props.name} here, or click to select from files.
                <br/><br/>
                (<em>File format must be {props.format}</em>)
            </p>
          </div>
        </div>
      );
}

export default Upload;