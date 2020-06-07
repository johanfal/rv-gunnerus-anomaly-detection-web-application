import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import './App.css';

const App = () => (
  <Router basename={process.env.PUBLIC_URL}>
    <div style={{ display: 'flex', flexDirection: 'column','alignItems': 'center','justifyContent': 'center' }}>
      <Route
        exact
        path="/"
        render={() => (
          <div>
            <title>Upload</title>
            <h2>Upload</h2>
            <p>
              Upload your Keras model:
            </p>
          </div>
        )}
      />
      {/* <Route path="/upload" component={CubeExample} />
      <Route path="/asteroids" component={GameExample} />
      <Route path="/world-map" component={MapExample} /> */}
    </div>
  </Router>
);

export default App;