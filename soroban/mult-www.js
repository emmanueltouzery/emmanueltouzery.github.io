const ASK_COUNT = 16; // number of combinations when you pick only one number
const TIMEOUT_MULT_MS = 6500;
const TIMEOUT_DIV_MS = 7000;
const TIMEOUT_CONTINUE_BUTTON_ENABLE_MS = 1500;

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

function PastComputations({ trail }) {
  return React.createElement(
    "div",
    null,
    trail.map((e, idx) =>
      React.createElement(
        "div",
        {
          key: idx,
          className: e.question ? "question" : e.answer ? "answer" : "comment"
        },
        e.question || e.comment || e.answer
      )
    )
  );
}

function AskQuestion({ addEntered, timeoutMs, qNum, setCurrentEntryContents }) {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current.scrollIntoView();
  });

  const animInfo =
    timeoutMs !== undefined
      ? {
          animationDuration: `${timeoutMs / 2000}s`,
          animationName: "entryAnim",
          animationTimingFunction: "linear",
          animationDelay: `${timeoutMs / 2000}s`
        }
      : {};
  return React.createElement(
    "div",
    {
      style: { display: "flex" }
    },
    React.createElement(
      "input",
      {
        type: "text",
        height: "0px",
        ref: ref,
        maxLength: "4",
        onKeyDown: e => {
          if (e.key === "Enter" && ref.current.value.length > 0) {
            addEntered(ref.current.value);
            ref.current.value = "";
          }
        },
        onChange: e => {
          setCurrentEntryContents(e.target.value);
        },
        autoFocus: "autoFocus"
      },
      null
    ),
    React.createElement(
      "div",
      {
        // tie the progress bar to the question number, so it resets
        // when we move to the next question
        key: qNum,
        style: {
          height: "50px",
          width: "40px",
          margin: "0px",
          borderRadius: "3px",
          ...animInfo
        }
      },
      null
    )
  );
}


function GameSummary({
  askedCount,
  successCount,
  errorCount,
  tooSlowCount,
  newGame
}) {
  const ref = React.useRef();
  const [isPlayAgainEnabled, setPlayAgainEnabled] = React.useState(false);
  React.useEffect(() => {
    ref.current.scrollIntoView();
    const timer = setTimeout(() => {
      setPlayAgainEnabled(true);
      ref.current.focus();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  const playAgainExtra = isPlayAgainEnabled ? {} : { disabled: "disabled" };
  return React.createElement(
    "div",
    null,
    React.createElement(
      "h3",
      null,
      `Vprašano: ${askedCount}, pravilno: ${successCount}, napačno: ${errorCount}, prepočasno: ${tooSlowCount}`
    ),
    React.createElement(
      "button",
      { ref, ...playAgainExtra, onClick: newGame },
      "Igraj ponovno"
    )
  );
}

function ContinueButton({ isDisabledContinueButton, onClick }) {
  const buttonRef = React.useRef();
  const continueExtra = isDisabledContinueButton
    ? { disabled: "disabled" }
    : {};
  React.useEffect(() => {
    // focus the 'continue' button when it gets enabled
    if (!isDisabledContinueButton) {
      buttonRef.current && buttonRef.current.focus();
    }
  }, [isDisabledContinueButton]);

  return React.createElement(
    "button",
    {
      onClick,
      ref: buttonRef,
      ...continueExtra
    },
    "Nadaljuj"
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

// https://stackoverflow.com/a/2450976/516188
function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function getComputations(n) {
  const r = [];
  for (var i=0;i<5;i++) {
    r.push(Math.round(Math.random()*1000));
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
