import React from "react";

export const Header = (props) => {
  const onHomeClick = () => {
    window.location.reload(true);
  };
  return (
    <div className="header-container">
      <div className="homebtn-container">
        <button className="homebtn" onClick={onHomeClick}>
          <i className="fa fa-home" />
        </button>
      </div>
      <h1>
        {props.about
          ? "ABOUT"
          : `ANOMALY DETECTION ${
              props.dashboard ? "DASHBOARD" : "START PAGE"
            }`}
      </h1>
      {props.about
        ? [
            <div id="link-container">
              <h4 className="repotitle">GITHUB REPOSITORIES</h4>
              <span>
                <a
                  href={
                    "https://github.com/johanfal/rv-gunnerus" +
                    "-anomaly-detection-web-application"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  [ Web Application ]
                </a>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <a
                  href={
                    "https://github.com/johanfal/rv-gunnerus" +
                    "-anomaly-detection-modeling-api"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  [ Modeling API ]
                </a>
              </span>
            </div>,
          ]
        : null}
    </div>
  );
};

export default Header;
