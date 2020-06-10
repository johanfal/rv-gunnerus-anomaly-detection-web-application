import React from 'react';
import './styles/main.scss';
import Chart from './components/Chart';
// import Test from './components/Test';
import Selector from './components/Selector'
function App() {
  return (
  <div>
    <h1>ANOMALY DETECTION</h1>
    <div id="ghlink">
      <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">[ GitHub ]</a>
    </div>
    <Selector />
    {/* <Chart sensor_id="1" /> */}
    {/* <Chart sensor_id="2" x-ticks="50" /> */}
    {/* <Chart sensor_id="3" />
    <Chart sensor_id="4" /> */}

    {/* <Chart sensor_id = "2" x-ticks="20" /> */}
    {/* <Test /> */}
  </div>
  )
};

export default App;