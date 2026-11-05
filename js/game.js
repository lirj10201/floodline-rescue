/* Hash routes and button actions. Resource changes go through the rules module. */
(function () {
  var page = "home";
  var match = null;
  var lockedId = 1;
  var timer = null;
  var busy = false;
  var lastView = "";

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function clearTimer() {
    if (timer) window.clearTimeout(timer);
    timer = null;
  }

  function render() {
    var root = document.getElementById("app");
    var current = document.activeElement;
    var focus = current && current.getAttribute ? current.getAttribute("data-focus") : "";
    var viewKey = page + ":" + (match ? match.levelId + ":" + match.mode : lockedId);
    var viewChanged = viewKey !== lastView;
    lastView = viewKey;
    root.innerHTML = FloodUI.render({
      page: page,
      match: match,
      progress: FloodSave.load(),
      lockedId: lockedId
    });
    var main = document.getElementById("main");
    if (focus) {
      var again = root.querySelector("[data-focus=\"" + (window.CSS && CSS.escape ? CSS.escape(focus) : focus) + "\"]");
      if (again) again.focus();
    } else if (viewChanged && main) {
      main.focus();
    }
  }

  function playSound(name) {
    try { FloodAudio.play(name); } catch (error) { /* Sound never blocks a turn. */ }
  }

  function shortFail(error) {
    var text = String(error || "");
    if (text.indexOf("kit") !== -1) return "没有木料";
    if (text.indexOf("turn") !== -1 || text.indexOf("late") !== -1 || text.indexOf("closed") !== -1) return "来不及";
    if (text.indexOf("flood") !== -1 || text.indexOf("Flood") !== -1) return "水要涨";
    return "";
  }

  function apply(result) {
    if (!result) return;
    if (!result.ok) {
      match.message = result.error;
      match.messageTone = "bad";
      match.toast = shortFail(result.error);
      match.caption = "Alert tone. " + result.error;
      render();
      playSound("error");
      return;
    }
    match = result.state;
    match.toast = "";
    match.bump = "";
    render();
    playSound(result.sound || "click");
    if (match.phase === "animating") {
      clearTimer();
      timer = window.setTimeout(function () {
        timer = null;
        if (!match || match.phase !== "animating") return;
        var done = FloodRules.finishRelease(match);
        if (done.ok) {
          match = done.state;
          playSound(done.sound || "success");
        }
        render();
      }, reducedMotion() ? 700 : 2300);
    }
  }

  function onActivate(el) {
    if (!el || busy) return;
    var action = el.getAttribute("data-action");
    if (!action) return;
    if (el.getAttribute("data-blocked") === "1") {
      if (!match) return;
      var reason = el.querySelector("small");
      match.message = reason ? reason.textContent : "That action is waiting for an earlier step.";
      match.messageTone = "bad";
      match.caption = "Alert tone. " + match.message;
      render();
      return;
    }
    busy = true;
    try {
      if (action === "clear-progress") {
        FloodSave.clear();
        playSound("click");
        render();
        return;
      }
      if (action === "mute") {
        FloodSave.setMute(!FloodSave.load().mute);
        if (match) match.caption = FloodSave.load().mute ? "Sound off. Captions stay on screen." : "Sound on. The next action will play a short tone.";
        playSound("click");
        render();
        return;
      }
      if (action === "radio") {
        playSound("radio");
        if (match) match.caption = "Radio tone. The full transcript is the paragraph above this button.";
        render();
        return;
      }
      if (action === "retry") {
        clearTimer();
        var created = FloodRules.createMatch(match.levelId, match.mode);
        match = created.state;
        playSound("click");
        render();
        return;
      }
      if (action === "finish") {
        if (match && match.mode === "mission") FloodSave.complete(match.levelId);
        var nextLevel = match && match.mode === "mission" ? match.levelId + 1 : 0;
        window.location.hash = nextLevel >= 2 && nextLevel <= 3 ? "#/play/" + nextLevel + "/mission" : "#/";
        return;
      }
      if (action === "drive") {
        tryDrive(el.getAttribute("data-id"));
        return;
      }
      if (action === "answer") {
        var selected = document.querySelector("input[name=\"q-" + el.getAttribute("data-qid") + "\"]:checked");
        if (!selected) {
          match.message = "Choose one answer, then check it.";
          match.messageTone = "bad";
          match.caption = "Alert tone. No answer selected.";
          playSound("error");
          render();
          return;
        }
        apply(FloodRules.submitAnswer(match, el.getAttribute("data-qid"), selected.value));
        return;
      }
      var table = {
        blueprint: function () { return FloodRules.chooseBlueprint(match, el.getAttribute("data-id")); },
        predict: function () { return FloodRules.predict(match, el.getAttribute("data-id")); },
        vehicle: function () { return FloodRules.selectVehicle(match, el.getAttribute("data-id")); },
        install: function () { return FloodRules.install(match, el.getAttribute("data-id")); },
        remove: function () { return FloodRules.removeSupport(match, el.getAttribute("data-id")); },
        test: function () { return FloodRules.runTest(match); },
        release: function () { return FloodRules.release(match); },
        split: function () { return FloodRules.splitLoad(match); },
        recombine: function () { return FloodRules.recombine(match); },
        wait: function () { return FloodRules.waitTurn(match); }
      };
      if (!table[action] || !match) return;
      apply(table[action]());
    } finally {
      busy = false;
    }
  }

  function route() {
    clearTimer();
    var parts = (window.location.hash || "#/").replace(/^#\/?/, "").split("/").filter(Boolean);
    if (!parts.length) {
      page = "home";
      match = null;
      render();
      return;
    }
    if (parts[0] === "course") {
      page = "course";
      match = null;
      render();
      return;
    }
    if (parts[0] === "guide") {
      page = "guide";
      match = null;
      render();
      return;
    }
    if (parts[0] === "play") {
      var id = Number(parts[1]);
      var mode = parts[2] === "practice" ? "practice" : "mission";
      if (!FloodLevels.getLevel(id)) {
        page = "home";
        match = null;
        render();
        return;
      }
      if (mode === "mission" && !FloodSave.unlocked(id)) {
        page = "locked";
        lockedId = id;
        match = null;
        render();
        return;
      }
      page = "play";
      match = FloodRules.createMatch(id, mode).state;
      render();
      return;
    }
    page = "home";
    match = null;
    render();
  }

  function mark(state, toast, bump) {
    state.toast = toast || "";
    state.bump = bump || "";
    match = state;
    render();
    playSound(toast || bump ? "fail" : "click");
  }

  function tryDrive(vehicleId) {
    if (!match || match.phase !== "play") return;
    if (vehicleId && vehicleId !== match.activeVehicleId) {
      var picked = FloodRules.selectVehicle(match, vehicleId);
      if (!picked.ok) { apply(picked); return; }
      picked.state.toast = "";
      picked.state.bump = "";
      match = picked.state;
      render();
      playSound("click");
      return;
    }
    var state = match;
    var level = FloodLevels.getLevel(state.levelId);
    if (!FloodRules.blueprint(state)) {
      mark(state, "先选桥", "");
      return;
    }
    var live = FloodRules.evaluateState(state, FloodRules.visualStage(state));
    if (!live || !live.passed) {
      mark(state, "", state.activeVehicleId);
      return;
    }
    if (level.turnMode === "budget" && state.turnsLeft < level.testCost + level.releaseCost) {
      mark(state, "来不及", state.activeVehicleId);
      return;
    }
    if (level.turnMode === "clock") {
      var afterTest = state.turn + level.testCost;
      var crossing = FloodModel.actionWindow(afterTest, level.releaseCost, level.floodTurn, level.deadlineTurn);
      if (crossing.tooLate) {
        apply(FloodRules.waitTurn(state));
        return;
      }
      if (crossing.straddles) {
        mark(state, "水要涨", state.activeVehicleId);
        return;
      }
    }
    if (level.requirePrediction && !state.tests.length && !state.prediction) {
      var guessed = FloodRules.predict(state, live.weakest.id);
      if (!guessed.ok) { apply(guessed); return; }
      state = guessed.state;
    }
    var tested = FloodRules.runTest(state);
    if (!tested.ok) { apply(tested); return; }
    state = tested.state;
    if (!state.lastTest.passed) {
      mark(state, "", state.activeVehicleId);
      return;
    }
    apply(FloodRules.release(state));
  }

  function actionFrom(target) {
    var node = target;
    if (node && node.nodeType !== 1) node = node.parentElement;
    if (!node || !node.closest) return null;
    return node.closest("[data-action]");
  }

  document.getElementById("app").addEventListener("click", function (event) {
    var el = actionFrom(event.target);
    if (!el) return;
    if (el.tagName !== "A") event.preventDefault();
    try {
      onActivate(el);
    } catch (error) {
      busy = false;
      if (match) {
        match.message = "That click did not finish. " + error.message;
        match.messageTone = "bad";
        render();
      }
    }
  });

  document.getElementById("app").addEventListener("keydown", function (event) {
    var el = actionFrom(event.target);
    if (!el || el.tagName === "BUTTON" || el.tagName === "A") return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onActivate(el);
  });

  window.addEventListener("hashchange", route);
  route();
})();
