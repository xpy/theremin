// Import stylesheets
import './style.css';
import * as Tone from 'tone';
import * as mpHands from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

// const mpHands = window;
const drawingUtils = window;
const controls = window;
const controls3d = window;

const result = document.querySelector('.result');
// Our input frames will come from here.
const videoElement = document.getElementsByClassName(
  'input_video'
)[0] as HTMLVideoElement;
const canvasElement = document.getElementsByClassName(
  'output_canvas'
)[0] as HTMLCanvasElement;
const controlsElement = document.getElementsByClassName(
  'control-panel'
)[0] as HTMLDivElement;
const canvasCtx = canvasElement.getContext('2d')!;

const config = {
  locateFile: (file: string) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${mpHands.VERSION}/${file}`;
  },
};
let started = false;
const osc = new Tone.FatOscillator('Ab3', 'sawtooth', 40).toDestination();
// const osc = new Tone.Oscillator(440, "sine").toDestination().start();
const osc2 = new Tone.FatOscillator(200, 'square').toDestination();
document.addEventListener('click', () => {
  osc.start(), osc2.start();
});

function onResults(results: mpHands.Results): void {
  // Hide the spinner.
  document.body.classList.add('loaded');
  // Update the frame rate.

  // Draw the overlays.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  if (results.multiHandLandmarks && results.multiHandedness) {
    for (let index = 0; index < results.multiHandLandmarks.length; index++) {
      const classification = results.multiHandedness[index];
      const isRightHand = classification.label === 'Right';
      const landmarks = results.multiHandLandmarks[index];
      result.innerHTML = `${landmarks[4].x} - ${landmarks[4].y}`;
      if (isRightHand) {
        osc2.set({ frequency: Math.abs(landmarks[4].x * 200) });
      } else {
        osc.set({ frequency: Math.abs(landmarks[4].x * 200) });
      }
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        mpHands.HAND_CONNECTIONS,
        { color: isRightHand ? '#00FF00' : '#FF0000' }
      );
      drawingUtils.drawLandmarks(canvasCtx, landmarks, {
        color: isRightHand ? '#00FF00' : '#FF0000',
        fillColor: isRightHand ? '#FF0000' : '#00FF00',
        radius: (data: drawingUtils.Data) => {
          return drawingUtils.lerp(data.from!.z!, -0.15, 0.1, 10, 1);
        },
      });
    }
  }
  canvasCtx.restore();
}

const hands = new mpHands.Hands(config);
hands.onResults(onResults);

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
});
camera.start();

/*
// Present a control panel through which the user can manipulate the solution
// options.
new controls
    .ControlPanel(controlsElement, {
      selfieMode: true,
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    .add([
      new controls.StaticText({title: 'MediaPipe Hands'}),
      fpsControl,
      new controls.Toggle({title: 'Selfie Mode', field: 'selfieMode'}),
      new controls.SourcePicker({
        onFrame:
            async (input: controls.InputImage, size: controls.Rectangle) => {
              const aspect = size.height / size.width;
              let width: number, height: number;
              if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
              } else {
                width = window.innerWidth;
                height = width * aspect;
              }
              canvasElement.width = width;
              canvasElement.height = height;
              await hands.send({image: input});
            },
      }),
      new controls.Slider({
        title: 'Max Number of Hands',
        field: 'maxNumHands',
        range: [1, 4],
        step: 1
      }),
      new controls.Slider({
        title: 'Model Complexity',
        field: 'modelComplexity',
        discrete: ['Lite', 'Full'],
      }),
      new controls.Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
      }),
      new controls.Slider({
        title: 'Min Tracking Confidence',
        field: 'minTrackingConfidence',
        range: [0, 1],
        step: 0.01
      }),
    ])
    .on(x => {
      const options = x as mpHands.Options;
      videoElement.classList.toggle('selfie', options.selfieMode);
      hands.setOptions(options);
    });
*/
