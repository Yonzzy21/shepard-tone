// visuals.js

export class Piano {
  constructor(containerId, onTestTrigger) {
    this.containerId = containerId;
    this.scrollY = 0; // Tracks the rolling position
    this.speed = 0;   // How fast the piano rolls
    this.friction = 0.97 //lower = stops faster
    this.canvasX = 1200;
    this.canvasY = 800;
    // Start the p5 instance
    this.frequency = 0.0
    this.p5Instance = new p5(this.sketch.bind(this));
    this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    this.onTestTrigger = onTestTrigger; // 
    this.noteAlphas = {};
    this.noteNames.forEach(note => {
      this.noteAlphas[note] = 0;
    });

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

  }
  updateSpeed(delta, absoluteStep) {
        // Map or scale the encoder value so it's a reasonable speed for p5
        // For example: if encoder output is high, divide it to get a smooth speed like 1 to 10
    if (delta !== 0){    
    this.speed = (delta)*-0.02; 
    //console.log(`Rolling Piano Speed Updated: ${delta}, Absolute Step: ${absoluteStep}`);
        }
    }
  sketch(p) {
    p.setup = () => {

      
      let canvas = p.createCanvas(this.canvasX, this.canvasY);
      canvas.parent(this.containerId);
      
  }

    p.draw = () => {
      p.background(30); // Dark background

      this.noteNames.forEach(note => {
        if (note === this.note && this.speed !== 0) {
          this.noteAlphas[note] = 255;
        } else {
          this.noteAlphas[note] *= 0.98; // Fade out the highlight
        }
      });

      // Update our rolling position
      this.scrollY -= this.speed;
      this.speed *= this.friction;
      if (Math.abs(this.speed) < 0.01) {
        this.speed = 0;
      }

      
      // // If the loop goes too far, reset it to keep it seamless
      // if (this.scrollY < -this.canvasY) { // 400 is the height of the canvas
      //   this.scrollY += this.canvasY + 40; //modolo to the height of the octaves so its seamless
      // }
      //  // If the loop goes too far, reset it to keep it seamless
      // if (this.scrollY > 20) { // 400 is the height of the canvas
      //   this.scrollY -= this.canvasY + 40; //modolo to the height of the octaves so its seamless
      // }

            // One full piano octave pattern (7 white keys * 60px) = 420px.
      const octaveHeight = 420; 

      // If we roll down past one octave, shift back by exactly one octave
      if (this.scrollY <= -octaveHeight) { 
        this.scrollY += octaveHeight; 
      }
      // If we roll up past the starting point, shift forward by exactly one octave
      if (this.scrollY >= 0) { 
        this.scrollY -= octaveHeight; 
      }






      // --- THE ROLLING BOX (PUSH/POP) ---
      p.push(); 
      // Move the entire coordinate system left based on scrollY
      p.translate(0, this.scrollY); 


    // We start drawing slightly off-screen (negative Y) so the loop looks endless
      let startY = -this.canvasY; 
      let keyHeight = 60;
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
          p.text(` ${WhiteKeyNote}`, 300, yPos +40);
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
       

          let blackKeyY = yPos + keyHeight -15 ; // Slightly offset for aesthetics
          p.rect(0, blackKeyY , 240,30); // Black keys are shorter and narrower}
          let currentAlpha = this.noteAlphas[BlackKeyNote] || 0;
          if (currentAlpha > 0) {
            p.stroke(100, 30, 158, currentAlpha); // Purple highlight for white key
            
            p.fill(100, 30, 158, currentAlpha); //Color for the text
            p.textSize(32);
            p.text(` ${BlackKeyNote}`, 100, yPos + 72);
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