import React from 'react';
import './styles/main.scss';
import Chart from './components/Chart';

function App() {
  return (
  <div>
    <h1>Anomaly Detection Dashboard</h1>
    <Chart sensorId="1" />
  </div>
  )
};

export default App;