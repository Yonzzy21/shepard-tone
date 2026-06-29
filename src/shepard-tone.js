/**
 * @see {@link https://jordaneldredge.com/blog/creating-the-shepard-tone-audio-illusion-with-javascript/ | The article this code is based on}
 */

const INITIAL_STEP = 0;
const GAIN_VOLUME_FACTOR = 12;

/**
 * @example Usage
 * ```typescript
 * const shepardTone = new ShepardTone(createAudioContext());
 * shepardTone.play();
 * ```
 */
class ShepardTone {
  constructor(
    audioContext,
    /** The minimum frequency the tone will reach */
    minimumFrequency = 5,
    /** The maximum frequency the tone will reach */
    maximumFrequency = 16000,
    /** Number of steps a tone loop consists of, an integer bigger than one */
    loopStepsCount = 12,
    /** Duration of the loop in milliseconds */
    loopDuration = 5000,

    // stepSpeed = 300
  ) {
    this.audioContext = audioContext;
    this.minimumFrequency = minimumFrequency;
    this.maximumFrequency = maximumFrequency;
    this.loopStepsCount = loopStepsCount;
    this.loopDuration = loopDuration;

    this.gainNode = this.audioContext.createGain();
    this.envelope = this.audioContext.createGain();

    this.gainNode.connect(this.audioContext.destination);
    // this.oscillatorNodes = new Array(this.loopStepsCount).fill(null);
    this.octaveCount = 9; 
    this.oscillatorNodes = new Array(this.octaveCount).fill(null);
    this.maxFrequency = this.minimumFrequency * Math.pow(2, this.octaveCount); // LOCK IT HERE
    this.currentStep = 0;
    this.timeout = null;
    this.IdleTimeout = null;
    this.playing = false;
    this.volume = 1;
    this.SetupSynth()
  }

    playStep = (targetStep) => {
    const now = this.audioContext.currentTime
    const multiplier = Math.pow(2, 1 / this.loopStepsCount);
    // const stepSpeed = this.loopDuration / this.loopStepsCount; // dont need this for interactive
    let baseFrequency = this.minimumFrequency *Math.pow(multiplier, targetStep);
    const diagnostics = [];
    this.oscillatorNodes.forEach((pair, index) => {
      

      // 1. "pair" checks if an object even exists in this slot (fails on the very first click because slots are null).
  // 2. "pair.osc" verifies that the object actually contains an active oscillator node to stop.
  // 3. "pair.env" verifies that the object actually contains a gain envelope node to fade out.

      if (pair && pair.osc && pair.env) {
        console.log(`fading outLayer ${index} `)
        const releaseTime = 0.9;
        this.EnvGenOff(pair.env,releaseTime)
        if (Array.isArray(pair.osc)) {
          pair.osc.forEach(osc => osc.stop(now + releaseTime));
        } else {
          pair.osc.stop(now + releaseTime);
        }
        console.log(``, pair, `\n` + `osciilator` ,pair?.osc, pair?.env)
        setTimeout(() => {
        try {
          pair.env.disconnect(this.gainNode);
          pair.env.disconnect(this.DelayNode);
        } catch(e) {}
      }, releaseTime * 1000);

      }
    });



    
    this.oscillatorNodes = this.oscillatorNodes.map(
      (existingNodePair, index) => { 
   
          
        const frequency =
          baseFrequency;
        const tritoneFrequency = frequency * 2 **(3/12) //to create a tritone u[]
        //console.log(`Loop layer debug -> base: ${baseFrequency}, freq: ${frequency}`);
        const shepardVolumeNode = this.audioContext.createGain();
        const stepEnvelope = this.audioContext.createGain(); //knob controlling the overall envelope

        const oscPrimary = this.audioContext.createOscillator();
        const oscTritone = this.audioContext.createOscillator();
        oscPrimary.frequency.value = frequency; // value in hertz
        oscTritone.frequency.value = tritoneFrequency; // value in hertz

        const x = Math.log2(frequency / this.minimumFrequency) / Math.log2(this.maxFrequency / this.minimumFrequency);
        //console.log(`Layer ${index} - X: ${x} - maxFreq: ${maxFrequency}`);
        const boundedX = Math.max(0, Math.min(1, x));
                /// each octave envelope curve based on Shepards
   
        //console.log(`Layer ${index} - X: ${x}`);
        const baseCurve = (1 - Math.cos(2 * Math.PI * boundedX)) /2 ; 
        const targetGain = Math.pow(baseCurve, 1.5);
        const floor = 0.12;

        shepardVolumeNode.gain.value = floor + (1 - floor) * targetGain;
        
        diagnostics.push({
        "Layer": index,
        "Frequency": `${frequency.toFixed(1)} Hz`, 
        "Curve Pos (0-1)": boundedX.toFixed(2),
        "Calculated Vol": shepardVolumeNode.gain.value.toFixed(3)
        });


        oscPrimary.connect(stepEnvelope);
        oscTritone.connect(stepEnvelope);
        shepardVolumeNode.connect(stepEnvelope);
        stepEnvelope.connect(this.gainNode);
        stepEnvelope.connect(this.DelayNode);

        this.envGenOn(stepEnvelope, 0.1, 0.6, shepardVolumeNode.gain.value);
        console.log(`🎵 [Envelope] Layer ${index} - Attack: 0.1, Decay: 0.6, Sustain: ${shepardVolumeNode.gain.value.toFixed(3)}`);

        oscPrimary.start(now);
        oscTritone.start(now);

        console.log(`🎵 [Creation] Layer ${index} connected at ${frequency.toFixed(1)}Hz`);
        baseFrequency = baseFrequency * 2;
        console.log("Diagnostics:", { 
          baseFreq: baseFrequency, 
          mult: multiplier, 
          step: this.currentStep 
        });
        
        return { osc: [oscPrimary, oscTritone], shepard: shepardVolumeNode, env: stepEnvelope 
      };
    });
    console.table(diagnostics);

    //creating timeout release:

    if (this.IdleTimeout != null) {
      clearTimeout(this.IdleTimeout);
    }

    this.IdleTimeout = setTimeout(() => {
      console.log("Idle timeout reached");
      const now = this.audioContext.currentTime;
      const releaseTime = 0.3

      this.oscillatorNodes.forEach((pair) => {
        if (pair && pair.osc && pair.env) {
          // Trigger the envelope fade-out
          this.EnvGenOff(pair.env, releaseTime);
          if (Array.isArray(pair.osc)) {
            pair.osc.forEach(osc => osc.stop(now + releaseTime));
          } else {
            pair.osc.stop(now + releaseTime);
          }
          // Clean up the pipes after the fade completes
          setTimeout(() => {
            try {
              pair.env.disconnect(this.gainNode);
              pair.env.disconnect((this.DelayNode));
            } catch (e) {}

          }, releaseTime * 1000);
        }
           
        
      });
      this.oscillatorNodes.fill(null);
    },5000)

  };

