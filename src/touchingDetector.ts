import * as cvstfjs from "@microsoft/customvision-tfjs";

/** Results normalized to 0-100 percentage chances */
interface ClassificationResult {
  chanceNoFace: number;
  chanceTouching: number;
  chanceNotTouching: number;
}

export async function detect(image: HTMLVideoElement) {
  let model = new cvstfjs.ClassificationModel();
  await model.loadModelAsync("model/model.json");
  const result = await model.executeAsync(image);
  console.log(result);
  const probabilities = result[0];
  if (!probabilities || probabilities.length !== 3) return;

  const [chanceNoFace, chanceNotTouching, chanceTouching] = probabilities;
  return { chanceNoFace, chanceTouching, chanceNotTouching };
}
