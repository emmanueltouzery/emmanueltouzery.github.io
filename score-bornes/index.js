// started from https://codepen.io/chrisbeast/pen/ebYwpX
const controls = document.querySelector(".controls");
const cameraOptions = document.querySelector(".video-options>select");
const video = document.querySelector("video");
const canvas = document.querySelector("canvas");
const screenshotImage = document.querySelector("img");
const buttons = [...controls.querySelectorAll("button")];
let streamStarted = false;
const computeCanvas = document.createElement("canvas");
const WIDTH = 320;
const HEIGHT = 240;

window.bboxes.width = WIDTH;
window.bboxes.height = HEIGHT;
computeCanvas.width = WIDTH;
computeCanvas.height = HEIGHT;
const ctx = computeCanvas.getContext("2d");

const [play, pause, screenshot] = buttons;

const constraints = {
  video: {
    width: {
      min: WIDTH,
      ideal: WIDTH,
      max: WIDTH
    },
    height: {
      min: HEIGHT,
      ideal: HEIGHT,
      max: HEIGHT
    },
    advanced: [
      {
        facingMode: "environment"
      }
    ]
  }
};

cameraOptions.onchange = () => {
  const updatedConstraints = {
    ...constraints,
    deviceId: {
      exact: cameraOptions.value
    }
  };

  startStream(updatedConstraints);
};

play.onclick = () => {
  if (streamStarted) {
    video.play();
    play.classList.add("d-none");
    pause.classList.remove("d-none");
    return;
  }
  if ("mediaDevices" in navigator && navigator.mediaDevices.getUserMedia) {
    const updatedConstraints = {
      ...constraints,
      deviceId: {
        exact: cameraOptions.value
      }
    };
    startStream(updatedConstraints);
  }
  setInterval(findCards, 500);
};

const findCards = () => {
  console.log("got cards");
  ctx.drawImage(video, 0, 0);
  const data = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
  const bluePixels = [];
  const redPixels = [];
  const blackContrastyPixels = [];
  let offset = 0;
  let neighbourIsWhitish = false;
  let neighbourIsBlackish = false;
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      if (red < 150 && red + 4 < green && green + 4 < blue && blue > 60) {
        bluePixels.push([x, y]);
        neighbourIsWhitish = false;
        neighbourIsBlackish = false;
      } else if (red > 140 && red - 80 > green && red - 80 > blue) {
        redPixels.push([x, y]);
        neighbourIsWhitish = false;
        neighbourIsBlackish = false;
      } else if (red < 60 && green < 60 && blue < 60) {
        if (neighbourIsWhitish) {
          blackContrastyPixels.push([x, y]);
        }
        neighbourIsWhitish = false;
        neighbourIsBlackish = true;
      } else if (red > 150 && green > 150 && blue > 150) {
        if (neighbourIsBlackish) {
          blackContrastyPixels.push([x, y]);
        }
        neighbourIsWhitish = true;
      } else {
        neighbourIsWhitish = false;
        neighbourIsBlackish = false;
      }
      offset += 4;
    }
  }
  console.log("Found " + bluePixels.length + " blue pixels");
  const blueAreas = pixelsFindContiguousAreas(bluePixels, 6).filter(
    area => area.bottomRight[1] - area.topLeft[1] > 15
  );
  console.log("blue areas: " + blueAreas.length);

  console.log("Found " + redPixels.length + " red pixels");
  const redAreas = pixelsFindContiguousAreas(redPixels, 6).filter(
    area => area.bottomRight[1] - area.topLeft[1] > 15
  );
  console.log("red areas: " + redAreas.length);

  console.log(
    "Found " + blackContrastyPixels.length + " blackContrasty pixels"
  );
  const blackContrastyAreas = pixelsFindContiguousAreas(
    blackContrastyPixels,
    18
  );
  console.log("blackContrasty areas: " + blackContrastyAreas.length);

  const ctx2 = window.bboxes.getContext("2d");
  ctx2.clearRect(0, 0, window.bboxes.width, window.bboxes.height);

  ctx2.strokeStyle = "blue";
  for (let i = 0; i < blueAreas.length; i++) {
    drawArea(ctx2, blueAreas[i]);
  }
  ctx2.strokeStyle = "red";
  for (let i = 0; i < redAreas.length; i++) {
    drawArea(ctx2, redAreas[i]);
  }
  ctx2.strokeStyle = "yellow";
  for (let i = 0; i < blackContrastyAreas.length; i++) {
    drawArea(ctx2, blackContrastyAreas[i]);
  }
  guessCards(blueAreas, redAreas, blackContrastyAreas);
};

