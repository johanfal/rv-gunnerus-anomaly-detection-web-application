import React from "react";
import "./styles/main.scss";
import Header from "./components/Header";
import Startpage from "./components/Startpage";

function App() {
  return (
    <div className="content">
      <div id="maincontent">
        <Header />
        <Startpage />
      </div>
    </div>
  );
}

export default App;
