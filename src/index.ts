import { detect } from "./touchingDetector";

let currentAudio: string = "audio/honk.mp3";
let audioLastPlayed: Date = new Date();
let audioThrottle: number = 500;

function startVideoStream() {
  if (!navigator.mediaDevices.getUserMedia) return;
  navigator.mediaDevices
    .getUserMedia({ audio: false, video: { facingMode: "user" } })
    .then(function(stream) {
      const video: HTMLVideoElement = document.querySelector("#webcam");
      video.srcObject = stream;
      video.onloadedmetadata = e => {
        video.play();
      };

      video.onloadeddata = e => {
        startTesting(video);
      };
    })
    .catch(function(err) {
      alert(
        "An error has occurred loading your webcam feed. Try again, or maybe in a different browser?"
      );
    });
}

function playAudio() {
  const now = new Date();
  const differenceInMS = Math.floor(now.getTime() - audioLastPlayed.getTime());

  if (differenceInMS < audioThrottle) return;

  audioLastPlayed = now;

  const audio = new Audio(currentAudio);
  audio.play();
}

let testingTimeout: number;
let timerTimeout: number;
let dateOfLastTouch = new Date();

let highScoreInSeconds: number = 0;

// TODO: I think there should be a toggle for showing system alerts?
let alertIsVisible = false;

function startTesting(video: HTMLVideoElement, interval: number = 100) {
  const title = document.getElementById("header");
  const time = document.getElementById("time");

  const highScore = document.getElementById("high-score");
  const highScoreTime = document.getElementById("high-score-time");

  const loop = async () => {
    const isTouching = await checkFaceTouching(video);

    const now = new Date();

    if (isTouching) {
      if ((document.getElementById("play-sound") as HTMLInputElement).checked) {
        playAudio();
      }
      document.body.classList.add("touching");
      title.innerText = "⚠️ YOU ARE TOUCHING YOUR FACE ⚠️";
      dateOfLastTouch = now;

      // alert() calls are "blocking" within the current thread
      // This is a very sloppy semaphore lock to try to stop us from piling up alerts.
      const showAlerts = (document.getElementById(
        "show-alert"
      ) as HTMLInputElement).checked;
      if (showAlerts && !alertIsVisible) {
        alertIsVisible = true;
        alert("You touched your face!");
        alertIsVisible = false;
      }
    } else {
      document.body.classList.remove("touching");
      title.innerText = "Don't Touch Your Face!";
    }

    const differenceInSeconds = Math.floor(
      (now.getTime() - dateOfLastTouch.getTime()) / 1000
    );

    if (differenceInSeconds >= highScoreInSeconds) {
      highScoreInSeconds = differenceInSeconds;
      highScore.classList.add("winning");
    } else {
      highScore.classList.remove("winning");
    }

    time.innerText = formatTime(differenceInSeconds);
    testingTimeout = (setTimeout(loop, interval) as unknown) as number;

    highScoreTime.innerText = formatTime(highScoreInSeconds);
  };

  loop();
}

function stopTesting() {
  clearTimeout(testingTimeout);
  clearTimeout(timerTimeout);
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const printSecs = ((seconds % 60).toString() as any).padStart(2, "0");
  return `${minutes}:${printSecs}`;
}

async function checkFaceTouching(
  video: HTMLVideoElement
): Promise<boolean | undefined> {
  const result = await detect(video);
  if (!result) return;
  console.log(result);

  const touchingDebugLabel = document.getElementById("chance-touching");
  const notTouchingDebugLabel = document.getElementById("chance-not-touching");

  touchingDebugLabel.innerText = `${(result.chanceTouching * 100).toFixed(1)}%`;
  notTouchingDebugLabel.innerText = `${(result.chanceNotTouching * 100).toFixed(
    1
  )}%`;

  return result.chanceTouching > 0.01 && result.chanceNotTouching < 0.002;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start").addEventListener("click", () => {
    document.getElementById("start").hidden = true;
    startVideoStream();
  });

  if ((window as any).safari) {
    const safari = document.getElementById("safari-warning");
    const safariClose = document.getElementById("close-safari");

    safari.hidden = false;
    safariClose.addEventListener("click", () => {
      safari.hidden = true;
    });
  }

  document.querySelectorAll("input.sfx").forEach(el => {
    el.addEventListener("change", e => {
      const value = (e.target as HTMLInputElement).value;
      console.log("Setting value", value);
      currentAudio = value;
      playAudio();
    });
  });
});
