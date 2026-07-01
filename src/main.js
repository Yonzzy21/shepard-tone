// 1. Import the code from your other two files
import { ShepardTone } from './shepard-tone.js';
import { setupPhidgets } from './phidgetcontroller.js';

// 2. Initialize your audio context and Shepard synthesizer
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const shepardTone = new ShepardTone(audioContext);

// 3. Define the bridge that responds to hardware changes
function handleEncoderChange({delta, absoluteStep}) {
    console.log(`[Main] Encoder turned. Step Change: ${delta}`);
    if (delta === 0 || delta === undefined) return;
    // if (delta > 0) {
    //     shepardTone.playStep(delta, absoluteStep);
    // } else if (delta < 0) {
    //     // If you built a prev() method, call it here:
    //     // shepardTone.prev();
    // }
    if (delta !== 0) {
        shepardTone.playStep(delta, absoluteStep);
    }
}






// 4. Fire up the physical hardware connection
setupPhidgets(handleEncoderChange)
    .then(() => console.log("🔊 System ready. Phidget Encoder connected!"))
    .catch((err) => console.error("❌ System error connecting Phidget:", err));



document.getElementById('start-btn').addEventListener('click', () => {
        try {
    

            
            console.log("Success! Instance created:", shepardTone);
            
            // Start your playback method
            shepardTone.play();
        } catch (error) {
            console.error("Constructor crashed! Check your JS translations:", error);
        }
    });

    document.getElementById('test-step-btn').addEventListener('click', () => {
        try {
            
            // triggering the next function
            shepardTone.next();
            
            console.log("Success! next step played created:", shepardTone.currentStep);
            
            // Start your playback method
            shepardTone.play();
        } catch (error) {
            console.error("Constructor crashed! Check your JS translations:", error);
        }
    });