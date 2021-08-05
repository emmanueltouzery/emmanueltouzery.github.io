function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function PickNumber({ text, onClick }) {
  return React.createElement(
    "div",
    {
      className: "number-pick",
      style: {
        width: "200px",
        height: "200px",
        border: "solid 1px black",
        borderRadius: "5px",
        textAlign: "center",
        lineHeight: "200px",
        fontWeight: "bold",
        userSelect: "none",
        cursor: "pointer",
        fontSize: "150%"
      },
      onClick
    },
    text
  );
}

function PickNumbers({ numberPicked }) {
  const [digits, setDigits] = React.useState(4);
  const digitsSlider = React.createElement("div", {}, [
      React.createElement("span", { style: {fontSize: "70%"}}, ["števke"]),
    React.createElement("input", { style: {verticalAlign: "middle"}, type: "range",  min: "1", max: "17", value: digits, onInput: e => {
      setDigits(parseInt(e.target.value));
    }}),
      React.createElement("span", { style: {fontSize: "70%"}}, [digits + ""]),
  ]);

  const [time, setTime] = React.useState(10);
  const timeSlider = React.createElement("div", {}, [
      React.createElement("span", { style: {fontSize: "70%"}}, ["čas (sek)"]),
    React.createElement("input", { style: {verticalAlign: "middle"}, type: "range",  min: "1", max: "15", value: time, onInput: e => {
      setTime(parseInt(e.target.value));
    }}),
      React.createElement("span", { style: {fontSize: "70%"}}, [time + "s"]),
  ]);

  const actions = React.createElement(
    "div",
    { style: { display: "flex", flexWrap: "wrap" } },
    [
      React.createElement(PickNumber, {
        text: "+",
        key: "pluseasy",
        onClick: () => numberPicked("pluseasy", digits, time)
      }),
    ]
  );
  return React.createElement("div", {}, [digitsSlider, timeSlider, actions]);
}

function DisplayOperations({ computations, time, newGame }) {
  const [displayedNumbers, setDisplayedNumbers] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setDisplayedNumbers(n => (n === undefined || n+1 >= computations.length) ? undefined : n+1);
    }, time*1000);
    return () => {
      clearInterval(timer);
    }
  }, []);

  return React.createElement(...["span", null, displayedNumbers === undefined ? `= ${computations.reduce((a,b)=>a+b, 0)}` : `${computations[displayedNumbers]} +`]);
  // https://codepen.io/hari2609/pen/LmEzOm
  // return React.createElement("div", null, [
  //   React.createElement(["svg", null, ])
  //   React.createElement(...["span", null, displayedNumbers === undefined ? `= ${computations.reduce((a,b)=>a+b, 0)}` : `${computations[displayedNumbers]} +`])]);
}

function getComputations(n, digits) {
  const r = [];
  for (var i=0;i<5;i++) {
    r.push(Math.round(Math.random()*Math.pow(10, digits)));
  }
  return r;
}

function Game() {
  const [computations, setComputations] = React.useState();
  const [time, setTime] = React.useState();

  return computations
    ? React.createElement(DisplayOperations, {
        computations,
        time,
        newGame: () => {
          setComputations();
          window.scrollTo(0, 0);
        }
      })
    : React.createElement(PickNumbers, {numberPicked: (n, digits, t) => {
      setComputations(getComputations(n, digits));
      setTime(t);
      } 
    });
}

ReactDOM.render(React.createElement(Game), document.getElementById("body"));
