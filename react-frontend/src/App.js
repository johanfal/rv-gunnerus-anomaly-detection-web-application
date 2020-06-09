import React from 'react';
import './styles/main.scss';
import Chart from './components/Chart';
import Test from './components/Test';

function App() {
  return (
  <div>
    <h1>Anomaly Detection Dashboard</h1>
    {/* <Chart sensorId="1" /> */}
    <Test />
  </div>
  )
};

export default App;