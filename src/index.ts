function startVideoStream() {
  if (!navigator.mediaDevices.getUserMedia) return;
  navigator.mediaDevices
    .getUserMedia({ audio: false, video: { facingMode: "user" } })
    .then(function(stream) {
      const video: HTMLVideoElement = document.querySelector("#webcam");
      video.srcObject = stream;
      video.onloadedmetadata = function(e) {
        video.play();
      };
      startTesting(video);
    })
    .catch(function(err) {
      alert(
        "An error has occurred loading your webcam feed. Try again, or maybe in a different browser?"
      );
    });
}

let testingTimeout: number;
let timerTimeout: number;
let secondsSinceLastTouch = 0;

function startTesting(video: HTMLVideoElement, interval: number = 500) {
  const title = document.getElementById("header");
  const time = document.getElementById("time");

  const loop = async () => {
    const blob = await captureFrame(video);
    const isTouching = await checkFaceTouching(blob);

    if (isTouching) {
      const audio = new Audio("https://uploads.lazerwalker.com/honk.mp3");
      audio.play();
      document.body.classList.add("touching");
      title.innerText = "⚠️ YOU ARE TOUCHING YOUR FACE ⚠️";
      secondsSinceLastTouch = -1;
    } else {
      document.body.classList.remove("touching");
      title.innerText = "Don't Touch Your Face!";
    }

    testingTimeout = setTimeout(loop, interval);
  };

  const timerLoop = () => {
    secondsSinceLastTouch += 1;
    const minutes = Math.floor(secondsSinceLastTouch / 60);
    const seconds = ((secondsSinceLastTouch % 60).toString() as any).padStart(
      2,
      "0"
    );
    time.innerText = `${minutes}:${seconds}`;
    timerTimeout = setTimeout(timerLoop, 1000);
  };

  loop();
  timerLoop();
}

function stopTesting() {
  clearTimeout(testingTimeout);
  clearTimeout(timerTimeout);
}

async function checkFaceTouching(blob: Blob): Promise<boolean | undefined> {
  const json = await imagePrediction(blob);
  if (!json.predictions) return undefined;

  const touching = json.predictions.find(p => p.tagName === "touching-face");
  if (!touching) return undefined;

  return touching.probability > 0.1;
}

async function imagePrediction(blob: Blob): Promise<any> {
  const response = await fetch(
    "https://eastus.api.cognitive.microsoft.com/customvision/v3.0/Prediction/4e0b5b08-57cc-4e4f-ad70-a868b1ba70ad/classify/iterations/Iteration1/image",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Prediction-Key": "ce04b2c466a64e748584aa72f53415e6"
      },
      body: blob
    }
  );
  return await response.json();
}

async function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    var canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    var ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    //   return canvas.toDataURL("image/jpeg");

    canvas.toBlob(blob => {
      resolve(blob);
    }, "image/jpeg");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  startVideoStream();
});
