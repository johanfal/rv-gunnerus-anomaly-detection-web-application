import React from "react";

export const Header = () => {
  const onHomeClick = () => {
    window.location.reload(true);
  };
  return (
    <div className="header-container">
      <div className="homebtn-container">
        <button className="homebtn" onClick={onHomeClick}>
          <i className="home-icon" class="fa fa-home" />
        </button>
      </div>
      <h1>ANOMALY DETECTION</h1>
      <div id="link-container">
        <h4 className="repotitle">GITHUB REPOSITORIES</h4>
        <span>
          <a
            href="https://www.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            [ Web Application ]
          </a>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <a
            href="https://www.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            [ Modeling API ]
          </a>
        </span>
      </div>
    </div>
  );
};

export default Header;
