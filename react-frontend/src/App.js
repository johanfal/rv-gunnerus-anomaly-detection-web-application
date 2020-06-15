import React from 'react';
import './styles/main.scss';
import Selector from './components/Selector'

function App() {
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
        <a href="https://www.github.com" target="_blank" rel="noopener noreferrer">[ Web Application ]</a>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <a href="https://www.github.com" target="_blank" rel="noopener noreferrer">[ Modeling API ]</a>
      </span>
      </div>
    </div>
      {/* <Upload /> */}
        <Selector system='MainEngine1'/>
    </div>
  </div>
  )
};

export default App;