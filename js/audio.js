/* Short tones triggered only by a click or key press. Captions stay on screen either way. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FloodAudio = api;
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (root) {
  var ctx = null;

  function muted() {
    return root.FloodSave && root.FloodSave.load().mute;
  }

  function context() {
    var AudioCtx = root.AudioContext || root.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, at, dur, type, volume) {
    var audio = context();
    if (!audio) return;
    var start = audio.currentTime + at;
    var osc = audio.createOscillator();
    var gain = audio.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume || 0.05, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  var bank = {
    click: function () { tone(720, 0, 0.06, "triangle", 0.04); },
    build: function () { tone(240, 0, 0.12, "square", 0.03); tone(360, 0.1, 0.14, "square", 0.03); },
    pass: function () { tone(523, 0, 0.12, "sine", 0.05); tone(659, 0.1, 0.12, "sine", 0.05); tone(784, 0.2, 0.18, "sine", 0.05); },
    fail: function () { tone(196, 0, 0.2, "sawtooth", 0.03); tone(140, 0.16, 0.24, "square", 0.03); },
    error: function () { tone(160, 0, 0.16, "square", 0.03); },
    release: function () { tone(392, 0, 0.1, "triangle", 0.04); tone(494, 0.1, 0.1, "triangle", 0.04); tone(587, 0.2, 0.16, "triangle", 0.04); },
    flood: function () { tone(90, 0, 0.35, "sine", 0.06); tone(70, 0.12, 0.4, "triangle", 0.05); },
    success: function () { tone(523, 0, 0.1, "sine", 0.05); tone(659, 0.1, 0.1, "sine", 0.05); tone(784, 0.2, 0.12, "sine", 0.05); tone(1046, 0.32, 0.22, "sine", 0.05); },
    radio: function () {
      tone(180, 0, 0.05, "square", 0.02);
      tone(420, 0.06, 0.04, "square", 0.02);
      tone(240, 0.11, 0.05, "square", 0.02);
      tone(640, 0.18, 0.08, "sine", 0.03);
    }
  };

  function play(name) {
    if (muted()) return;
    var fn = bank[name] || bank.click;
    try { fn(); } catch (error) { /* Autoplay limits or missing audio should not stop the game. */ }
  }

  return { play: play };
});
