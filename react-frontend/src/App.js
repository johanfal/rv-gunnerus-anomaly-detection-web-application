import React from 'react';
import './styles/main.scss';
import Selector from './components/Selector'

function App() {
  return (
  <div>
    <h1>ANOMALY DETECTION</h1>
    <div id="ghlink">
      <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">[ GitHub ]</a>
    </div>
    {/* <Upload /> */}
      <Selector system='MainEngine1'/>
  </div>
  )
};

export default App;