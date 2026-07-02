// visuals.js

export class Piano {
  constructor(containerId) {
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
  }
  getNoteFromFrequency(frequency) {
    const noteNames = this.noteNames;
    const noteNumber = 12 * (Math.log2(frequency / 440)) + 69;
    console.log(`Calculated Note Number: ${noteNumber} for Frequency: ${frequency.toFixed(2)} Hz`);
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
    };

    p.draw = () => {
      p.background(30); // Dark background

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
        const WhiteNoteNames = ['E', 'D', 'C', 'B', 'A', 'G', 'F'];
        let WhiteKeyNote = WhiteNoteNames[patternIndex]; // Get the note name for the white key
        p.stroke(0);
        if (WhiteKeyNote === this.note) {
          p.fill(244, 122, 158); // Pink highlight
        } else {
          p.fill(255); // Standard white
        }
      
        // Draw white key
        p.rect(0, yPos, this.canvasX, keyHeight);
        
      
      }
      
      for (let i = 0; i < totalKeys; i++) {
        let yPos = startY + (i * keyHeight); // Each key is 60px wide
        let patternIndex = i % 7;

        // Draw black keys based on the pattern of a piano
        if (patternIndex !== 2 && patternIndex !== 6) {
          const BlackNoteNames = ['D#', 'C#', 'B#', 'A#', 'G#', 'F#','E#'];
          let BlackKeyNote = BlackNoteNames[patternIndex]; // Get the note name for the black key
          p.noStroke();
          if (BlackKeyNote === this.note) {
            p.fill(244, 122, 158); // Pink highlight for black key
          } else {
            p.fill(0); // Standard black
          }

          let blackKeyY = yPos + keyHeight -15 ; // Slightly offset for aesthetics
          p.rect(0, blackKeyY , 240,30); // Black keys are shorter and narrower}
      }



    }
      p.pop(); 
      // --- END OF ROLLING BOX ---

      // Everything drawn BELOW this line is unaffected by the rolling movement!
      // For example, a stationary overlay or text:
      p.fill(100, 30, 158); //Color for the text
      p.textSize(24);
      p.text("Rolling Piano Test", 450, 50);
      p.text(`Speed: ${Math.abs(this.speed.toFixed(1))}`, 450, 80);
      p.text(`Frequency: ${this.frequency.toFixed(2)} Hz`, 450, 110);
      p.text(`Note: ${this.note}`, 450, 140);
      console.log(`Current Note: ${this.note}, Frequency: ${this.frequency.toFixed(2)} Hz`);
    };
  }
}