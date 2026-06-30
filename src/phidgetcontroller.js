import * as Phidget22 from 'https://cdn.jsdelivr.net/npm/phidget22@3.16.1/+esm';


// 1. Create the accumulator tracking variables here
let absoluteStep = 0;
const TOTAL_AUDIO_STEPS = 64;


export async function setupPhidgets(onDataCallback) {
  // 1. FIXED: Correct JavaScript Browser connection format
  // Pass the port (5661) and host address ('127.0.0.1') directly into the constructor
  const conn = new Phidget22.Connection(8989, '127.0.0.1');
  
  // Connect to the local server
  await conn.connect();
  console.log("✅ Connected to Phidget Network Server!");

  // 2. Initialize the encoder channel
  const encoder = new Phidget22.Encoder();
  encoder.setChannel(2); // Assumes input channel 0
  
  // 3. Listen for changes
  encoder.onPositionChange = function (positionChange) {
    const delta = positionChange;
  
    if (delta !== 0) {
      console.log(`[Phidget Hardware] Ticks moved: ${delta}`);
      absoluteStep += delta;

      // Wrap the absoluteStep within the range of TOTAL_AUDIO_STEPS
      absoluteStep = ((absoluteStep % TOTAL_AUDIO_STEPS) + TOTAL_AUDIO_STEPS) % TOTAL_AUDIO_STEPS;
      console.log(`[Phidget Hardware] Absolute Step: ${absoluteStep}`);
      onDataCallback(absoluteStep);
    }
  };
  
  // 4. Open the physical device link (waits up to 5 seconds)
  await encoder.open(5000);
  console.log("🔊 Phidget Encoder Link Opened successfully!");
}