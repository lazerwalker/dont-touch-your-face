function startVideoStream() {
  if (!navigator.mediaDevices.getUserMedia) return;
  navigator.mediaDevices
    .getUserMedia({ audio: false, video: { facingMode: "user" } })
    .then(function(stream) {
      const video = document.getElementById("webcam") as HTMLVideoElement;
      video.srcObject = stream;
      video.onloadedmetadata = function(e) {
        video.play();
        startTesting(video);
      };
    })
    .catch(function(err) {
      alert(
        "An error has occurred loading your webcam feed. Try again, or maybe in a different browser?"
      );
      alert(err);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  startVideoStream();
});

async function imagePrediction(blob: Blob): Promise<any> {
  const response = await fetch(
    "https://westus2.api.cognitive.microsoft.com/customvision/v3.0/Prediction/71df7f3a-fc78-4777-8290-3e7676d4a927/classify/iterations/Iteration1/image",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Prediction-Key": "5b52d788fe7141d19081a3cff99fd9c0"
      },
      body: blob
    }
  );
  return await response.json();
}

async function checkFaceTouching(blob: Blob): Promise<boolean | undefined> {
  const json = await imagePrediction(blob);
  if (!json.predictions) return undefined;

  console.log(json);
  const touching = json.predictions.find(p => p.tagName === "touching");
  if (!touching) return undefined;

  return touching.probability > 0.1;
}

async function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    var canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    var ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      resolve(blob);
    }, "image/jpeg");
  });
}

function startTesting(video: HTMLVideoElement, interval: number = 100) {
  const title = document.getElementById("header");

  const loop = async () => {
    const blob = await captureFrame(video);
    const isTouching = await checkFaceTouching(blob);

    if (isTouching) {
      const audio = new Audio("https://uploads.lazerwalker.com/honk.mp3");
      audio.play();
      document.body.classList.add("touching");
      title.innerText = "⚠️ YOU ARE TOUCHING YOUR FACE ⚠️";
    } else {
      document.body.classList.remove("touching");
      title.innerText = "Don't Touch Your Face!";
    }

    setTimeout(loop, interval);
  };

  loop();
}
