import * as Phidget22 from 'https://cdn.jsdelivr.net/npm/phidget22@3.16.1/+esm';


// 1. Create the accumulator tracking variables here
let absoluteStep = 0;
const TOTAL_AUDIO_STEPS = 128;
// Inside your Phidget Controller initialization / state
let physicalStepPosition = 0;
let smoothedStepPosition = 0;
const maxAllowedDelta = 50;    // Caps aggressive physical spins
const smoothingFactor = 0.9;  // 0.1 = ultra-smooth lag, 0.9 = snappy snap

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
    console.log(`Raw Delta: ${rawDelta}`);

    const direction = Math.sign(rawDelta);
    const absDelta = Math.abs(rawDelta);
  
    // SCALE THE DELTA
    // Keep small movements responsive while compressing large bursts.
    let scaledDelta = Math.pow(absDelta, 0.35) * 0.4;
    let finalStepChange = Math.round(scaledDelta) * direction;

    // Ensure a single encoder tick still triggers audio.
    if (finalStepChange === 0) {
      finalStepChange = direction;
    }

    // Keep it within your audio engine's sweet spot.
    const maxAllowedDelta = 50;
    finalStepChange = Math.max(-maxAllowedDelta, Math.min(maxAllowedDelta, finalStepChange));
    
    // // Keep absoluteStep within your audio bounds (0 to 128)
    // // Choice A: Clamp it so it stops at the ends
    // absoluteStep = Math.max(0, Math.min(TOTAL_AUDIO_STEPS, absoluteStep));


    // 4. Round it out so you get clean increments/decrements
    absoluteStep += finalStepChange;
    console.log(`Scaled Delta: ${finalStepChange}`);


    onDataCallback({ delta: finalStepChange, absoluteStep });
  };
  
  // 4. Open the physical device link (waits up to 5 seconds)
  await encoder.open(5000);
  console.log("🔊 Phidget Encoder Link Opened successfully!");
}
