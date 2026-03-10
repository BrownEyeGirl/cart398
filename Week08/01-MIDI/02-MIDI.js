/** 
 * Code is working!
 * 
 * This is the second half of the API to MIDI setup. I am hoping to eventually connect this to an arduino heartrate monitor using this method
 * 
 * To Run -> 
 * type node api2midi.js into terminal 
 * 
 * Run this in strudel -> 
 * let cc = await midin('IAC Driver Bus 2')
 * $: note("c a f e").lpf(cc(0).range(0, 1000).add(1000)).lpq(cc(1).range(0, 10)).sound("sawtooth")
 * 
 * Debugging -> 
 * Make sure API key works
 * Make sure youve enabled correct MIDI routing (MIDI Setup -> Window -> Show MIDI Studio, select correct BUS and apply it) Update code to match BUS
 * Make sure 
 */


import easymidi from 'easymidi'
import fetch from 'node-fetch'

//console.log("Available MIDI Outputs:")
//console.log(easymidi.getOutputs())

console.log(easymidi.getOutputs())

// ===== CONFIG =====
const NASA_API_KEY = 'JtoTeFIlOylpbuy3kXW048MyJ9mqiCa6KMqKgPQQ' // replace with your real key
const MIDI_PORT_NAME = 'IAC Driver Bus 2' // your IAC port name
const CC_NUMBER = 1              // which MIDI CC to send
const CHANNEL = 0                // MIDI channel
const POLL_INTERVAL = 60 * 1000  // 1 minute (NASA updates daily)

// ===== MIDI SETUP =====
const output = new easymidi.Output(MIDI_PORT_NAME)

// ===== SCALING FUNCTION =====
function scaleToMidi(value, min, max) {
  const normalized = (value - min) / (max - min)
  return Math.max(0, Math.min(127, Math.floor(normalized * 127)))
}

// Optional smoothing
let smoothed = 0
function smooth(target) {
  smoothed += (target - smoothed) * 0.2
  return smoothed
}

// ===== NASA FETCH FUNCTION =====
async function pollNASA() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    const asteroidCount = data.element_count

    // Typical range is roughly 0–100+
    const midiValue = scaleToMidi(asteroidCount, 0, 100)

    const finalValue = smooth(midiValue)

    output.send('cc', {
      controller: CC_NUMBER,
      value: Math.floor(finalValue),
      channel: CHANNEL
    })

    console.log(`Asteroids today: ${asteroidCount} → MIDI: ${Math.floor(finalValue)}`)

  } catch (err) {
    console.error("NASA fetch error:", err)
  }
}

// Start polling
pollNASA()
setInterval(pollNASA, POLL_INTERVAL)