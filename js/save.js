/* Completed mission levels only. An open round is not stored. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FloodSave = api;
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (root) {
  var KEY = "floodline-rescue-v1";

  function empty() {
    return { done: {}, mute: false };
  }

  function load() {
    try {
      var raw = root.localStorage.getItem(KEY);
      if (!raw) return empty();
      var data = JSON.parse(raw);
      return {
        done: data.done && typeof data.done === "object" ? data.done : {},
        mute: !!data.mute
      };
    } catch (error) {
      return empty();
    }
  }

  function write(data) {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (error) {
      /* Storage can be unavailable. The current round still plays. */
    }
  }

  function complete(levelId) {
    var data = load();
    data.done[String(levelId)] = true;
    write(data);
  }

  function setMute(value) {
    var data = load();
    data.mute = !!value;
    write(data);
  }

  function clear() {
    var data = load();
    data.done = {};
    write(data);
  }

  function unlocked(levelId) {
    if (levelId <= 1) return true;
    return !!load().done[String(levelId - 1)];
  }

  return {
    load: load,
    complete: complete,
    setMute: setMute,
    clear: clear,
    unlocked: unlocked
  };
});
