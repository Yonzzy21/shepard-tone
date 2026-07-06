import * as Phidget22 from 'https://cdn.jsdelivr.net/npm/phidget22@3.16.1/+esm';


/// --- STATE VARIABLES ---
let absoluteStep = 0;
let stopTimeoutTimer = null;
const maxAllowedDelta = 80;

/**
 * PURE PROCESSING FUNCTION
 * This does all the math. It doesn't care if the data came from a real Phidget
 * or a fake test script.
 */
export function processPositionChange(rawDelta, onDataCallback) {
  // --- STOP WATCHDOG ---
  if (stopTimeoutTimer) clearTimeout(stopTimeoutTimer);

  stopTimeoutTimer = setTimeout(() => {
    onDataCallback({ delta: 0, absoluteStep: 0 });
  }, 150);

  if (rawDelta === 0) return;
  console.log(`Raw Delta: ${rawDelta}`);

  const direction = Math.sign(rawDelta);
  const absDelta = Math.abs(rawDelta);
  const scaledDelta = absDelta / 30.0

  // // SCALE THE DELTA
  // let scaledDelta = Math.pow(absDelta, 0.5) * 1.5;
  // console.log(`Scaled Delta (before rounding): ${scaledDelta}`);
  let finalStepChange = Math.round(scaledDelta) * direction;
  if (finalStepChange === 0 && rawDelta !== 0) {
    finalStepChange = direction;
  }

  // // Ensure a single encoder tick still triggers audio
  // if (finalStepChange === 0) {
  //   finalStepChange = direction;
  // }


  console.log(`Raw Pulses: ${rawDelta} -> Computed Synth Speed: ${finalStepChange}`);
  
  // Ensure even tiny nudges still register a minimum step of 1
  if (finalStepChange === 0) {
    finalStepChange = direction;
  }



  // Bound it to sweet spot
  finalStepChange = Math.max(-maxAllowedDelta, Math.min(maxAllowedDelta, finalStepChange));

  absoluteStep += finalStepChange;
  console.log(`Scaled Delta: ${finalStepChange} | Absolute Step: ${absoluteStep}`);

  // Send data back to the application
  onDataCallback({ delta: finalStepChange, absoluteStep });
}

/**
 * PHIDGET HARDWARE SETUP
 * Only handles the actual physical connection.
 */
export async function setupPhidgets(onDataCallback) {
  const conn = new Phidget22.Connection(8989, '127.0.0.1');
  await conn.connect();
  console.log("✅ Connected to Phidget Network Server!");

  const encoder = new Phidget22.Encoder();
  encoder.setChannel(3);
  
  // Simply forward the hardware event to our isolated processor
  encoder.onPositionChange = function (positionChange) {
    processPositionChange(positionChange, onDataCallback);
  };
  
  await encoder.open(5000);
  console.log("🔊 Phidget Encoder Link Opened successfully!");
}

 