// visuals.js

export class Piano {
  constructor(containerId) {
    this.containerId = containerId;
    this.scrollY = 0; // Tracks the rolling position
    this.speed = 0;   // How fast the piano rolls
    this.friction = 0.97 //lower = stops faster
    // Start the p5 instance
    this.p5Instance = new p5(this.sketch.bind(this));
  }
  updateSpeed(delta, absoluteStep) {
        // Map or scale the encoder value so it's a reasonable speed for p5
        // For example: if encoder output is high, divide it to get a smooth speed like 1 to 10
    if (delta !== 0){    
    this.speed = (delta)*0.25; 
    //console.log(`Rolling Piano Speed Updated: ${delta}, Absolute Step: ${absoluteStep}`);
  }
}
  sketch(p) {
    p.setup = () => {
      let canvas = p.createCanvas(800, 400);
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

      
      // If the loop goes too far, reset it to keep it seamless
      if (this.scrollY < -400) { // 400 is the height of the canvas
        this.scrollY += 420; //modolo to the height of the octaves so its seamless
      }
       // If the loop goes too far, reset it to keep it seamless
      if (this.scrollY > 20) { // 400 is the height of the canvas
        this.scrollY -= 420; //modolo to the height of the octaves so its seamless
      }

      // --- THE ROLLING BOX (PUSH/POP) ---
      p.push(); 
      // Move the entire coordinate system left based on scrollY
      p.translate(0, this.scrollY); 


    // We start drawing slightly off-screen (negative Y) so the loop looks endless
      let startY = -400; 
      let keyHeight = 60;
      let totalKeys = 20; // Adjust based on how many you want to render

      // Draw a long string of keys that roll across the screen
      for (let i = 0; i < totalKeys; i++) {
        let yPos = startY + (i *  keyHeight); // Each key is 60px wide
        let patternIndex = i % 7;
        p.stroke(0);
        p.fill(255);
        // Draw white key
        p.rect(0, yPos, 800, keyHeight); 
      }
      
      for (let i = 0; i < totalKeys; i++) {
        let yPos = startY + (i * keyHeight); // Each key is 60px wide
        let patternIndex = i % 7;
        // Draw black keys based on the pattern of a piano
        if (patternIndex !== 2 && patternIndex !== 6) {
          p.fill(0);
          p.noStroke();        
          let blackKeyY = yPos + keyHeight -15 ; // Slightly offset for aesthetics
          p.rect(0, blackKeyY , 240,30); // Black keys are shorter and narrower}
      }
    }
      p.pop(); 
      // --- END OF ROLLING BOX ---

      // Everything drawn BELOW this line is unaffected by the rolling movement!
      // For example, a stationary overlay or text:
      p.fill(244, 122, 158); // Pink color from the clock
      p.textSize(24);
      p.text("Rolling Piano Test", 450, 50);
      p.text(`Speed: ${this.speed.toFixed(1)}`, 20, 50);
    };
  }
}