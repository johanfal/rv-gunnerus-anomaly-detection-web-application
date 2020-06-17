import React from 'react';
import './styles/main.scss';
import ChartDashboard from './components/ChartDashboard';
import Upload from './components/Upload';
import Header from './components/Header';
import Startpage from './components/Startpage';

function App() {
  return (
  <div className="content">
    <div id="maincontent">
      {/* <Header /> */}
      <Startpage />
      {/* <ChartDashboard system='MainEngine1'/> */}
    </div>
  </div>
  )
};

export default App;