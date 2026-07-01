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
export  class ShepardTone {
    constructor(
      audioContext,
      /** The minimum frequency the tone will reach */
      minimumFrequency = 40,
      /** The maximum frequency the tone will reach */
      maximumFrequency = 6000,
      /** Number of steps a tone loop consists of, an integer bigger than one */
      loopStepsCount = 1000,
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
      this.octaveCount = 11; 
      this.oscillatorNodes = new Array(this.octaveCount).fill(null);
      this.maxFrequency = this.maximumFrequency; // 
      this.currentStep = 0;
      this.timeout = null;
      this.IdleTimeout = null;
      this.playing = false;
      this.volume = 1.0;
      this.second_volume = 0.5;
      this.SetupSynth()
      this.SetupOscillators()

    }

    getLayerState(targetStep, index) {
      const multiplier = Math.pow(2, 1 / this.loopStepsCount);
      
      // 1. Calculate base frequency for step 0
      const absoluteBase = this.minimumFrequency;
      
      // 2. Find out how many total octaves our targetStep represents
      const stepsPerOctave = this.loopStepsCount; // e.g., 64 steps per octave loop
      const totalOctavesFromMovement = targetStep / stepsPerOctave;
      
      // 3. Determine the natural octave offset for this specific layer index
      const layerOctaveOffset = index;
      
      // Total fractional octaves above the absolute minimum baseline
      const totalOctavesAboveMin = totalOctavesFromMovement + layerOctaveOffset;
      
      // 4. FIND THE ILLUSION SPAN (How many octaves fit between min and max freq)
      const logSpan = Math.log2(this.maxFrequency / this.minimumFrequency); // e.g., log2(16000/20) = ~9.64 octaves
      
      // WRAP IT: Keep the octave count cleanly looping inside our structural window bounds!
      const wrappedOctaves = ((totalOctavesAboveMin % logSpan) + logSpan) % logSpan;
      
      // 5. Calculate final wrapped frequencies
      const frequency = absoluteBase * Math.pow(2, wrappedOctaves);
      const tritoneFrequency = frequency * 2**0.5;
      
      // 6. Calculate the Gaussian curve position X (Guaranteed to be 0.0 to 1.0)
      const x = wrappedOctaves / logSpan;
      const boundedX = Math.max(0, Math.min(1, x));
      
      // Classic Shepard volume curve fading out smoothly at the edges
      const baseCurve = (1 - Math.cos(2 * Math.PI * boundedX)) / 2;
      const targetGain = Math.pow(baseCurve, 2);
      const floor = 0.001;
      const calculatedVolume = floor + (1 - floor) * targetGain;
      
      return { frequency, tritoneFrequency, calculatedVolume };
    }



      playStep = (delta, targetStep) => {
      const now = this.audioContext.currentTime;
      const isStartingFromSilence = !this.playing
            // Add delta each encoder tick (unwrapped — never jumps 63→0)
      this.currentStep = targetStep;
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch((err) => {
          console.warn('AudioContext resume failed', err);
        });
      }
      // Use this.currentStep for audio, not the wrapped absoluteStep from Phidget
      //targetStep = this.currentStep;
      this.playing = true;

      const randomPan = Math.random() *  1.5 - 0.75;
      //console.log(`Random pan: ${randomPan}`);
      this.PannerNode.pan.setValueAtTime(this.PannerNode.pan.value, now); // random pan value between -0.5 and 0.5
      this.PannerNode.pan.linearRampToValueAtTime(randomPan, now + 0.3);
      
      

      const speed = Math.abs(delta);
      let glideDuration;
      console.log(`Speed: ${speed}`);
      if (speed === 0 || !Number.isFinite(speed)) {
        console.warn("Speed is zero or not finite, defaulting glide to 0.002");
        glideDuration = 0.002;
      } else{
          glideDuration = Math.max(0.01, 0.08/speed); // Adjust glide duration based on speed, with a minimum of 0.01 seconds
      }
      if (!Number.isFinite(glideDuration)) {
        console.warn("Glide duration is not finite, defaulting to 0.002");
        glideDuration = 0.002;
      }
      console.log(`Glide Duration: ${glideDuration}`);
      
