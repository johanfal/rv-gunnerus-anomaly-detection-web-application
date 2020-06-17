import React from 'react'

class Threshold extends React.Component {
  constructor(props){
    super(props);
    this.state = {value: false};
  }

  handleChange = (event) => {
    this.setState({value: event.target.value});
  }

  handleSubmit = (event) => {
    event.preventDefault();
  }

  render = () => {
    return (
        <div className="threshold-form-container">
        <form action="">
          <label>
            Threshold value:
            <input type="number" autocomplete="off" value={this.state.value} onChange={this.state.handleChange} step="0.01" min="0" max="100000" />
            <input type="submit" value="OK" />
          </label>
        </form>
      </div>
    )
  }
}

export default Threshold;