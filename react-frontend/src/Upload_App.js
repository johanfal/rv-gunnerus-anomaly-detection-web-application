import React from 'react';
import './styles/main.scss';
import Selector from './components/Selector'
import Upload from './components/Upload'


function Upload_App() {
    return (
    <div className="content">
      <div id="maincontent">
      <div className="header-container">

        <h1>ANOMALY DETECTION</h1>
        <div id="link-container">
        <h4 className="repotitle">
          GITHUB REPOSITORIES
        </h4>
        <span>
          <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">[ Web Application ]</a>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">[ Modeling API ]</a>
        </span>
        </div>
      </div>
        <div className="upload-container">
          <Upload />
        </div>
      </div>
    </div>
    )
  };

export default Upload_App;