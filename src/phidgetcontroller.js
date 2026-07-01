import * as Phidget22 from 'https://cdn.jsdelivr.net/npm/phidget22@3.16.1/+esm';


// 1. Create the accumulator tracking variables here
let absoluteStep = 0;
//const TOTAL_AUDIO_STEPS = 128;
// Inside your Phidget Controller initialization / state
let physicalStepPosition = 0;
let smoothedStepPosition = 0;
const maxAllowedDelta = 6;    // Caps aggressive physical spins
const smoothingFactor = 0.1;  // 0.1 = ultra-smooth lag, 0.9 = snappy snap

export async function setupPhidgets(onDataCallback) {
  // 1. FIXED: Correct JavaScript Browser connection format
  // Pass the port (5661) and host address ('127.0.0.1') directly into the constructor
  const conn = new Phidget22.Connection(8989, '127.0.0.1');
  
  // Connect to the local server
  await conn.connect();
  console.log("✅ Connected to Phidget Network Server!");

  // 2. Initialize the encoder channel
  const encoder = new Phidget22.Encoder();
  encoder.setChannel(3); // Assumes input channel 0
  
  // 3. Listen for changes
  encoder.onPositionChange = function (positionChange) {
    const rawDelta = positionChange;
    if (rawDelta === 0) return;
    // 2. Tame the delta instantly if the user spun it violently
    console.log(`Raw Delta: ${rawDelta}`);

    const clampedDelta = Math.max(-maxAllowedDelta, Math.min(maxAllowedDelta, rawDelta));

    // 3. Update our internal absolute target tracking position
    physicalStepPosition += clampedDelta;
    smoothedStepPosition = smoothedStepPosition + (physicalStepPosition - smoothedStepPosition) * smoothingFactor;
      // Wrap the absoluteStep within the range of TOTAL_AUDIO_STEPS
      // absoluteStep = ((absoluteStep % TOTAL_AUDIO_STEPS) + TOTAL_AUDIO_STEPS) % TOTAL_AUDIO_STEPS; 
      //Currently doesnt do anything special, need to implement future script of speed

    onDataCallback({delta: clampedDelta, absoluteStep: smoothedStepPosition});
  };
  
  // 4. Open the physical device link (waits up to 5 seconds)
  await encoder.open(5000);
  console.log("🔊 Phidget Encoder Link Opened successfully!");
}