      const diagnostics = [];

      if (isStartingFromSilence) {
      this.envGenOn(this.envelope,2.5, 0.1, 1.0);
      console.log("[Synth] Waking up from silence. Master envelope swelling in...");
       }
  
      this.oscillatorNodes.forEach((pair, index) => {
        if (!pair) return;
       // console.log(`[Layer ${index} Structure]:`, pair);

        const { frequency, tritoneFrequency, calculatedVolume } = this.getLayerState(targetStep, index);
     
        
          

          // 3. FIXED: Cancel old curves and smoothly glide the existing running values
        pair.oscPrimary.frequency.cancelScheduledValues(now);
        pair.oscPrimary.frequency.setValueAtTime(pair.oscPrimary.frequency.value, now);
        pair.oscPrimary.frequency.exponentialRampToValueAtTime(frequency, now + glideDuration);

        pair.oscTritone.frequency.cancelScheduledValues(now);
        pair.oscTritone.frequency.setValueAtTime(pair.oscTritone.frequency.value, now);
        pair.oscTritone.frequency.exponentialRampToValueAtTime(tritoneFrequency, now + glideDuration);

        pair.shepardGain.gain.cancelScheduledValues(now);
        pair.shepardGain.gain.setValueAtTime(pair.shepardGain.gain.value, now);
        pair.shepardGain.gain.linearRampToValueAtTime(calculatedVolume, now + glideDuration);


      });

      if (this.IdleTimeout != null) {
        clearTimeout(this.IdleTimeout);
      }

