// visuals.js

export class Piano {
  constructor(containerId, onTestTrigger, width, height) {
    this.containerId = containerId;
    this.scrollY = 0; // Tracks the rolling position
    this.speed = 0;   // How fast the piano rolls
    this.friction = 0.97 //lower = stops faster
    this.canvasX = width;
    this.canvasY = height;
    // Start the p5 instance
    this.frequency = 0.0
    this.p5Instance = new p5(this.sketch.bind(this));
    this.noteNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
    this.onTestTrigger = onTestTrigger; // 
    this.noteAlphas = {};
    this.noteNames.forEach(note => {
      this.noteAlphas[note] = 0;
    });
    this.keyHeight = 100; // Height of each key in pixels

  }
  getNoteFromFrequency(frequency) {
    const noteNames = this.noteNames;
    const noteNumber = 12 * (Math.log2(frequency / 440)) + 69;
    //console.log(`Calculated Note Number: ${noteNumber} for Frequency: ${frequency.toFixed(2)} Hz`);
    const roundedNoteNumber = Math.round(noteNumber);
    const noteIndex = ((roundedNoteNumber % 12) + 12) % 12;
    return noteNames[noteIndex];
  }
  updateFrequency(frequency) {
    // Update the frequency display in the UI
    this.frequency = frequency;
    this.note = this.getNoteFromFrequency(frequency);
    // 🚀 CALCULATE EXACT PIXEL TARGET FROM FREQUENCY
    // Convert frequency to an absolute note number (e.g., C4 = 60, A4 = 69)
    const exactNoteNumber = 12 * (Math.log2(frequency / 440)) + 69;
    const octaveHeight = this.keyHeight * 7; // Height of 1 full octave (7 white keys)
    this.targetScrollY = -exactNoteNumber * (octaveHeight / 12);

  }
  updateSpeed(delta, absoluteStep) {
    //     // Map or scale the encoder value so it's a reasonable speed for p5
    //     // For example: if encoder output is high, divide it to get a smooth speed like 1 to 10
    // if (delta !== 0){    
    // this.speed = (delta)*-0.03; 
    // //console.log(`Rolling Piano Speed Updated: ${delta}, Absolute Step: ${absoluteStep}`);
    //     }
    }
  sketch(p) {
    p.setup = () => {

      
      let canvas = p.createCanvas(this.canvasX, this.canvasY);
      canvas.parent(this.containerId);
      
  }

    p.draw = () => {




      p.background(30); // Dark background
      const octaveHeight = this.keyHeight * 7;   // 60px * 7 = 420px
      const verticalCenter = this.canvasY / 2;
      this.noteNames.forEach(note => {
        if (note === this.note) {
          this.noteAlphas[note] = 255;
        } else {
          this.noteAlphas[note] *= 0.98; // Fade out the highlight
        }
      });

      // // Update our rolling position
      // this.scrollY -= this.speed;
      // this.speed *= this.friction;
      // if (Math.abs(this.speed) < 0.01) {
      //   this.speed = 0;
      // }


            // One full piano octave pattern (7 white keys * 60px) = 420px.
   

      // // If we roll down past one octave, shift back by exactly one octave
      // if (this.scrollY <= -octaveHeight) { 
      //   this.scrollY += octaveHeight; 
      // }
      // // If we roll up past the starting point, shift forward by exactly one octave
      // if (this.scrollY >= 0) { 
      //   this.scrollY -= octaveHeight; 
      // }
      // 🚀 THE SMOOTH LOCK ENGINE
      if (this.targetScrollY !== undefined) {

        // Ensure we are comparing wrapped coordinates so the camera doesn't spin wildly on loop resets
        let wrappedTarget = ((this.targetScrollY % octaveHeight) + octaveHeight) % octaveHeight;
        let wrappedCurrent = ((this.scrollY % octaveHeight) + octaveHeight) % octaveHeight;

        // Handle shortest path over the boundary seam (keeps transitions seamless)
        let diff = wrappedTarget - wrappedCurrent;
        if (diff > octaveHeight / 2) wrappedCurrent += octaveHeight;
        if (diff < -octaveHeight / 2) wrappedCurrent -= octaveHeight;

        // Smoothly slide the current scroll position toward the target position
        // 0.15 controls the responsiveness. Increase for tighter tracking, decrease for more glide.
        this.scrollY = p.lerp(wrappedCurrent, wrappedTarget, 0.03);
        
        // Final wrap to keep your scrolling variable bound within 1 octave range
        this.scrollY = ((this.scrollY % octaveHeight) + octaveHeight) % octaveHeight;
      }





      // --- THE ROLLING BOX (PUSH/POP) ---
      p.push(); 
      // Move the entire coordinate system left based on scrollY
      p.translate(0, -this.scrollY + verticalCenter); 


    // We start drawing slightly off-screen (negative Y) so the loop looks endless
      let startY = -(this.canvasY); 
      let keyHeight = this.keyHeight;
      let totalKeys = 40; // Adjust based on how many you want to render

      // Draw a long string of keys that roll across the screen
      for (let i = 0; i < totalKeys; i++) {
        let yPos = startY + (i *  keyHeight); // Each key is 60px wide
        let patternIndex = i % 7;
        const WhiteSemitones = [4, 2 , 0, 11, 9, 7, 5]; //
        let WhiteKeyNote = this.noteNames[WhiteSemitones[patternIndex]]; // Get the note name for the white key
   
        let defaultWhite = p.color(255); // Standard white
        let highlightPink = p.color(244, 122, 158);
        let fadeAmt = this.noteAlphas[WhiteKeyNote] / 255; // Default to 0 if undefined
        let mixedColor = p.lerpColor(defaultWhite, highlightPink, fadeAmt);

        let highlightpurple = p.color(100, 30, 158);
        let notemixedColor = p.lerpColor(defaultWhite, highlightpurple, fadeAmt);
        p.stroke(0);
        p.fill(mixedColor);
        // Draw white key
        p.rect(0, yPos, this.canvasX, keyHeight);
        
        let currentAlpha = this.noteAlphas[WhiteKeyNote] || 0;
        if (currentAlpha > 0) {
          p.stroke(100, 30, 158, currentAlpha); // Purple highlight for white key
          
          p.fill(100, 30, 158, currentAlpha); //Color for the text
          p.textSize(32);
          p.text(` ${WhiteKeyNote}`, 450, yPos +50);
        }

      }
      
      for (let i = 0; i < totalKeys; i++) {
        let yPos = startY + (i * keyHeight); // Each key is 60px wide
        let patternIndex = i % 7;
        // Draw black keys based on the pattern of a piano
        if (patternIndex !== 2 && patternIndex !== 6) {
          const BlackSemitones = [3, 1,-1, 10, 8, 6, -1];
          let BlackKeyNote = this.noteNames[BlackSemitones[patternIndex]]; // Get the note name for the black key


          let defaultBlack = p.color(0); // Standard black
          let highlightPink = p.color(244, 122, 158);
          let fadeAmt = this.noteAlphas[BlackKeyNote] / 255; // Default to 0 if undefined
          let mixedColor = p.lerpColor(defaultBlack, highlightPink, fadeAmt);
          //console.log(`{this.noteAlphas[BlackKeyNote]} for ${BlackKeyNote} | Fade Amount: ${fadeAmt}`);
          p.stroke(0);
          p.fill(mixedColor);
       
          let blackKeyWidth = this.canvasX * 0.35;
          let blackKeyHeight = keyHeight *0.6;

          

          let blackKeyY = (yPos + keyHeight) - blackKeyHeight/2 ; // Slightly offset for aesthetics
          p.rect(0, blackKeyY , blackKeyWidth,blackKeyHeight); // Black keys are shorter and narrower}
          let currentAlpha = this.noteAlphas[BlackKeyNote] || 0;
          if (currentAlpha > 0) {
            p.stroke(100, 30, 158, currentAlpha); // Purple highlight for white key
            
            p.fill(100, 30, 158, currentAlpha); //Color for the text
            p.textSize(32);
            p.text(` ${BlackKeyNote}`, 100, blackKeyY+40);
          }
      }
    }
      p.pop(); 

      // --- END OF ROLLING BOX ---
      // 🚀 PLACE THIS INSIDE p.draw() AFTER THE DECAY LOGIC:

      // 1. Convert the object into a clean, readable text string
      let diagnosticOutput = Object.entries(this.noteAlphas)
        .map(([note, alpha]) => `${note}: ${alpha.toFixed(0)}`)
        .join(" | ");

      // 2. Check if ANY note is currently glowing or fading
      const isAnythingGlowing = Object.values(this.noteAlphas).some(alpha => alpha > 0);

      // 3. Only log if there is an active visual change happening
      if (isAnythingGlowing) {
        //console.log(`[Alpha Matrix] ${diagnosticOutput}`);
      }

      // Everything drawn BELOW this line is unaffected by the rolling movement!
      // For example, a stationary overlay or text:
      p.fill(100, 30, 158); //Color for the text
      p.textSize(24);
      p.text("Rolling Piano Test", 450, 50);
      p.text(`Speed: ${Math.abs(this.speed.toFixed(1))}`, 450, 80);
      p.text(`Frequency: ${this.frequency.toFixed(2)} Hz`, 450, 110);
      p.text(`Note: ${this.note}`, 450, 140);
      //console.log(`Current Note: ${this.note}, Frequency: ${this.frequency.toFixed(2)} Hz`);
      //p.text(`[TEST MODE] Up/Down Arrows to Spin | '1' for Step 0 | '9' for Step 128`, 20, 380);
    };
  }
}