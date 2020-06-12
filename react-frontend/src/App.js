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
        <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">[ GitHub ]</a>
      </div>
    </div>
      {/* <Upload /> */}
        <Selector system='MainEngine1'/>
    </div>
  </div>
  )
};

export default App;