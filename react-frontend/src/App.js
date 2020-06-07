import React, { useEffect } from 'react';
import './App.css';

function App() {
  useEffect(() => {
    fetch("/get_values").then(response =>
      response.json().then(data => {
        console.log(data);
        })
    );
  }, []);

    return <div className="App" />;
};

export default App;