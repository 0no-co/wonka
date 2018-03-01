let component = ReasonReact.statelessComponent("App");

let make = (~message, _children) => {
  ...component,
  render: _self => (
    <div className="App">
      <h1 className="App-title"> (ReasonReact.stringToElement(message)) </h1>
      <RangeSlider />
    </div>
  )
};
