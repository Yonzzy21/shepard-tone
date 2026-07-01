// 1. Import the code from your other two files
import { ShepardTone } from './shepard-tone.js';
import { setupPhidgets } from './phidgetcontroller.js';

// 2. Initialize your audio context and Shepard synthesizer
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const shepardTone = new ShepardTone(audioContext);

// 3. Define the bridge that responds to hardware changes
function handleEncoderChange({ delta, absoluteStep }) {
    console.log(`[Main] Encoder turned. Step Change: ${delta}`);
    if (delta === 0 || delta === undefined) return;

    audioContext.resume().then(() => {
        shepardTone.playStep(delta, absoluteStep);
    });
}






// 4. Fire up the physical hardware connection
setupPhidgets(handleEncoderChange)
    .then(() => console.log("🔊 System ready. Phidget Encoder connected!"))
    .catch((err) => console.error("❌ System error connecting Phidget:", err));



document.getElementById('start-btn').addEventListener('click', async () => {
        try {
    

            
            await audioContext.resume();
            console.log("Success! Instance created:", shepardTone);
            
            // Start your playback method
            await shepardTone.play();
        } catch (error) {
            console.error("Constructor crashed! Check your JS translations:", error);
        }
    });

    document.getElementById('test-step-btn').addEventListener('click', async () => {
        try {
            await audioContext.resume();
            shepardTone.next();
            console.log("Success! next step played created:", shepardTone.currentStep);
        } catch (error) {
            console.error("Constructor crashed! Check your JS translations:", error);
        }
    });
