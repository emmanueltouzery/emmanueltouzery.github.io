const ASK_COUNT = 25;
const TIMEOUT_MULT_MS = 10000;
const TIMEOUT_DIV_MS = 16000;
const TIMEOUT_CONTINUE_BUTTON_ENABLE_MS = 1500;

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

function useTimer(computation, setDisabledContinueButton) {
  const [isTooSlow, setIsTooSlow] = React.useState(false);
  const tooSlow = () =>
    computation && new Date() - computation.started > computation.maxTime;
  React.useEffect(() => {
    setIsTooSlow(tooSlow());
    const timer = setInterval(() => {
      if (!isTooSlow && tooSlow()) {
        setIsTooSlow(true);
      }
      if (computation && isTooSlow) {
        // disable the 'continue' button in the first X ms after the timeout
        setDisabledContinueButton(
          new Date() - computation.started - computation.maxTime <
            TIMEOUT_CONTINUE_BUTTON_ENABLE_MS
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [computation, isTooSlow]);
  return isTooSlow;
}

function GameSummary({ askedCount, successCount, errorCount, tooSlowCount }) {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current.scrollIntoView();
  }, []);
  return React.createElement(
    "h2",
    { ref },
    `Vprašano: ${askedCount -
      1}, pravilno: ${successCount}, napačno: ${errorCount}, prepočasno: ${tooSlowCount}`
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

function Mult() {
  const [trail, setTrail] = React.useState([]);
  const [askedCount, setAskedCount] = React.useState(1);
  const [computation, setComputation] = React.useState();
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

  const isTooSlow = useTimer(computation, setDisabledContinueButton);
  React.useEffect(() => {
    if (computation && isTooSlow) {
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
    }
  }, [isTooSlow]);

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
      ? React.createElement(GameSummary, {
          askedCount,
          successCount,
          errorCount,
          tooSlowCount
        })
      : isTooSlow
      ? React.createElement(ContinueButton, {
          isDisabledContinueButton,
          onClick: () => {
            setDisabledContinueButton(true);
            setAskedCount(askedCount + 1);
          }
        })
      : React.createElement(AskQuestion, {
          addEntered: handleEntered,
          timeoutMs: computation && computation.maxTime,
          qNum: askedCount
        })
  ];
  return React.createElement(...["div", null, ...items]);
}

ReactDOM.render(React.createElement(Mult), document.getElementById("body"));
