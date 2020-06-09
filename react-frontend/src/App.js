import React from 'react';
import './styles/main.scss';
import Chart from './components/Chart';
import Test from './components/Test';

function App() {
  return (
  <div>
    <h1>Anomaly Detection Dashboard</h1>
    <Chart sensor_id="1" />
    <Chart sensor_id="2" x-ticks="50" />
    {/* <Chart sensor_id="3" />
    <Chart sensor_id="4" /> */}

    {/* <Chart sensor_id = "2" x-ticks="20" /> */}
    {/* <Test /> */}
  </div>
  )
};

export default App;