      this.IdleTimeout = setTimeout(() => {
        console.log("Idle timeout reached");
        const releaseTime = 4.0

        this.oscillatorNodes.forEach((pair) => {
          if (!pair) return;
            this.EnvGenOff(pair.shepardGain, releaseTime);
          
            
          
        });
        this.playing = false;
      },5000)

    }

    /**
     * Pauses the playback of the tone, if the tone is already in a paused state this method will have no effect.
     */
    pause() {
      this.playing = false;
      if (this.timeout !== null) {
        clearTimeout(this.timeout);
      }
      for (const pair of this.oscillatorNodes) {
        if (!pair) continue;
        const now = this.audioContext.currentTime;
        const releaseTime = 0.8;
        this.EnvGenOff(pair.shepardGain, releaseTime);
      }
    }

    /**
     * Resets the playback of the tone
     */
    reset() {
      this.currentStep = INITIAL_STEP;
    }

    async play() {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.playStep(1, this.currentStep);
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


      this.envelope.gain.value = 0.0001;
      //The Main Filter

      this.BiquadFilter = this.audioContext.createBiquadFilter();
      this.BiquadFilter.type = 'lowpass';
      this.BiquadFilter.frequency.value = 4000;
      this.BiquadFilter.Q.value = 0.7;

      // simpler StereoPanner
      this.PannerNode = this.audioContext.createStereoPanner(); 


      //Delay effects
      this.DelayNode = this.audioContext.createDelay(2.0);
      this.DelayNode.delayTime.value = 0.7;

      this.FeedbackNode = this.audioContext.createGain();
      this.FeedbackNode.gain.value = 0.9;
      /// delay mix controls
      this.DelayMixNode = this.audioContext.createGain();
      this.DelayMixNode.gain.value = 0.15; // 0.4 means echoes are at 40% volume of the original note
  
      //Reverb effect
      this.ReverbCutoffFilter = this.audioContext.createBiquadFilter();
      this.ReverbCutoffFilter.type = 'lowpass';
      this.ReverbCutoffFilter.frequency.value = 3000;

      this.ReverbDelay = this.audioContext.createDelay(2.0);
      this.ReverbDelay.delayTime.value = 0.04; // Ultra-short delay for room density
      
      this.ReverbFeedback = this.audioContext.createGain();
      this.ReverbFeedback.gain.value = 0.7; // How long the reverb rings

      // Balance controls for the reverb mix
      this.ReverbDryGain = this.audioContext.createGain();
      this.ReverbDryGain.gain.value = 1.0; // Keep original sound at 100%

      this.ReverbWetGain = this.audioContext.createGain();
      this.ReverbWetGain.gain.value = 0.9; // Reverb tail volume level





      // --- SPLITTING THE MAIN AUDIO SIGNAL ---
      // Path A: Send the clean sound through the dry gain stage
      this.BiquadFilter.connect(this.ReverbDryGain);
    
      // Path B: Send the sound into the Echo engine
      this.BiquadFilter.connect(this.DelayNode);
    
      // Path C: Send the sound into the Reverb engine filter
      this.BiquadFilter.connect(this.ReverbCutoffFilter);
      this.ReverbCutoffFilter.connect(this.ReverbDelay);
        
        // 1. Restore the Echo Loop (Delay -> Feedback -> Delay)
      this.DelayNode.connect(this.FeedbackNode);
      this.FeedbackNode.connect(this.DelayNode);

      // 2. Restore the Reverb Loop (ReverbDelay -> ReverbFeedback -> ReverbDelay)
      this.ReverbDelay.connect(this.ReverbFeedback);
      this.ReverbFeedback.connect(this.ReverbDelay);


      // --- MERGING ALL PATHS BACK TO MASTER OUT ---
      // Collect Path A (Clean Dry Sound)
      this.ReverbDryGain.connect(this.PannerNode);

      // Collect Path B (Echo Sound managed by its Mix node)
      this.DelayNode.connect(this.DelayMixNode);
      this.DelayMixNode.connect(this.PannerNode);

      // Collect Path C (Reverb Wash managed by its Wet node)
      this.ReverbDelay.connect(this.ReverbWetGain);
      this.ReverbWetGain.connect(this.PannerNode);

      // Final pipeline out to the sound card!
      this.PannerNode.connect(this.envelope);
      this.envelope.connect(this.gainNode);
        }

    next() {
    
      this.currentStep = (this.currentStep + 1) % this.loopStepsCount;
      
      this.playStep(1,this.currentStep);
    }
  
    SetupOscillators() {

      this.oscillatorNodes = Array.from({ length: this.octaveCount }).map((_, index) => {
      const shepardVolumeNode = this.audioContext.createGain();
      const secondVolumeNode = this.audioContext.createGain();
      secondVolumeNode.gain.value = this.second_volume;

      const oscPrimary = this.audioContext.createOscillator();
      const oscTritone = this.audioContext.createOscillator();
      oscPrimary.type = 'square';




          // ── ADD THIS BLOCK HERE ──
      const { frequency, tritoneFrequency, calculatedVolume } =
      this.getLayerState(INITIAL_STEP, index);
      // or: this.getLayerState(this.currentStep, index)  same thing at boot (both are 0)

      oscPrimary.frequency.value = 0.0001;
      oscTritone.frequency.value = 0.0001;
      shepardVolumeNode.gain.value = calculatedVolume;
      // silent until play? use: shepardVolumeNode.gain.value = 0;
      // ── END BLOCK ──

      
      // Connect them permanently
      oscPrimary.connect(shepardVolumeNode);

      oscTritone.connect(secondVolumeNode);
      secondVolumeNode.connect(shepardVolumeNode);

      shepardVolumeNode.connect(this.BiquadFilter);

      // Start them playing silence/default baseline immediately
      oscPrimary.start(0);
      oscTritone.start(0);

      // Keep references to everything we need to tweak later
      return { 
        oscPrimary: oscPrimary, 
        oscTritone: oscTritone, 
        shepardGain: shepardVolumeNode,
        secondGain: secondVolumeNode
      };
    });
  }
}

/** Helper function to create an AudioContext */
 function createAudioContext() {
  // @ts-ignore
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  return new AudioContext();
}