const guessCards = (blueAreas, redAreas, blackContrastyAreas) => {
  const foundCards = [];
  for (let i = 0; i < blueAreas.length; i++) {
    const area = blueAreas.pop();
    const w = area.width();

    // search for neighbouring areas
    const redNeighbour = redAreas.find(
      a =>
        Math.abs(area.topLeft[1] - a.topLeft[1]) < 7 &&
        Math.abs(area.center()[0] - a.center()[0]) < ((w + a.width()) * 1.2) / 2
    );

    // blue with a red neighbour => that's a 100 -- black, red, blue
    if (redNeighbour) {
      redAreas = redAreas.filter(a => a !== redNeighbour); // remove this red from further consideration
      foundCards.push(100);
      continue;
    }

    const blueNeighbour = blueAreas.find(
      a =>
        Math.abs(area.topLeft[1] - a.topLeft[1]) < 7 &&
        Math.abs(area.center()[0] - a.center()[0]) < ((w + a.width()) * 1.2) / 2
    );

    // blue with a blue neighbour => that's a 25 -- blue, blue
    if (blueNeighbour) {
      blueAreas = blueAreas.filter(a => a !== blueNeighbour); // remove this blue from further consideration
      foundCards.push(25);
      continue;
    }

    const blackNeighbour = blackContrastyAreas.find(
      a =>
        Math.abs(area.topLeft[1] - a.topLeft[1]) < 7 &&
        Math.abs(area.center()[0] - a.center()[0]) < ((w + a.width()) * 1.2) / 2
    );

    if (blackNeighbour) {
      // blue with a black neighbour.. if the black is on the left that's a 200 -- red, black blue
      if (blackNeighbour.topLeft[0] < area.topLeft[0]) {
        foundCards.push(200);
      } else {
        // if the black is on the right that's a 75, blue black
        foundCards.push(75);
      }
      continue;
    }

    // no neighbour, must be two blues that got merged, 25 blue blue
    foundCards.push(25);
  }

  for (let i = 0; i < redAreas.length; i++) {
    const area = redAreas.pop();

    // this is a 50 red-red in any case, but i must remove a neighbour if
    // i find one, not to double count

    // search for neighbouring areas
    const redNeighbour = redAreas.find(
      a =>
        Math.abs(area.topLeft[1] - a.topLeft[1]) < 7 &&
        Math.abs(area.center()[0] - a.center()[0]) < ((w + a.width()) * 1.2) / 2
    );

    if (redNeighbour) {
      redAreas = redAreas.filter(a => a !== redNeighbour); // remove this red from further consideration
    }
    foundCards.push(50);
  }

  document.getElementById("count").innerHTML =
    "I'm guessing " + foundCards.join(", ");
};

const drawArea = (ctx, area) => {
  ctx.beginPath();
  ctx.moveTo(area.topLeft[0], area.topLeft[1]);
  ctx.lineTo(area.bottomRight[0], area.topLeft[1]);
  ctx.lineTo(area.bottomRight[0], area.bottomRight[1]);
  ctx.lineTo(area.topLeft[0], area.bottomRight[1]);
  ctx.lineTo(area.topLeft[0], area.topLeft[1]);
  ctx.stroke();
};

// brute force
const pixelsFindContiguousAreas = (coords, tolerance) => {
  if (coords.length === 0) {
    return [];
  }
  const areas = coords.reduce(
    (soFar, cur) => {
      const existing = soFar.find(bbox => bbox.sqDistance(cur) < tolerance);
      if (existing) {
        existing.addPoint(cur);
      } else {
        soFar.push(new BoundingBox(cur));
      }
      return soFar;
    },
    [new BoundingBox(coords[0])]
  );
  return areas.reduce(
    (soFar, cur) => {
      const existing = soFar.find(a => a.intersects(cur));
      if (existing) {
        existing.combine(cur);
      } else {
        soFar.push(cur);
      }
      return soFar;
    },
    [areas[0]]
  );
};

const pauseStream = () => {
  video.pause();
  play.classList.remove("d-none");
  pause.classList.add("d-none");
};

const doScreenshot = () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  screenshotImage.src = canvas.toDataURL("image/webp");
  screenshotImage.classList.remove("d-none");
};

pause.onclick = pauseStream;
screenshot.onclick = doScreenshot;

const startStream = async constraints => {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  handleStream(stream);
};

const handleStream = stream => {
  video.srcObject = stream;
  play.classList.add("d-none");
  pause.classList.remove("d-none");
  screenshot.classList.remove("d-none");
};

const getCameraSelection = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(device => device.kind === "videoinput");
  const options = videoDevices.map(videoDevice => {
    return `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`;
  });
  cameraOptions.innerHTML = options.join("");
};

getCameraSelection();

class BoundingBox {
  constructor(point) {
    this.topLeft = point;
    this.bottomRight = [...point];
  }

  center() {
    return [
      this.topLeft[0] + (this.bottomRight[0] - this.topLeft[0]) / 2,
      this.topLeft[1] + (this.bottomRight[1] - this.topLeft[1]) / 2
    ];
  }

  // https://gamedev.stackexchange.com/a/44496
  sqDistance([px, py]) {
    const [x, y] = this.center();
    const width = this.bottomRight[0] - this.topLeft[0];
    const height = this.bottomRight[1] - this.topLeft[1];
    const dx = Math.max(Math.abs(px - x) - width / 2, 0);
    const dy = Math.max(Math.abs(py - y) - height / 2, 0);
    return dx * dx + dy * dy;
  }

  width() {
    return this.bottomRight[0] - this.topLeft[0];
  }

  height() {
    return this.bottomRight[1] - this.topLeft[1];
  }

  addPoint([x, y]) {
    if (x < this.topLeft[0]) {
      this.topLeft[0] = x;
    } else if (x > this.bottomRight[0]) {
      this.bottomRight[0] = x;
    }
    if (y > this.bottomRight[1]) {
      this.bottomRight[1] = y;
    } else if (y < this.topLeft[1]) {
      this.topLeft[1] = y;
    }
  }

  intersects(other) {
    // one rectangle is on left side of other
    if (
      this.bottomRight[0] < other.topLeft[0] ||
      this.topLeft[0] > other.bottomRight[0]
    ) {
      return false;
    }
    // one rectangle is above other
    if (
      this.bottomRight[1] < other.topLeft[1] ||
      this.topLeft[1] > this.bottomRight[1]
    ) {
      return false;
    }
    return true;
  }

  combine(other) {
    this.addPoint(other.topLeft);
    this.addPoint(other.bottomRight);
  }
}
