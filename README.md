# Shepard Tone Exhibition

Interactive Shepard tone installation for an endless hamster wheel exhibit. Walking on the wheel turns a Phidget rotary encoder, which drives a continuously rising Shepard-tone synthesizer and a rolling piano visualization.

## Overview

| File | Role |
|------|------|
| `src/main.js` | Entry point — wires audio, visuals, and hardware together |
| `src/shepard-tone.js` | Web Audio Shepard-tone engine |
| `src/phidgetcontroller.js` | Phidget encoder connection and input scaling |
| `src/visuals.js` | Rolling piano visualization (p5.js) |
| `src/index.html` | Main exhibit page |
| `src/test-sandbox.html` | Test encoder scaling without hardware |

## Prerequisites

- **Phidget rotary encoder** attached to the wheel
- **Phidget Network Server** running on the exhibit machine  
  - Default connection: `127.0.0.1:8989`
- A modern browser with Web Audio support (I used Chrome)
- A local HTTP server (required for ES modules — do not open files via `file://`)

## Quick Start

1. Install and launch the [Phidget Network Server](https://www.phidgets.com/docs/Phidget_Network_Server).
2. Plug in the encoder and confirm it appears in the Phidget Control Panel.
3. I used VS Code Live Server (this project’s launch config expects `http://127.0.0.1:5500`).
4. Open `index.html` in the browser.
5. Turn the encoder — audio and visuals should respond immediately (no Start button required; `audioContext.resume()` runs on the first encoder event).

## Encoder Setup

### Hardware connection

The app connects to Phidgets through the **Network Server**, not a direct USB import in the browser.

In `src/phidgetcontroller.js`, `setupPhidgets()`:

| Setting | Default | Description |
|---------|---------|-------------|
| Server host | `127.0.0.1` | Machine running Phidget Network Server |
| Server port | `8989` | Phidget Network Server port |
| Encoder channel | `3` | Phidget channel index — **must match Control Panel** |

**Steps:**

1. Open Phidget Control Panel → confirm the encoder is online.
2. Note which **channel** the encoder uses (0, 1, 2, 3, …).
3. Set `encoder.setChannel(N)` in `phidgetcontroller.js` to that channel.
4. Start the Network Server before loading the page.
5. Check the browser console for:
   - `✅ Connected to Phidget Network Server!`
   - `🔊 Phidget Encoder Link Opened successfully!`

### Data flow

```
Encoder hardware
  → onPositionChange(rawDelta)
  → processPositionChange(rawDelta)
  → { delta, absoluteStep }
  → main.js handleEncoderChange()
  → shepardTone.playStep(delta, absoluteStep)
  → rollingPiano.updateFrequency(frequency)
```

- **`rawDelta`** — raw pulse count from one hardware event (can be large during fast spins).
- **`delta`** — scaled synth step change sent to audio (signed integer).
- **`absoluteStep`** — cumulative position used as the unwrapped pitch index (never resets during a session).

---

## Encoder Scaling Parameters

All scaling lives in `processPositionChange()` inside `src/phidgetcontroller.js`. Tune these to match how the physical wheel feels.

### Primary controls

| Parameter | Location | Default | Effect |
|-----------|----------|---------|--------|
| **Scale divisor** | `absDelta / 40.0` | `40.0` | **Main sensitivity knob.** Higher divisor → fewer synth steps per encoder pulse. Lower divisor → more aggressive pitch movement per tick. |
| **`maxAllowedDelta`** | top of file | `80` | Hard cap on `delta` per event. Prevents huge spins from jumping the sound too far in one frame. |
| **Minimum step** | `if (finalStepChange === 0)` | `1` | Guarantees any non-zero hardware movement produces at least ±1 synth step. |
| **Stop watchdog** | `setTimeout(..., 150)` | `150 ms` | If no encoder events arrive for 150 ms, sends `{ delta: 0, absoluteStep: 0 }` to signal “stopped.” |

### How scaling works

```
rawDelta (from hardware, e.g. +2 or +120)
  → absDelta = |rawDelta|
  → scaledDelta = absDelta / 40.0
  → finalStepChange = round(scaledDelta) × sign(rawDelta)
  → clamp to [-maxAllowedDelta, +maxAllowedDelta]
  → absoluteStep += finalStepChange
```

**Examples with default divisor `40`:**

| Raw pulses | Scaled steps |
|------------|--------------|
| 1–20 | 1 |
| 21–60 | 2 |
| 61–100 | 2–3 |
| 120 | 3 |

Use `test-sandbox.html` to preview scaling without hardware. It calls `processPositionChange()` directly with simulated values (+2 small turn, +120 aggressive spin).

### Tuning guide

| Goal | Adjust |
|------|--------|
| Wheel feels too sensitive / pitch jumps too fast | **Increase** the divisor (e.g. `40` → `60` or `80`) |
| Wheel feels sluggish / need to spin hard to hear change | **Decrease** the divisor (e.g. `40` → `20` or `25`) |
| Fast spins cause huge pitch leaps | **Lower** `maxAllowedDelta` (e.g. `80` → `40`) |
| Slow walking barely registers | Ensure minimum-step logic stays enabled; **decrease** divisor |
| Want smoother “coasting” stop detection | Increase watchdog timeout (e.g. `150` → `250` ms) |

### Alternative curve (commented out)

A power-law scaling option exists in comments:

```js
// scaledDelta = Math.pow(absDelta, 0.5) * 1.5;
```

This compresses large deltas more than linear division — useful if fast spins still feel too extreme after lowering `maxAllowedDelta`.

---

## Shepard Tone Audio Parameters

Constructor defaults in `src/shepard-tone.js`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `minimumFrequency` | `40` Hz | Bottom of the audible Shepard spectrum |
| `maximumFrequency` | `4978` Hz | Top of the Shepard spectrum — controls how “high” the illusion can feel |
| `loopStepsCount` | `2000` | Steps per octave. Higher = finer pitch resolution, slower climb per step |
| `octaveCount` | `11` | Number of simultaneous octave layers |
| `second_volume` | `0.4` | FM/tritone layer depth (via `SetupOscillators_2`) |

### Glide / motion feel (`playStep`)

| Parameter | Formula / value | Effect |
|-----------|-----------------|--------|
| **Glide duration** | `max(0.01, 0.5 / |delta|)` | Faster encoder movement → shorter glide. Slow steps → longer, smoother transitions. |
| **Idle timeout** | `5000` ms | After 5 s of no steps, layers fade out |
| **Idle release** | `4.0` s | Fade time when idle |
| **Wake envelope** | attack `2.5` s | Master swell when starting from silence |

### Sound design (effects in `SetupSynth`)

| Node | Default | Effect |
|------|---------|--------|
| `BiquadFilter.frequency` | `8000` Hz | Master low-pass brightness |
| `fmDepthNode.gain` | `300` | FM modulation depth on tritone layer |
| `DelayNode.delayTime` | `0.6` s | Echo delay time |
| `FeedbackNode.gain` | `0.6` | Echo feedback amount |
| `DelayMixNode.gain` | `0.7` | Echo wet level |
| `ReverbWetGain.gain` | `0.7` | Reverb wet level |
| `PannerNode` | random ±0.6 | Stereo movement per step |

---

## Piano Visualization Parameters

All visual sizing lives in `src/visuals.js` inside the `Piano` class.

### Canvas size

| Parameter | Default | Description |
|-----------|---------|-------------|
| `canvasX` | `1200` | Canvas width in pixels |
| `canvasY` | `1000` | Canvas height in pixels |

> **Note:** `main.js` passes `800, 400` to `new Piano(...)`, but the constructor currently ignores those arguments. Change `canvasX` / `canvasY` in `visuals.js` directly.

### Key size and layout

| Parameter | Default | Description |
|-----------|---------|-------------|
| **`keyHeight`** | `100` | Height of each white key in pixels — **primary “key size” control** |
| `totalKeys` | `40` | How many keys are drawn (length of the rolling strip) |
| `blackKeyWidth` | `canvasX * 0.35` | Black key width relative to canvas |
| `blackKeyHeight` | `keyHeight * 0.6` | Black key height relative to white key |

Octave height on screen = `keyHeight × 7` (seven white keys per octave). Scroll position is derived from audio frequency:

```
exactNoteNumber = 12 × log₂(frequency / 440) + 69
targetScrollY   = -exactNoteNumber × (octaveHeight / 12)
```

### Motion / highlight feel

| Parameter | Default | Description |
|-----------|---------|-------------|
| Scroll lerp | `0.02` in `p.lerp(...)` | How tightly the piano tracks frequency. Higher = snappier; lower = more glide |
| Note highlight decay | `0.98` | How fast non-active note highlights fade |
| Highlight color | `(244, 122, 158)` pink | Active key tint |
| Label color | `(100, 30, 158)` purple | Note name text |

### Tuning guide

| Goal | Adjust |
|------|--------|
| Keys look too small on the display | Increase `keyHeight` (and optionally `canvasX` / `canvasY`) |
| Keys look too large / not enough visible | Decrease `keyHeight` or increase `canvasY` |
| Piano lags behind the audio | Increase lerp factor (e.g. `0.02` → `0.08`) |
| Piano motion feels jittery | Decrease lerp factor |
| Need more keys visible at once | Increase `totalKeys` and/or `canvasY` |

---

## Testing Without Hardware

### Encoder scaling only

Open `src/test-sandbox.html` via your local server. Use the buttons to simulate raw encoder deltas and inspect the scaled `delta` and `absoluteStep` in the page output.

### Audio / visuals only

Temporarily wire keyboard or button handlers in `main.js` to call:

```js
handleEncoderChange({ delta: 1, absoluteStep: someNumber });
```

Or uncomment the Start / Test Step buttons in `index.html` and their listeners in `main.js`.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `Failed to resolve module` | Page not served over HTTP, or wrong base path |
| Phidget connection error | Network Server not running, or wrong host/port |
| Encoder connects but no response | Wrong `encoder.setChannel()` — check Control Panel |
| No sound | Browser audio suspended — turn encoder once to trigger `audioContext.resume()` |
| Sound and visuals out of sync | Two different instances — ensure all controls use the same `shepardTone` in `main.js` |
| Pitch jumps too far on fast spin | Lower `maxAllowedDelta` or increase scale divisor |
| Pitch barely moves on slow walk | Decrease scale divisor |

---

## Architecture

```
index.html
  └── main.js
        ├── shepard-tone.js   (Web Audio synthesis)
        ├── phidgetcontroller.js (hardware input + scaling)
        └── visuals.js        (p5.js rolling piano)
```
