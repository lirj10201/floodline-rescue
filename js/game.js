/* Hash routes and button actions. Resource changes go through the rules module. */
(function () {
  var page = "title";
  var match = null;
  var lockedId = 1;
  var storyStep = 0;
  var timer = null;
  var busy = false;
  var lastView = "";
  var aboutOpen = false;

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
    var viewKey = page + ":" + storyStep + ":" + (match ? match.levelId + ":" + match.mode : lockedId);
    var viewChanged = viewKey !== lastView;
    lastView = viewKey;
    root.innerHTML = FloodUI.render({
      page: page,
      match: match,
      progress: FloodSave.load(),
      lockedId: lockedId,
      story: storyStep,
      about: aboutOpen
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
    if (text.indexOf("kit") !== -1) return "Not enough materials.";
    if (text.indexOf("turn") !== -1 || text.indexOf("late") !== -1 || text.indexOf("closed") !== -1) return "No moves left.";
    if (text.indexOf("flood") !== -1 || text.indexOf("Flood") !== -1) return "The flood changed the supports.";
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
        match.freePlay = true;
        playSound("click");
        render();
        return;
      }
      if (action === "about") {
        aboutOpen = true;
        render();
        var closeAbout = document.querySelector("[data-focus=\"close-about\"]");
        if (closeAbout) closeAbout.focus();
        return;
      }
      if (action === "close-about") {
        aboutOpen = false;
        render();
        return;
      }
      if (action === "keep-about") return;
      if (action === "begin") {
        window.location.hash = "#/story/0";
        return;
      }
      if (action === "finish") {
        if (match && match.mode === "mission") FloodSave.complete(match.levelId);
        if (match && match.mode === "mission" && match.levelId === 1) window.location.hash = "#/story/3";
        else if (match && match.mode === "mission" && match.levelId === 2) window.location.hash = "#/story/4";
        else window.location.hash = "#/";
        return;
      }
      if (action === "pick") {
        if (!match || match.phase !== "play") return;
        var picked = FloodRules.selectVehicle(match, el.getAttribute("data-id"));
        if (!picked.ok) { apply(picked); return; }
        picked.state.toast = "";
        picked.state.bump = "";
        match = picked.state;
        render();
        playSound("click");
        return;
      }
      if (action === "drive") {
        tryDrive(el.getAttribute("data-id"));
        return;
      }
      if (action === "card") {
        if (!match) return;
        var cardId = el.getAttribute("data-id");
        match.openCard = match.openCard === cardId ? "" : cardId;
        render();
        return;
      }
      if (action === "flood") {
        if (!match) return;
        apply(FloodRules.raiseFlood(match));
        if (match && match.floodApplied) match.openCard = "temp";
        render();
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
    aboutOpen = false;
    var parts = (window.location.hash || "#/").replace(/^#\/?/, "").split("/").filter(Boolean);
    if (!parts.length) {
      page = "title";
      match = null;
      render();
      return;
    }
    if (parts[0] === "story") {
      page = "story";
      match = null;
      storyStep = Math.max(0, Math.min(4, Number(parts[1]) || 0));
      render();
      playSound(storyStep === 0 ? "radio" : "click");
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
        page = "title";
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
      match.freePlay = true;
      render();
      return;
    }
    page = "title";
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
      mark(state, "Pick a bridge first.", "");
      return;
    }
    var live = FloodRules.evaluateState(state, FloodRules.visualStage(state));
    if (!live || !live.passed) {
      mark(state, "", state.activeVehicleId);
      return;
    }
    if (!state.freePlay && level.turnMode === "budget" && state.turnsLeft < level.testCost + level.releaseCost) {
      mark(state, "No moves left.", state.activeVehicleId);
      return;
    }
    if (!state.freePlay && level.turnMode === "clock") {
      var afterTest = state.turn + level.testCost;
      var crossing = FloodModel.actionWindow(afterTest, level.releaseCost, level.floodTurn, level.deadlineTurn);
      if (crossing.tooLate) {
        apply(FloodRules.waitTurn(state));
        return;
      }
      if (crossing.straddles) {
        mark(state, "The flood would hit while this vehicle is still crossing.", state.activeVehicleId);
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

  var drag = null;
  var dragMoved = false;
  var suppressClick = false;

  function spanWord(id) {
    if (id === "west") return "west";
    if (id === "center") return "center";
    return "east";
  }

  document.addEventListener("pointerdown", function (event) {
    var node = event.target;
    if (node && node.nodeType !== 1) node = node.parentElement;
    var el = node && node.closest ? node.closest("[data-drag]") : null;
    if (!el || !match || match.phase !== "play") return;
    drag = {
      kind: el.getAttribute("data-drag"),
      id: el.getAttribute("data-id") || "",
      section: el.getAttribute("data-section") || "",
      add: el.getAttribute("data-add") || "",
      x: event.clientX,
      y: event.clientY
    };
    dragMoved = false;
  });

  document.addEventListener("pointermove", function (event) {
    if (!drag) return;
    if (Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y) > 8) dragMoved = true;
    if (!dragMoved) return;
    var ghost = document.getElementById("drag-ghost");
    if (!ghost) {
      ghost = document.createElement("div");
      ghost.id = "drag-ghost";
      document.body.appendChild(ghost);
    }
    var gain = drag.add ? "+" + drag.add : "Material";
    if (drag.kind === "support") {
      var under = document.elementFromPoint(event.clientX, event.clientY);
      if (under && under.nodeType !== 1) under = under.parentElement;
      var zone = under && under.closest ? under.closest("[data-section]") : null;
      var section = zone ? zone.getAttribute("data-section") : "";
      gain = section && section !== drag.section ? "Not this span" : "+" + drag.add;
    }
    ghost.textContent = drag.kind === "flood" ? "Flood" : drag.kind === "vehicle" ? "Vehicle" : gain;
    ghost.style.left = event.clientX + "px";
    ghost.style.top = event.clientY + "px";
  });

  document.addEventListener("pointerup", function (event) {
    if (!drag) return;
    var info = drag;
    var moved = dragMoved;
    drag = null;
    var ghost = document.getElementById("drag-ghost");
    if (ghost) ghost.remove();
    if (!moved || !match || match.phase !== "play") return;
    suppressClick = true;
    var under = document.elementFromPoint(event.clientX, event.clientY);
    if (under && under.nodeType !== 1) under = under.parentElement;
    var zone = under && under.closest ? under.closest("[data-drop]") : null;
    if (!zone) return;
    var where = zone.getAttribute("data-drop");
    var section = zone.getAttribute("data-section");
    if (info.kind === "support") {
      if (where !== "span") return;
      if (section !== info.section) {
        match.openCard = "local";
        match.toast = "This post only adds strength on the " + spanWord(info.section) + " span.";
        render();
        playSound("error");
        return;
      }
      apply(FloodRules.install(match, info.id));
      return;
    }
    if (info.kind === "vehicle" && (where === "span" || where === "bridge")) {
      tryDrive(info.id);
      return;
    }
    if (info.kind === "flood" && (where === "river" || where === "span")) {
      apply(FloodRules.raiseFlood(match));
      if (match && match.floodApplied) match.openCard = "temp";
      render();
    }
  });

  document.getElementById("app").addEventListener("click", function (event) {
    if (suppressClick) {
      suppressClick = false;
      event.preventDefault();
      return;
    }
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
    if (event.key === "Escape" && aboutOpen) {
      aboutOpen = false;
      render();
      return;
    }
    var el = actionFrom(event.target);
    if (!el || el.tagName === "BUTTON" || el.tagName === "A") return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onActivate(el);
  });

  window.addEventListener("hashchange", route);
  route();
})();
