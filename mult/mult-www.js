const ASK_COUNT = 16; // number of combinations when you pick only one number
const TIMEOUT_MULT_MS = 10000;
const TIMEOUT_DIV_MS = 16000;
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
  const numberChoices = [2, 3, 4, 5, 6, 7, 8, 9].map(n =>
    React.createElement(PickNumber, {
      text: `${n}`,
      key: n,
      onClick: () => numberPicked(n)
    })
  );
  return React.createElement(
    "div",
    { style: { display: "flex", flexWrap: "wrap" } },
    [
      ...numberChoices,
      React.createElement(PickNumber, {
        text: "≤6 💪",
        key: "vsedo6",
        onClick: () => numberPicked("alltill6")
      }),
      React.createElement(PickNumber, {
        text: "Vse 🏆",
        key: "vse",
        onClick: () => numberPicked("all")
      })
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

function AskQuestion({ addEntered, timeoutMs, qNum }) {
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

function useTimer(
  askedCount,
  computationStarted,
  computation,
  setDisabledContinueButton
) {
  const [isTooSlow, setIsTooSlow] = React.useState(false);
  const tooSlow = () =>
    computation && new Date() - computationStarted > computation.maxTime;
  React.useEffect(() => {
    setIsTooSlow(tooSlow());
    const timer = setInterval(() => {
      if (!isTooSlow && tooSlow()) {
        setIsTooSlow(true);
      }
      if (computation && isTooSlow) {
        // disable the 'continue' button in the first X ms after the timeout
        setDisabledContinueButton(
          new Date() - computationStarted - computation.maxTime <
            TIMEOUT_CONTINUE_BUTTON_ENABLE_MS
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [askedCount, isTooSlow]);
  return isTooSlow;
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

function Mult({ computations, newGame }) {
  const [trail, setTrail] = React.useState([]);
  const [askedCount, setAskedCount] = React.useState(0);
  const [computationStarted, setComputationStarted] = React.useState(
    new Date()
  );
  const [successCount, setSuccessCount] = React.useState(0);
  const [errorCount, setErrorCount] = React.useState(0);
  const [tooSlowCount, setTooSlowCount] = React.useState(0);
  // disable the 'continue' button in the first 1000ms after the timeout,
  // so the student reads what they didn't know + students tend to press
  // enter from the previous question and acknowledge this by mistake,
  // immediately triggering the next question
  const [isDisabledContinueButton, setDisabledContinueButton] = React.useState(
    true
  );

  const nextQuestion = () => {
    setAskedCount(askedCount + 1);
    setComputationStarted(new Date());
  };

  const computation = () => computations[askedCount];
  const computationResult = () =>
    computation().op === "x"
      ? computation().fst * computation().snd
      : computation().fst;

  const isTooSlow = useTimer(
    askedCount,
    computationStarted,
    computation(),
    setDisabledContinueButton
  );

  React.useEffect(() => {
    if (askedCount >= ASK_COUNT) {
      return;
    }
    const question =
      computation().op === "x"
        ? `${askedCount + 1}. Koliko je ${computation().fst}${
            computation().op
          }${computation().snd}? `
        : `${askedCount + 1}. Koliko je ${computation().fst *
            computation().snd}${computation().op}${computation().snd}? `;
    setTrail([...trail, { question: question }]);
  }, [askedCount]);

  React.useEffect(() => {
    if (isTooSlow) {
      setTooSlowCount(tooSlowCount + 1);
      setTrail([
        ...trail,
        {
          comment: `Prepočasno! Odgovor je bil ${
            computation().op === "x"
              ? computation().fst * computation().snd
              : computation().fst
          } ker ${computation().fst}x${computation().snd} = ${computation()
            .fst * computation().snd}`
        }
      ]);
    }
  }, [isTooSlow]);

  const handleEntered = v => {
    if (Number(v) === computationResult()) {
      setTrail([...trail, { answer: v }, { comment: "Bravo! 🎉" }]);
      setSuccessCount(successCount + 1);
      nextQuestion();
    } else {
      setErrorCount(errorCount + 1);
      setTrail([...trail, { answer: v }, { comment: "Ne pa ne!" }]);
    }
  };

  const items = [
    React.createElement(PastComputations, { trail: trail }),
    askedCount >= ASK_COUNT
      ? React.createElement(GameSummary, {
          askedCount,
          successCount,
          errorCount,
          tooSlowCount,
          newGame
        })
      : isTooSlow
      ? React.createElement(ContinueButton, {
          isDisabledContinueButton,
          onClick: () => {
            setDisabledContinueButton(true);
            nextQuestion();
          }
        })
      : React.createElement(AskQuestion, {
          addEntered: handleEntered,
          timeoutMs: computation().maxTime,
          qNum: askedCount
        })
  ];
  return React.createElement(...["div", null, ...items]);
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
  // compute all the combinations and shuffle them
  // avoids asking multiple times the same question
  if (Number.isInteger(n)) {
    return shuffle(
      [2, 3, 4, 5, 6, 7, 8, 9].flatMap(x => [
        { fst: x, snd: n, op: "x", maxTime: TIMEOUT_MULT_MS },
        { fst: x, snd: n, op: ":", maxTime: TIMEOUT_DIV_MS }
      ])
    );
  }
  if (n === "all") {
    return shuffle(
      [2, 3, 4, 5, 6, 7, 8, 9].flatMap(x =>
        [2, 3, 4, 5, 6, 7, 8, 9].flatMap(n => [
          { fst: x, snd: n, op: "x", maxTime: TIMEOUT_MULT_MS },
          { fst: x, snd: n, op: ":", maxTime: TIMEOUT_DIV_MS }
        ])
      )
    ).slice(0, ASK_COUNT);
  }
  return shuffle(
    [2, 3, 4, 5, 6, 7, 8, 9].flatMap(x =>
      [2, 3, 4, 5, 6].flatMap(n => [
        { fst: x, snd: n, op: "x", maxTime: TIMEOUT_MULT_MS },
        { fst: x, snd: n, op: ":", maxTime: TIMEOUT_DIV_MS }
      ])
    )
  ).slice(0, ASK_COUNT);
}

function Game() {
  const [computations, setComputations] = React.useState();

  return computations
    ? React.createElement(Mult, {
        computations,
        newGame: () => setComputations()
      })
    : React.createElement(PickNumbers, {
        numberPicked: n => setComputations(getComputations(n))
      });
}

ReactDOM.render(React.createElement(Game), document.getElementById("body"));
