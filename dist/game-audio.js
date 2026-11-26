// Short synthesized cues; no downloaded assets, autoplay or background music.
const MAX_VOICES = 16;
// [frequency, end frequency, delay, duration, gain, waveform]
const CUES = {
  start: [[220,220,0,1.1,.07,'sine'],[440,440,0,.7,.025,'sine']],
  jump: [[180,560,0,.2,.045,'triangle']],
  hit: [[260,80,0,.12,.035,'triangle']],
  smash: [[105,40,0,.16,.035,'triangle']],
  damage: [[160,55,0,.28,.055,'triangle']],
  shield: [[540,540,0,.28,.04,'sine'],[810,810,.04,.28,.035,'sine']],
  fossil: [[523,523,0,.4,.045,'sine'],[659,659,.09,.4,.04,'sine'],[784,784,.18,.5,.04,'sine']],
  discovery: [[392,392,0,.3,.04,'sine'],[523,523,.1,.3,.04,'sine'],[784,784,.2,.4,.04,'sine']],
  blessing: [[659,659,0,.25,.04,'sine'],[880,880,.08,.3,.04,'sine']],
  over: [[330,330,0,.3,.04,'sine'],[247,247,.12,.3,.04,'sine'],[165,165,.24,.45,.04,'sine']]
};

export function createGameAudio({ AudioContext = globalThis.AudioContext ?? globalThis.webkitAudioContext } = {}) {
  let context, master, enabled = false, request = 0, lastSmash = -Infinity;
  const voices = new Set();
  const release = voice => {
    voices.delete(voice);
    voice.osc.disconnect();
    voice.gain.disconnect();
  };
  function stop() {
    for (const voice of [...voices]) {
      try { voice.osc.stop(); } catch { /* Already ended. */ }
      release(voice);
    }
    lastSmash = -Infinity;
  }
  function mute() {
    request++;
    enabled = false;
    stop();
  }
  return {
    get enabled() { return enabled; },
    // Call only from a user gesture (the sound button), never from the frame loop.
    async enable() {
      const ticket = ++request;
      if (!AudioContext) return false;
      try {
        if (!context) context = new AudioContext();
        if (!master) {
          master = context.createGain();
          master.gain.value = .25;
          master.connect(context.destination);
        }
        await context.resume();
        if (ticket !== request) return false;
        enabled = context.state === 'running';
        return enabled;
      } catch {
        if (ticket === request) { enabled = false; stop(); }
        return false;
      }
    },
    mute, stop,
    play(name) {
      const notes = CUES[name];
      if (!enabled || context?.state !== 'running' || !notes || voices.size + notes.length > MAX_VOICES) return false;
      const now = context.currentTime;
      // One crack per swing, even if a smash destroys many nearby model parts.
      if (name === 'smash' && now - lastSmash < .06) return false;
      if (name === 'smash') lastSmash = now;
      try {
        for (const [from,to,delay,duration,volume,type] of notes) {
          const osc = context.createOscillator(), gain = context.createGain();
          const voice = {osc,gain};
          voices.add(voice);
          osc.onended = () => release(voice);
          osc.type = type;
          const start = now + delay, end = start + duration;
          osc.frequency.setValueAtTime(from,start);
          osc.frequency.exponentialRampToValueAtTime(to,end);
          gain.gain.setValueAtTime(.0001,start);
          gain.gain.exponentialRampToValueAtTime(volume,start + .008);
          gain.gain.exponentialRampToValueAtTime(.0001,end);
          osc.connect(gain); gain.connect(master);
          osc.start(start); osc.stop(end + .015);
        }
        return true;
      } catch {
        mute();
        return false;
      }
    }
  };
}