  /**
   * Begin playback of the tone, if the tone is already in a playing state this method will have no effect.
   */
  play() {
    if (this.playing) {
      return;
    }
    this.playing = true;
    this.playStep(0); ///added a number so it won't crash at beginning.
  }

  /**
   * Pauses the playback of the tone, if the tone is already in a paused state this method will have no effect.
   */
  pause() {
    this.playing = false;
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
    }
    const now = this.audioContext.currentTime;
    for (const node of this.oscillatorNodes) {
      if (Array.isArray(node.osc)) {
        node.osc.forEach(osc => osc.stop(now));
      } else {
        node.osc.stop(now);
      }
    }
  }

  /**
   * Resets the playback of the tone
   */
  reset() {
    this.currentStep = INITIAL_STEP;
  }

  /**
   * The volume at which the tone will be played.
   * A double values must fall between 0 and 1, where 0 is effectively muted and 1 is the loudest possible value.
   */
  get volume() {
    return this.gainNode.gain.value * GAIN_VOLUME_FACTOR;
  }

  set volume(value) {
    this.gainNode.gain.value = value / GAIN_VOLUME_FACTOR;
  }
  envGenOn(envelope, a, d,s ){
    const now = this.audioContext.currentTime;
    envelope.gain.cancelScheduledValues(0);
    envelope.gain.setValueAtTime(0.001, now);
    const safeSustain = Math.max(0.001, s); // Ensure target is never 0
    envelope.gain.exponentialRampToValueAtTime(safeSustain, now + a);
    envelope.gain.exponentialRampToValueAtTime(safeSustain, now + a + d);


  }
  EnvGenOff(envelope, r){
    const now = this.audioContext.currentTime;
    envelope.gain.cancelScheduledValues(0);
    const currentVol = Math.max(0.001, envelope.gain.value);
    envelope.gain.setValueAtTime(currentVol, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + r);  }

  SetupSynth() {
    this.DelayNode = this.audioContext.createDelay(1.0);
    this.DelayNode.delayTime.value = 0.0001;
    this.FeedbackNode = this.audioContext.createGain();
    this.FeedbackNode.gain.value = 0.000001;
    this.DelayNode.connect(this.FeedbackNode);
    this.FeedbackNode.connect(this.DelayNode);

    this.DelayNode.connect(this.gainNode);

  }

  next() {
   
    this.currentStep = (this.currentStep + 1) % this.loopStepsCount;
    
    this.playStep(this.currentStep);
  }
}

/** Helper function to create an AudioContext */
 function createAudioContext() {
  // @ts-ignore
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  return new AudioContext();
}

