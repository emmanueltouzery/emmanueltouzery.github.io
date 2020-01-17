const ASK_COUNT = 25;
const TIMEOUT_MULT_MS = 10000;
const TIMEOUT_DIV_MS = 16000;

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function getRandomEnum(vals) {
  return vals[getRandomInt(vals.length)];
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
        height: "30px",
        ref: ref,
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
          height: "30px",
          width: "20px",
          margin: "0px",
          borderRadius: "3px",
          ...animInfo
        }
      },
      null
    )
  );
}

function getNewComputation() {
  const op = getRandomInt(2) == 0 ? "x" : ":";
  return {
    fst: getRandomEnum([2, 3, 4, 5, 6, 7, 8, 9]),
    snd: getRandomEnum([2, 3, 4, 5, 6]),
    op: op,
    maxTime: op === "x" ? TIMEOUT_MULT_MS : TIMEOUT_DIV_MS,
    started: new Date()
  };
}

function Mult() {
  const [trail, setTrail] = React.useState([]);
  const [askedCount, setAskedCount] = React.useState(1);
  const [computation, setComputation] = React.useState();
  const [successCount, setSuccessCount] = React.useState(0);
  const [errorCount, setErrorCount] = React.useState(0);
  const [tooSlowCount, setTooSlowCount] = React.useState(0);
  const [isTooSlow, setIsTooSlow] = React.useState(false);
  const resetComputation = () => setComputation(getNewComputation());
  const computationResult = () =>
    computation.op === "x"
      ? computation.fst * computation.snd
      : computation.fst;
  React.useEffect(() => {
    if (!computation) {
      return;
    }
    const question =
      computation.op === "x"
        ? `${askedCount}. Koliko je ${computation.fst}${computation.op}${computation.snd}? `
        : `${askedCount}. Koliko je ${computation.fst * computation.snd}${
            computation.op
          }${computation.snd}? `;
    setTrail([...trail, { question: question }]);
  }, [computation]);
  React.useEffect(() => {
    if (askedCount <= ASK_COUNT) {
      resetComputation();
    }
  }, [askedCount]);
  React.useEffect(() => {
    if (isTooSlow) {
      return;
    }
    const timer = setInterval(() => {
      if (
        askedCount < ASK_COUNT &&
        new Date() - computation.started > computation.maxTime
      ) {
        setTooSlowCount(tooSlowCount + 1);
        setTrail([
          ...trail,
          {
            comment: `Prepočasno! Odgovor je bil ${
              computation.op === "x"
                ? computation.fst * computation.snd
                : computation.fst
            } ker ${computation.fst}x${computation.snd} = ${computation.fst *
              computation.snd}`
          }
        ]);
        setIsTooSlow(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [computation, trail, isTooSlow]);

  const handleEntered = v => {
    if (Number(v) === computationResult()) {
      setTrail([...trail, { answer: v }, { comment: "Bravo! 🎉" }]);
      setSuccessCount(successCount + 1);
      setAskedCount(askedCount + 1);
    } else {
      setErrorCount(errorCount + 1);
      setTrail([...trail, { answer: v }, { comment: "Ne pa ne!" }]);
    }
  };

  const items = [
    React.createElement(PastComputations, { trail: trail }),
    askedCount > ASK_COUNT
      ? React.createElement(
          "h1",
          null,
          `Vprašano: ${askedCount -
            1}, pravilno: ${successCount}, napačno: ${errorCount}, prepočasno: ${tooSlowCount}`
        )
      : isTooSlow
      ? React.createElement(
          "button",
          {
            onClick: () => {
              setIsTooSlow(false);
              setAskedCount(askedCount + 1);
            }
          },
          "Nadaljuj"
        )
      : React.createElement(
          AskQuestion,
          {
            addEntered: handleEntered,
            timeoutMs: computation && computation.maxTime,
            qNum: askedCount
          },
          null
        )
  ];
  return React.createElement(...["div", null, ...items]);
}

ReactDOM.render(React.createElement(Mult), document.getElementById("body"));
