/* Hash routes and button actions. Resource changes go through the rules module. */
(function () {
  var page = "title";
  var match = null;
  var lockedId = 1;
  var storyStep = 0;
  var introStep = 0;
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
    var viewKey = page + ":" + storyStep + ":" + introStep + ":" + (match ? match.levelId + ":" + match.mode : lockedId);
    var viewChanged = viewKey !== lastView;
    lastView = viewKey;
    root.innerHTML = FloodUI.render({
      page: page,
      match: match,
      progress: FloodSave.load(),
      lockedId: lockedId,
      story: storyStep,
      intro: introStep,
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
        match.build = FloodBuild.create(match.levelId === 4 ? { deck: true } : null);
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
      if (action === "build-hint") {
        if (!match) return;
        match.showHint = !match.showHint;
        match.toast = "";
        render();
        playSound("click");
        return;
      }
      if (action === "build-solve") {
        if (!match || match.phase !== "play") return;
        match.build = FloodBuild.solution(match.levelId);
        match.showHint = false;
        match.toast = match.levelId === 3
          ? "These stone posts can hold the bus. Press Flood, then Send."
          : match.levelId === 2
            ? "This arch carries the truck to the two banks. Press Send."
            : match.levelId === 4
              ? "The triangles are under the parts that need them. Press Send."
              : "This bridge can hold the vehicle. You can still move the posts. Press Send.";
        render();
        playSound("click");
        return;
      }
      if (action === "build-flood") {
        if (!match || !match.build || match.phase !== "play") return;
        match.build = FloodBuild.flood(match.build);
        match.toast = match.build.notice || "";
        render();
        playSound("click");
        return;
      }
      if (action === "build-remove-arch") {
        if (!match || !match.build) return;
        match.build = FloodBuild.removeArch(match.build, el.getAttribute("data-id"));
        match.toast = "";
        render();
        playSound("click");
        return;
      }
      if (action === "build-remove-truss") {
        if (!match || !match.build) return;
        match.build = FloodBuild.removeTruss(match.build, el.getAttribute("data-id"));
        match.toast = "";
        render();
        playSound("click");
        return;
      }
      if (action === "build-remove-plank") {
        if (!match || !match.build) return;
        match.build = FloodBuild.uncover(match.build, el.getAttribute("data-from"), el.getAttribute("data-to"));
        match.toast = "";
        render();
        playSound("click");
        return;
      }
      if (action === "build-send") {
        if (!match || !match.build || match.phase !== "play") return;
        var builtLevel = FloodLevels.getLevel(match.levelId);
        var builtVan = match.levelId === 3
          ? builtLevel.vehicles.filter(function (item) { return item.id === "bus"; })[0]
          : builtLevel.vehicles[0];
        if (match.levelId === 3 && !match.build.flooded) {
          match.toast = "Press Flood first. Wood posts may still be holding the bus.";
          render();
          playSound("error");
          return;
        }
        var built = FloodBuild.evaluate(match.build, builtVan.demands);
        if (!built.passed) {
          match.toast = "The bridge cannot hold this vehicle yet.";
          render();
          playSound("error");
          return;
        }
        match.phase = "animating";
        match.releaseVehicleId = builtVan.id;
        match.toast = "";
        render();
        playSound("release");
        clearTimer();
        timer = window.setTimeout(function () {
          timer = null;
          if (!match || match.phase !== "animating") return;
          if (match.mode === "mission") FloodSave.complete(match.levelId);
          match.phase = "report";
          match.releaseVehicleId = null;
          render();
          playSound("success");
        }, reducedMotion() ? 700 : 2300);
        return;
      }
      if (action === "begin") {
        window.location.hash = "#/levels";
        return;
      }
      if (action === "intro-next") {
        window.location.hash = "#/intro/" + (introStep + 1);
        return;
      }
      if (action === "finish") {
        if (match && match.mode === "mission") FloodSave.complete(match.levelId);
        if (match && match.mode === "mission" && match.levelId === 1) window.location.hash = "#/intro/5";
        else if (match && match.mode === "mission" && match.levelId === 2) window.location.hash = "#/intro/6";
        else if (match && match.mode === "mission" && match.levelId === 3) window.location.hash = "#/intro/8";
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
    if (parts[0] === "levels") {
      page = "levels";
      match = null;
      render();
      return;
    }
    if (parts[0] === "intro") {
      page = "intro";
      match = null;
      introStep = Math.max(0, Math.min(8, Number(parts[1]) || 0));
      render();
      playSound(introStep === 0 ? "radio" : "click");
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
      page = "play";
      match = FloodRules.createMatch(id, mode).state;
      match.freePlay = true;
      match.build = FloodBuild.create(match.levelId === 4 ? { deck: true } : null);
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

  function svgPoint(event) {
    var svg = document.querySelector(".scene");
    if (!svg || !svg.createSVGPoint) return null;
    var point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    var matrix = svg.getScreenCTM();
    if (!matrix) return null;
    return point.matrixTransform(matrix.inverse());
  }

  function clearRubber() {
    var line = document.getElementById("build-rubber");
    var label = document.getElementById("build-rubber-label");
    if (line) line.remove();
    if (label) label.remove();
  }

  function pieceMarkup(kind) {
    if (kind === "build-plank") {
      return "<svg class=\"piece-icon plank\" viewBox=\"0 0 72 16\" aria-hidden=\"true\"><rect x=\"1\" y=\"1\" width=\"70\" height=\"14\" fill=\"#2f6f4e\" stroke=\"#1b1712\" stroke-width=\"2\"></rect></svg>";
    }
    if (kind === "build-arch") {
      return "<svg class=\"piece-icon arch\" viewBox=\"0 0 72 28\" aria-hidden=\"true\"><path d=\"M4 24 Q36 2 68 24\" fill=\"none\" stroke=\"#2f6f4e\" stroke-width=\"4\"></path></svg>";
    }
    if (kind === "build-truss") {
      return "<svg class=\"piece-icon\" viewBox=\"0 0 48 40\" aria-hidden=\"true\"><path d=\"M6 36 L24 8 L42 36 Z\" fill=\"none\" stroke=\"#1b1712\" stroke-width=\"3\"></path></svg>";
    }
    var fill = kind === "stone" ? "#3e4c57" : "#6b5436";
    return "<svg class=\"piece-icon\" viewBox=\"0 0 24 78\" aria-hidden=\"true\"><rect x=\"1\" y=\"1\" width=\"22\" height=\"76\" fill=\"" + fill + "\" stroke=\"#1b1712\" stroke-width=\"2\"></rect></svg>";
  }

  function showArch(x1, x2, rise, text) {
    var svg = document.querySelector(".scene");
    if (!svg) return;
    var path = document.getElementById("build-arch-rubber");
    var label = document.getElementById("build-arch-label");
    if (!path) {
      path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.id = "build-arch-rubber";
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#2f6f4e");
      path.setAttribute("stroke-width", "14");
      path.setAttribute("pointer-events", "none");
      svg.appendChild(path);
      label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.id = "build-arch-label";
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "16");
      label.setAttribute("font-weight", "700");
      label.setAttribute("fill", "#1b1712");
      label.setAttribute("pointer-events", "none");
      svg.appendChild(label);
    }
    var left = Math.min(x1, x2);
    var right = Math.max(x1, x2);
    var mid = (left + right) / 2;
    var y = FloodBuild.deckY;
    path.setAttribute("d", "M" + left + " " + y + " Q" + mid + " " + (y - rise) + " " + right + " " + y);
    label.setAttribute("x", mid);
    label.setAttribute("y", y - rise - 8);
    label.textContent = text;
  }

  function clearArch() {
    var path = document.getElementById("build-arch-rubber");
    var label = document.getElementById("build-arch-label");
    if (path) path.remove();
    if (label) label.remove();
  }

  function showRubber(x1, x2, text) {
    var svg = document.querySelector(".scene");
    if (!svg) return;
    var bar = document.getElementById("build-rubber");
    var label = document.getElementById("build-rubber-label");
    if (!bar) {
      bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bar.id = "build-rubber";
      bar.setAttribute("y", "168");
      bar.setAttribute("height", "16");
      bar.setAttribute("fill", "#2f6f4e");
      bar.setAttribute("stroke", "#1b1712");
      bar.setAttribute("pointer-events", "none");
      svg.appendChild(bar);
      label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.id = "build-rubber-label";
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "16");
      label.setAttribute("font-weight", "700");
      label.setAttribute("fill", "#1b1712");
      label.setAttribute("pointer-events", "none");
      svg.appendChild(label);
    }
    var left = Math.min(x1, x2);
    var width = Math.max(8, Math.abs(x2 - x1));
    bar.setAttribute("x", left);
    bar.setAttribute("width", width);
    label.setAttribute("x", left + width / 2);
    label.setAttribute("y", "158");
    label.textContent = text;
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
      material: el.getAttribute("data-material") || "",
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
    if (drag.kind === "build-post" || drag.kind === "move-post" || drag.kind === "build-plank" || drag.kind === "build-arch" || drag.kind === "build-truss") {
      var point = svgPoint(event);
      var caption = "";
      ghost.className = "piece-ghost";
      if (drag.kind === "build-arch" && point && match && match.build) {
        var archNear = FloodBuild.nearest(match.build, point.x, 72);
        if (!drag.anchor && archNear) drag.anchor = archNear;
        var archEnd = FloodBuild.nearest(match.build, point.x, 72);
        var archX = point.x;
        if (drag.anchor && archEnd && archEnd.id !== drag.anchor.id) archX = archEnd.x;
        var rise = Math.max(16, Math.min(110, FloodBuild.deckY - point.y));
        if (drag.anchor) {
          caption = "strength " + FloodBuild.archStrength(Math.abs(archX - drag.anchor.x), rise);
          showArch(drag.anchor.x, archX, rise, caption);
        }
        ghost.innerHTML = pieceMarkup("build-arch") + (caption ? "<b>" + caption + "</b>" : "");
        ghost.style.left = event.clientX + "px";
        ghost.style.top = event.clientY + "px";
        return;
      }
      if (drag.kind === "build-truss") {
        ghost.innerHTML = pieceMarkup("build-truss");
        ghost.style.left = event.clientX + "px";
        ghost.style.top = event.clientY + "px";
        return;
      }
      if (drag.kind === "build-plank" && point && match && match.build) {
        var near = FloodBuild.nearest(match.build, point.x, 72);
        if (!drag.anchor && near) drag.anchor = near;
        var endX = point.x;
        if (drag.anchor) {
          var end = FloodBuild.nearest(match.build, point.x, 72);
          if (end && end.id !== drag.anchor.id) endX = end.x;
          caption = "strength " + FloodBuild.strength(Math.abs(endX - drag.anchor.x));
          showRubber(drag.anchor.x, endX, caption);
        }
      }
      ghost.innerHTML = pieceMarkup(drag.material === "stone" ? "stone" : drag.kind) + (caption ? "<b>" + caption + "</b>" : "");
      ghost.style.left = event.clientX + "px";
      ghost.style.top = event.clientY + "px";
      return;
    }
    ghost.className = "";
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
    clearRubber();
    clearArch();
    if (!moved || !match || match.phase !== "play") return;
    suppressClick = true;
    if (info.kind === "build-post" || info.kind === "move-post" || info.kind === "build-plank" || info.kind === "build-arch" || info.kind === "build-truss") {
      var dropped = svgPoint(event);
      if (!dropped || !match.build) return;
      if (info.kind === "build-post") match.build = FloodBuild.addPost(match.build, dropped.x, dropped.y, info.material);
      else if (info.kind === "move-post") match.build = FloodBuild.movePost(match.build, info.id, dropped.x, dropped.y);
      else if (info.kind === "build-arch") {
        var archEnd = FloodBuild.nearest(match.build, dropped.x, 72);
        if (info.anchor && archEnd && archEnd.id !== info.anchor.id) {
          match.build = FloodBuild.addArch(match.build, info.anchor.id, archEnd.id, FloodBuild.deckY - dropped.y);
        } else match.build = FloodBuild.note(match.build, "Drag the arch from one bank to the other, and pull the crown up.");
      } else if (info.kind === "build-truss") {
        var trussZone = dropped.y >= 90 && dropped.y <= 320 ? FloodBuild.zoneAt(dropped.x) : "";
        match.build = trussZone ? FloodBuild.addTruss(match.build, trussZone) : FloodBuild.note(match.build, "Drop the triangle on west, center, or east.");
      } else {
        var endJoint = FloodBuild.nearest(match.build, dropped.x, 72);
        if (info.anchor && endJoint && endJoint.id !== info.anchor.id) {
          match.build = FloodBuild.addPlank(match.build, info.anchor.id, endJoint.id);
        } else match.build = FloodBuild.note(match.build, "Drag the plank from one support to another.");
      }
      match.toast = match.build.notice || "";
      render();
      playSound(match.toast ? "error" : "click");
      return;
    }
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
