import React from 'react'

export const Header = () => {
    return (
        <div className="header-container">
          <h1>ANOMALY DETECTION</h1>
          <div id="link-container">
            <h4 className="repotitle">
              GITHUB REPOSITORIES
            </h4>
            <span>
              <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">[ Web Application ]</a>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">[ Modeling API ]</a>
            </span>
          </div>
      </div>
    )
}

export default Header;