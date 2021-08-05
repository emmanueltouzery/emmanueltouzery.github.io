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
  return React.createElement(
    "div",
    { style: { display: "flex", flexWrap: "wrap" } },
    [
      React.createElement(PickNumber, {
        text: "+",
        key: "pluseasy",
        onClick: () => numberPicked("pluseasy")
      }),
    ]
  );
}

function DisplayOperations({ computations, newGame }) {
  const [displayedNumbers, setDisplayedNumbers] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setDisplayedNumbers(n => (n === undefined || n+1 >= computations.length) ? undefined : n+1);
    }, 10000);
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

function getComputations(n) {
  const r = [];
  for (var i=0;i<5;i++) {
    r.push(Math.round(Math.random()*10000));
  }
  return r;
}

function Game() {
  const [computations, setComputations] = React.useState();

  return computations
    ? React.createElement(DisplayOperations, {
        computations,
        newGame: () => {
          setComputations();
          window.scrollTo(0, 0);
        }
      })
    : React.createElement(PickNumbers, {
        numberPicked: n => setComputations(getComputations(n))
      });
}

ReactDOM.render(React.createElement(Game), document.getElementById("body"));
