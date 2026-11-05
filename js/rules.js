/* Game rules. Mutates a clone and returns it so a failed action cannot spend resources. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./model"), require("./levels"));
  } else {
    root.FloodRules = factory(root.FloodModel, root.FloodLevels);
  }
})(typeof self !== "undefined" ? self : this, function (Model, Levels) {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function fail(error) {
    return { ok: false, error: error };
  }

  function ok(state, sound, caption) {
    if (caption) state.caption = caption;
    return { ok: true, state: state, sound: sound || "click" };
  }

  function levelOf(state) {
    return Levels.getLevel(state.levelId);
  }

  function blueprint(state) {
    var level = levelOf(state);
    if (!level || !state.blueprintId) return null;
    var found = null;
    level.blueprints.forEach(function (item) {
      if (item.id === state.blueprintId) found = item;
    });
    return found;
  }

  function supportById(state, id) {
    var plan = blueprint(state);
    if (!plan) return null;
    var found = null;
    plan.supports.forEach(function (support) {
      if (support.id === id) found = support;
    });
    return found;
  }

  function vehicleById(state, id) {
    var found = null;
    state.vehicles.forEach(function (vehicle) {
      if (vehicle.id === id) found = vehicle;
    });
    return found;
  }

  function activeVehicle(state) {
    return vehicleById(state, state.activeVehicleId);
  }

  function waitingVehicles(state) {
    return state.vehicles.filter(function (vehicle) { return vehicle.status === "waiting"; });
  }

  function currentStage(state) {
    var level = levelOf(state);
    if (!level || level.turnMode !== "clock") return "calm";
    return Model.stageAt(state.turn, level.floodTurn);
  }

  function visualStage(state) {
    if (state.phase === "animating" && state.animStage) return state.animStage;
    return currentStage(state);
  }

  function namesOf(level) {
    var names = {};
    level.sections.forEach(function (section) { names[section.id] = section.name; });
    return names;
  }

  function evaluateState(state, stage) {
    var level = levelOf(state);
    var plan = blueprint(state);
    var vehicle = activeVehicle(state);
    if (!level || !plan || !vehicle) return null;
    var caps = Model.capacities(plan.supports, state.installed, stage || currentStage(state));
    return Model.evaluate(vehicle.demands, caps, namesOf(level));
  }

  function currentSignature(state) {
    return Model.signature({
      blueprintId: state.blueprintId,
      installed: state.installed,
      vehicleId: state.activeVehicleId,
      stage: currentStage(state)
    });
  }

  function testIsFresh(state) {
    return !!(state.lastTest &&
      state.lastTest.passed &&
      state.lastTest.vehicleId === state.activeVehicleId &&
      state.lastTest.signature === currentSignature(state));
  }

  function syncFlood(state) {
    var level = levelOf(state);
    if (!level || level.floodTurn == null || state.turn < level.floodTurn || state.floodApplied) return;
    var lost = [];
    state.installed = state.installed.filter(function (id) {
      var support = supportById(state, id);
      if (support && support.temporary) {
        lost.push(support.name);
        return false;
      }
      return true;
    });
    state.floodApplied = true;
    state.floodLost = lost;
  }

  function assertResources(state) {
    if (state.materials < 0) throw new Error("Materials went negative.");
    if (state.turnsLeft < 0) throw new Error("Turns went negative.");
  }

  function pushLog(state, label, startTurn) {
    state.log.push({
      label: label,
      turn: startTurn,
      materials: state.materials,
      turnsLeft: state.turnsLeft,
      clock: state.turn
    });
  }

  function busy(state) {
    if (state.phase === "animating") return "Wait for the vehicle to finish crossing.";
    if (state.phase === "fail" || state.phase === "report") return "This run is already closed.";
    return "";
  }

  function checkPay(state, turns, materials) {
    var level = levelOf(state);
    if (state.freePlay) {
      if (materials > state.materials) {
        return { error: "Not enough kits. This action needs " + materials + " and you have " + state.materials + "." };
      }
      return null;
    }
    if (materials > state.materials) {
      return { error: "Not enough kits. This action needs " + materials + " and you have " + state.materials + "." };
    }
    if (level.turnMode === "budget") {
      if (turns > state.turnsLeft) {
        return { error: "Not enough action turns. This action needs " + turns + " and you have " + state.turnsLeft + "." };
      }
      return null;
    }
    if (turns === 0 && materials === 0) return null;
    var window = Model.actionWindow(state.turn, turns, level.floodTurn, level.deadlineTurn);
    if (window.straddles) return { error: straddleText(window, level) };
    if (window.tooLate || state.turn >= level.deadlineTurn) return { closed: true };
    return null;
  }

  function applyPay(state, turns, materials, label) {
    var level = levelOf(state);
    var spent = Model.spend(state.materials, materials);
    if (!spent.ok) throw new Error(spent.error);
    state.materials = spent.value;
    if (state.freePlay) {
      assertResources(state);
      pushLog(state, label, state.turn);
      return;
    }
    if (level.turnMode === "budget") {
      var turnsSpent = Model.spend(state.turnsLeft, turns);
      if (!turnsSpent.ok) throw new Error(turnsSpent.error);
      state.turnsLeft = turnsSpent.value;
      state.turnsSpent += turns;
      assertResources(state);
      pushLog(state, label, state.turnsSpent);
      return;
    }
    if (turns === 0 && materials === 0) {
      pushLog(state, label, state.turn);
      return;
    }
    var window = Model.actionWindow(state.turn, turns, level.floodTurn, level.deadlineTurn);
    state.turn = window.next;
    state.turnsSpent += turns;
    if (state.phase !== "animating") syncFlood(state);
    assertResources(state);
    pushLog(state, label, window.start);
    if (state.phase !== "animating" && state.turn >= level.deadlineTurn && waitingVehicles(state).length) {
      closeForTime(state);
    }
  }

  function rejectPay(next, problem) {
    if (!problem) return null;
    if (problem.closed) {
      closeForTime(next);
      next.caption = "Alert tone. Evacuation time is over.";
      return ok(next, "error", next.caption);
    }
    return fail(problem.error);
  }

  function straddleText(window, level) {
    return "This action would use turns " + window.start + "–" + window.end + ". The flood arrives at the start of turn " + level.floodTurn + " and changes the supports during the action. Choose an action that finishes by turn " + (level.floodTurn - 1) + " or starts on turn " + level.floodTurn + " or later.";
  }

  function closeForTime(state) {
    var level = levelOf(state);
    var names = waitingVehicles(state).map(function (vehicle) { return vehicle.name; }).join(", ");
    var reason = "Evacuation closed at the start of turn " + level.deadlineTurn + ". Still waiting: " + (names || "none") + ".";
    if (state.floodApplied) {
      reason += " From turn " + level.floodTurn + " on, the temporary center bent and any temporary brace add no capacity.";
    }
    var passedBefore = state.tests.filter(function (test) { return test.passed && test.stage === "calm"; })[0];
    if (passedBefore && state.floodApplied) {
      reason += " A test of the " + passedBefore.vehicleName + " had passed before the flood. That result expired when the supports changed.";
    }
    var reading = evaluateState(state, "flood");
    if (reading) {
      var worst = reading.weakest;
      reason += " Current " + worst.name + ": demand " + worst.demand + ", capacity " + worst.capacity + ".";
    }
    state.phase = "fail";
    state.failReason = reason;
    state.message = reason;
    state.messageTone = "bad";
  }

  function createMatch(levelId, mode) {
    var level = Levels.getLevel(levelId);
    if (!level) return fail("Unknown level.");
    var vehicles = level.vehicles.map(function (vehicle) {
      return {
        id: vehicle.id,
        name: vehicle.name,
        load: vehicle.load,
        demands: vehicle.demands,
        note: vehicle.note,
        status: "waiting"
      };
    });
    var state = {
      levelId: level.id,
      mode: mode === "practice" ? "practice" : "mission",
      phase: "play",
      blueprintId: level.blueprints.length === 1 ? level.blueprints[0].id : null,
      blueprintPicks: level.blueprints.length === 1 ? 1 : 0,
      installed: [],
      vehicles: vehicles,
      activeVehicleId: vehicles[0].id,
      materials: level.materials,
      startMaterials: level.materials,
      turnsLeft: level.turnMode === "budget" ? level.budget : 0,
      turnsSpent: 0,
      turn: 1,
      floodApplied: false,
      floodLost: [],
      prediction: null,
      predictionBlueprint: null,
      predictionNote: "",
      tests: [],
      lastTest: null,
      pendingSupportId: null,
      log: [],
      answers: {},
      message: level.blueprints.length > 1
        ? "First click: choose Timber trestle or Steel girder. Those buttons are at the top of the panel."
        : "Use the buttons at the top of the panel. Grey buttons still explain why they are waiting.",
      messageTone: "info",
      caption: "Radio briefing is on screen. Sound plays only after you press Play radio.",
      releaseVehicleId: null,
      animStage: null,
      failReason: "",
      splitOpen: false
    };
    return ok(state, null, state.caption);
  }

  function chooseBlueprint(state, blueprintId) {
    var next = clone(state);
    var block = busy(next);
    if (block) return fail(block);
    var level = levelOf(next);
    var plan = null;
    level.blueprints.forEach(function (item) {
      if (item.id === blueprintId) plan = item;
    });
    if (!plan) return fail("That bridge plan is not on this mission.");
    if (next.blueprintId === blueprintId) return ok(next, "click", next.caption);

    var switching = next.blueprintPicks > 0;
    if (switching) {
      var rejected = rejectPay(next, checkPay(next, 1, 0));
      if (rejected) return rejected;
      next.installed.forEach(function (id) {
        var support = supportById(next, id);
        if (support && !support.builtIn) {
          var back = Model.refund(next.materials, support.material);
          if (!back.ok) return;
          next.materials = back.value;
        }
      });
      applyPay(next, 1, 0, "Switch to " + plan.name);
      if (next.phase === "fail") return ok(next, "error", next.caption);
    }

    next.blueprintId = plan.id;
    next.blueprintPicks += 1;
    next.installed = [];
    next.pendingSupportId = null;
    if (!next.tests.length) {
      next.prediction = null;
      next.predictionBlueprint = null;
    }
    Object.keys(next.answers).forEach(function (key) {
      if (next.answers[key].forSignature) delete next.answers[key];
    });
    if (!switching) pushLog(next, "Choose " + plan.name, next.turn);
    next.message = plan.name + " is the working plan. " + plan.detail;
    next.messageTone = "info";
    next.caption = "Click. " + plan.name + " selected.";
    assertResources(next);
    return ok(next, "click", next.caption);
  }

  function predict(state, sectionId) {
    var next = clone(state);
    var block = busy(next);
    if (block) return fail(block);
    var level = levelOf(next);
    if (!level.requirePrediction) return fail("This mission does not ask for a prediction.");
    if (next.tests.length) return fail("The prediction is locked. It was recorded with the first test.");
    if (!next.blueprintId) return fail("Choose a bridge plan before you mark a weak point.");
    var section = null;
    level.sections.forEach(function (item) {
      if (item.id === sectionId) section = item;
    });
    if (!section) return fail("That is not a section on this bridge.");
    next.prediction = section.id;
    next.predictionBlueprint = next.blueprintId;
    next.message = "Prediction marked: " + section.name + ". You can run the first test.";
    next.messageTone = "info";
    next.caption = "Click. Predicted weak point: " + section.name + ".";
    return ok(next, "click", next.caption);
  }

  function selectVehicle(state, vehicleId) {
    var next = clone(state);
    var block = busy(next);
    if (block) return fail(block);
    var vehicle = vehicleById(next, vehicleId);
    if (!vehicle) return fail("That vehicle is not on this mission.");
    if (vehicle.status !== "waiting") return fail(vehicle.name + " has already crossed.");
    next.activeVehicleId = vehicle.id;
    next.message = vehicle.name + " is selected. " + vehicle.note;
    next.messageTone = "info";
    next.caption = "Click. Selected " + vehicle.name + ".";
    return ok(next, "click", next.caption);
  }

  function feedbackFor(result, support) {
    var over = result.sections.filter(function (section) {
      return section.demand > section.capacity;
    });
    if (!over.length) {
      var busySection = result.weakest;
      return "Every section is at or below capacity. The highest utilization is the " + busySection.name + ": " + busySection.demand + " load units on a capacity of " + busySection.capacity + ".";
    }
    over.sort(function (a, b) { return b.util - a.util; });
    var top = over[0];
    var text = "The " + top.name + " carried " + top.demand + " load units, but its capacity was " + top.capacity + ".";
    if (support && !(support.capacity[top.id] > 0)) {
      text += " Reinforcing the " + support.shortName + " did not increase capacity at the " + top.name + ".";
    } else if (support && support.capacity[top.id] > 0) {
      text += " The " + support.shortName + " added capacity there, and demand is still higher.";
    }
    if (over.length > 1) {
      var rest = over.slice(1).map(function (section) {
        return section.name + " (" + section.demand + "/" + section.capacity + ")";
      }).join(", ");
      text += " Also over capacity: " + rest + ".";
    }
    return text;
  }

  function predictionSentence(state, result) {
    if (!state.prediction) return "";
    var level = levelOf(state);
    var predicted = null;
    level.sections.forEach(function (section) {
      if (section.id === state.prediction) predicted = section;
    });
    var actual = result.weakest;
    var actualLine = "The " + actual.name + " carried " + actual.demand + " load units; capacity was " + actual.capacity + " (" + Model.percent(actual.demand, actual.capacity) + ").";
    if (state.prediction === actual.id) {
      return "You predicted the " + predicted.name + ". The test agrees: it has the highest utilization. " + actualLine;
    }
    return "You predicted the " + predicted.name + ". The busiest section was the " + actual.name + ". " + actualLine;
  }

  function runTest(state) {
    var next = clone(state);
    var block = busy(next);
    if (block) return fail(block);
    if (!next.blueprintId) return fail("Choose a bridge plan before you test.");
    var vehicle = activeVehicle(next);
    if (!vehicle || vehicle.status !== "waiting") return fail("Select a vehicle that is still waiting.");
    var level = levelOf(next);
    if (level.requirePrediction && !next.tests.length && !next.prediction) {
      return fail("Mark a predicted weak point before the first test.");
    }
    var stage = currentStage(next);
    var started = next.turn;
    var installedDuring = next.installed.slice();
    var result = evaluateState(next, stage);
    var support = next.pendingSupportId ? supportById(next, next.pendingSupportId) : null;
    var rejected = rejectPay(next, checkPay(next, level.testCost, 0));
    if (rejected) return rejected;
    var floodBefore = next.floodApplied;
    applyPay(next, level.testCost, 0, "Test " + vehicle.name);
    if (next.phase === "fail") return ok(next, "error", next.caption);

    var note = feedbackFor(result, support);
    if (!floodBefore && next.floodApplied) {
      note += " The action ended as the flood arrived, so this test no longer applies.";
    }
    var compare = "";
    if (level.requirePrediction && next.tests.length === 0) compare = predictionSentence(next, result);
    var record = {
      signature: Model.signature({
        blueprintId: next.blueprintId,
        installed: installedDuring,
        vehicleId: vehicle.id,
        stage: stage
      }),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      blueprintId: next.blueprintId,
      stage: stage,
      turn: started,
      passed: result.passed,
      weakestId: result.weakest.id,
      sections: result.sections.map(function (section) {
        return {
          id: section.id,
          name: section.name,
          demand: section.demand,
          capacity: section.capacity,
          status: section.status
        };
      }),
      note: note,
      compare: compare,
      prediction: next.prediction
    };
    next.tests.push(record);
    next.lastTest = record;
    next.pendingSupportId = null;
    if (compare) next.predictionNote = compare;
    next.message = (compare ? compare + " " : "") + note;
    next.messageTone = result.passed ? "good" : "bad";
    next.caption = result.passed ? "Pass tone. The test passed." : "Alert tone: overload. The test failed.";
    return ok(next, result.passed ? "pass" : "fail", next.caption);
  }

  function install(state, supportId) {
    var next = clone(state);
    var block = busy(next);
    if (block) return fail(block);
    var support = supportById(next, supportId);
    if (!support || support.builtIn) return fail("That part is not an optional support.");
    if (next.installed.indexOf(support.id) !== -1) return fail(support.name + " is already installed.");
    if (support.temporary && currentStage(next) === "flood") {
      return fail("The flood has already removed temporary works. Build a permanent support instead.");
    }
    var rejected = rejectPay(next, checkPay(next, support.turns, support.material));
    if (rejected) return rejected;
    next.installed.push(support.id);
    next.pendingSupportId = support.id;
    applyPay(next, support.turns, support.material, "Install " + support.name);
    if (next.phase === "fail") return ok(next, "error", next.caption);
    if (next.installed.indexOf(support.id) === -1) {
      next.pendingSupportId = null;
      next.message = support.name + " was built as the flood arrived, then washed away. The kit is not returned. Earlier tests no longer apply.";
      next.messageTone = "bad";
      next.caption = "Flood tone. Temporary work washed away. Kit not returned.";
      return ok(next, "flood", next.caption);
    }
    next.message = support.name + " installed. " + (support.detail || "") + " The previous test no longer applies.";
    next.messageTone = "info";
    next.caption = "Build tone. " + support.name + " installed. Previous test expired.";
    assertResources(next);
    return ok(next, "build", next.caption);
  }

  function removeSupport(state, supportId) {
    var next = clone(state);
    var block = busy(next);
    if (block) return fail(block);
    var support = supportById(next, supportId);
    if (!support || support.builtIn) return fail("That part cannot be removed.");
    if (next.installed.indexOf(support.id) === -1) return fail(support.name + " is not installed.");
    var rejected = rejectPay(next, checkPay(next, support.turns, 0));
    if (rejected) return rejected;
    next.installed = next.installed.filter(function (id) { return id !== support.id; });
    var back = Model.refund(next.materials, support.material);
    if (!back.ok) return fail(back.error);
    next.materials = back.value;
    applyPay(next, support.turns, 0, "Remove " + support.name);
    if (next.phase === "fail") return ok(next, "error", next.caption);
    if (next.pendingSupportId === support.id) next.pendingSupportId = null;
    next.message = support.name + " removed. " + support.material + " kit(s) returned. The previous test no longer applies.";
    next.messageTone = "info";
    next.caption = "Click. " + support.name + " removed. Kit returned. Previous test expired.";
    assertResources(next);
    return ok(next, "click", next.caption);
  }

  function splitLoad(state) {
    var next = clone(state);
    var block = busy(next);
    if (block) return fail(block);
    var level = levelOf(next);
    if (!level.split || next.splitOpen) return fail("The cargo is already split.");
    var heavy = vehicleById(next, level.split.from);
    if (!heavy || heavy.status !== "waiting") return fail("The full truck is no longer waiting, so the cargo cannot be split.");
    var rejected = rejectPay(next, checkPay(next, 1, 0));
    if (rejected) return rejected;
    applyPay(next, 1, 0, "Split the supply load");
    if (next.phase === "fail") return ok(next, "error", next.caption);
    next.vehicles = next.vehicles.filter(function (vehicle) { return vehicle.id !== heavy.id; });
    level.split.parts.forEach(function (part) {
      next.vehicles.push({
        id: part.id,
        name: part.name,
        load: part.load,
        demands: part.demands,
        note: part.note,
        status: "waiting"
      });
    });
    next.activeVehicleId = level.split.parts[0].id;
    next.splitOpen = true;
    next.message = "Cargo split. Supply A and Supply B each demand 8 load units at the center span. Test each truck before you send it. The previous test no longer applies.";
    next.messageTone = "info";
    next.caption = "Click. Cargo split into two trucks.";
    return ok(next, "click", next.caption);
  }

  function recombine(state) {
    var next = clone(state);
    var block = busy(next);
    if (block) return fail(block);
    var level = levelOf(next);
    if (!level.split || !next.splitOpen) return fail("The cargo is not split.");
    var released = next.vehicles.some(function (vehicle) {
      return vehicle.status === "released" && level.split.parts.some(function (part) { return part.id === vehicle.id; });
    });
    if (released) return fail("A split truck has already crossed. You cannot recombine.");
    var rejected = rejectPay(next, checkPay(next, 1, 0));
    if (rejected) return rejected;
    applyPay(next, 1, 0, "Recombine the supply load");
    if (next.phase === "fail") return ok(next, "error", next.caption);
    var heavy = level.vehicles[0];
    next.vehicles = [{
      id: heavy.id,
      name: heavy.name,
      load: heavy.load,
      demands: heavy.demands,
      note: heavy.note,
      status: "waiting"
    }];
    next.activeVehicleId = heavy.id;
    next.splitOpen = false;
    next.message = "Cargo recombined into one supply truck. Center demand is 14 again. The previous test no longer applies.";
    next.messageTone = "info";
    next.caption = "Click. Cargo recombined. Previous test expired.";
    return ok(next, "click", next.caption);
  }

  function waitTurn(state) {
    var next = clone(state);
    var block = busy(next);
    if (block) return fail(block);
    var level = levelOf(next);
    if (!level.waitCost) return fail("This mission has no wait action.");
    var before = currentStage(next);
    var rejected = rejectPay(next, checkPay(next, level.waitCost, 0));
    if (rejected) return rejected;
    applyPay(next, level.waitCost, 0, "Wait one turn");
    if (next.phase === "fail") return ok(next, "flood", next.caption);
    var after = currentStage(next);
    next.message = after !== before
      ? "The flood arrived at the start of turn " + level.floodTurn + ". Temporary supports no longer add capacity. Earlier tests do not apply."
      : "You waited. The turn counter is now " + next.turn + ".";
    next.messageTone = after !== before ? "bad" : "info";
    next.caption = after !== before ? "Flood tone. Temporary supports are out." : "Click. Waited one turn.";
    return ok(next, after !== before ? "flood" : "click", next.caption);
  }

  function raiseFlood(state) {
    var next = clone(state);
    var block = busy(next);
    if (block) return fail(block);
    var level = levelOf(next);
    if (!level.floodTurn) return fail("This mission has no flood.");
    if (next.floodApplied) return fail("The flood is already here.");
    next.turn = level.floodTurn;
    syncFlood(next);
    next.message = "The flood is here. Dashed posts add no strength.";
    next.messageTone = "bad";
    next.caption = "Flood tone. Temporary supports are out.";
    return ok(next, "flood", next.caption);
  }

  function release(state) {
    var next = clone(state);
    var block = busy(next);
    if (block) return fail(block);
    var level = levelOf(next);
    var vehicle = activeVehicle(next);
    if (!vehicle || vehicle.status !== "waiting") return fail("Select a waiting vehicle.");
    if (!next.lastTest) return fail("Run a test on this vehicle before you send it.");
    if (next.lastTest.vehicleId !== vehicle.id || next.lastTest.signature !== currentSignature(next)) {
      if (next.floodApplied && next.lastTest.stage === "calm") {
        return fail("The flood changed the supports. The earlier pass no longer applies. Test again under the current ratings.");
      }
      return fail("That test no longer matches this vehicle and bridge. Test again.");
    }
    if (!next.lastTest.passed) return fail("This vehicle has not passed the current test.");
    var window = Model.actionWindow(next.turn, level.releaseCost, level.floodTurn, level.deadlineTurn);
    if (!next.freePlay && level.turnMode === "clock" && window.straddles) {
      return fail("Release blocked. The crossing would use turns " + window.start + "–" + window.end + ", and the flood at the start of turn " + level.floodTurn + " would change the supports while the " + vehicle.name + " is still on the bridge. The current test cannot authorize that crossing.");
    }
    var rejected = rejectPay(next, checkPay(next, level.releaseCost, 0));
    if (rejected) return rejected;
    next.animStage = currentStage(next);
    next.phase = "animating";
    next.releaseVehicleId = vehicle.id;
    applyPay(next, level.releaseCost, 0, "Release " + vehicle.name);
    if (next.phase === "fail") return ok(next, "error", next.caption);
    next.message = vehicle.name + " is crossing.";
    next.messageTone = "good";
    next.caption = "Crossing tone. " + vehicle.name + " is on the bridge.";
    return ok(next, "release", next.caption);
  }

  function finishRelease(state) {
    var next = clone(state);
    if (next.phase !== "animating" || !next.releaseVehicleId) return fail("No crossing is in progress.");
    var vehicle = vehicleById(next, next.releaseVehicleId);
    if (!vehicle || vehicle.status === "released") return fail("That vehicle was already released.");
    vehicle.status = "released";
    next.lastTest = null;
    next.releaseVehicleId = null;
    next.animStage = null;
    next.phase = "play";
    var floodBefore = next.floodApplied;
    syncFlood(next);
    var left = waitingVehicles(next);
    if (!left.length) {
      next.phase = "report";
      next.message = "All vehicles have crossed.";
      if (!floodBefore && next.floodApplied) {
        next.message += " The flood arrived as the crossing finished. Later vehicles need a new test.";
      }
      next.messageTone = "good";
      next.caption = "Success tone. The crossing is complete.";
      return ok(next, "success", next.caption);
    }
    next.activeVehicleId = left[0].id;
    next.message = vehicle.name + " is across. " + left.length + " vehicle(s) still waiting. Test the next one. The last test was used up.";
    if (!floodBefore && next.floodApplied) {
      next.message += " The flood is now in. Temporary supports add no capacity.";
    }
    next.messageTone = "good";
    next.caption = "Success tone. " + vehicle.name + " crossed.";
    if (!next.freePlay && levelOf(next).turnMode === "clock" && next.turn >= levelOf(next).deadlineTurn) closeForTime(next);
    return ok(next, "success", next.caption);
  }

  function submitAnswer(state, questionId, optionId) {
    var next = clone(state);
    if (next.phase === "animating") return fail("Wait for the vehicle to finish crossing.");
    var questions = buildQuestions(next);
    var question = null;
    questions.forEach(function (item) {
      if (item.id === questionId) question = item;
    });
    if (!question) return fail("That question is not open.");
    var option = null;
    question.options.forEach(function (item) {
      if (item.id === optionId) option = item;
    });
    if (!option) return fail("Choose one of the answers.");
    next.answers[questionId] = {
      optionId: option.id,
      correct: !!option.correct,
      forSignature: currentSignature(next)
    };
    if (option.correct) {
      next.message = "That explanation matches this test.";
      next.messageTone = "good";
      next.caption = "Pass tone. Answer matches the test.";
      return ok(next, "pass", next.caption);
    }
    next.message = option.feedback;
    next.messageTone = "bad";
    next.caption = "Alert tone. That answer does not match the test. Try again.";
    return ok(next, "fail", next.caption);
  }

  function gateOpen(state) {
    var level = levelOf(state);
    if (!level || !level.requirePrediction || !testIsFresh(state)) return false;
    var answer = state.answers.gate;
    return !answer || !answer.correct || answer.forSignature !== currentSignature(state);
  }

  function buildQuestions(state) {
    var level = levelOf(state);
    if (!level) return [];
    if (level.id === 1) return level1Questions(state);
    if (state.phase !== "report" && state.phase !== "fail") return [];
    if (level.id === 2 && state.phase === "report") return level2Questions(state);
    if (level.id === 3 && state.phase === "report") return level3Questions(state);
    return [];
  }

  function sectionOf(test, id) {
    if (!test) return null;
    var found = null;
    test.sections.forEach(function (section) {
      if (section.id === id) found = section;
    });
    return found;
  }

  function level1Questions(state) {
    if (!testIsFresh(state)) return [];
    var test = state.lastTest;
    var east = sectionOf(test, "east");
    var center = sectionOf(test, "center");
    var earlier = null;
    state.tests.forEach(function (item) {
      var oldEast = sectionOf(item, "east");
      if (oldEast && oldEast.demand > oldEast.capacity) earlier = oldEast;
    });
    var correctText = earlier
      ? "Earlier the east support was " + earlier.demand + "/" + earlier.capacity + ". This passing test shows " + east.demand + "/" + east.capacity + ", so the east support now has enough capacity."
      : "The van passes because no section has demand above capacity. The busiest section is the east support at " + east.demand + "/" + east.capacity + ".";
    var wrongClamp = state.installed.indexOf("center-clamp") !== -1
      ? "The center clamp is what raised capacity at the east support."
      : "Reinforcing the center was what raised capacity at the east support.";
    var wrongClampFeedback = "The center reinforcement adds center capacity only. On this test the east support reads " + east.demand + " load units against capacity " + east.capacity + ", and the center span reads " + center.demand + " against " + center.capacity + ".";
    return [{
      id: "gate",
      prompt: "Which explanation matches this passing test? East support " + east.demand + "/" + east.capacity + ". Center span " + center.demand + "/" + center.capacity + ".",
      options: [
        { id: "match", correct: true, text: correctText },
        {
          id: "ignore",
          correct: false,
          text: "The east support is over capacity, but the van may cross anyway.",
          feedback: "A pass means every demand is less than or equal to capacity. East demand is " + east.demand + " and east capacity is " + east.capacity + "."
        },
        { id: "center", correct: false, text: wrongClamp, feedback: wrongClampFeedback }
      ]
    }];
  }

  function netMaterials(state) {
    return state.startMaterials - state.materials;
  }

  function level2Questions(state) {
    var net = netMaterials(state);
    var spent = state.turnsSpent;
    var heavyPassed = state.tests.some(function (test) {
      return test.vehicleId === "heavy" && test.passed;
    });
    var splitSent = state.vehicles.some(function (vehicle) {
      return (vehicle.id === "light-a" || vehicle.id === "light-b") && vehicle.status === "released";
    });
    var how = splitSent && !heavyPassed ? "split" : "reinforce";
    return [
      {
        id: "why-both",
        prompt: "This bridge started with center capacity 8. The full truck demands 14 there. Each split truck demands 8. Why can both published routes pass?",
        options: [
          {
            id: "both",
            correct: true,
            text: "A center post raises center capacity from 8 to 16, which holds 14. Without it, one split truck demands 8, which is equal to capacity 8 and still passes."
          },
          {
            id: "split-adds",
            correct: false,
            text: "Splitting works because it raises center capacity above 14.",
            feedback: "Splitting does not change capacity. It changes center demand from 14 to 8. The original center capacity is 8, so one split truck is at capacity and passes."
          },
          {
            id: "full-fits",
            correct: false,
            text: "The full truck already passes on the original center capacity of 8.",
            feedback: "14 is greater than 8, so the full truck overloads the original center span. It passes only after center capacity rises to 16, or the load is split."
          }
        ]
      },
      {
        id: "cost-check",
        prompt: "Your run used " + net + " kit(s) and " + spent + " action turn(s). You " + (how === "split" ? "sent the split trucks." : "used a reinforced crossing or a mixed plan.") + " Which cost statement matches the published routes and this run?",
        options: [
          {
            id: "actual",
            correct: true,
            text: "This run used " + net + " kit(s) and " + spent + " turn(s). The reinforce-once route is published at 2 kits and 4 turns. The split route is published at 0 kits and 7 turns."
          },
          {
            id: "swapped",
            correct: false,
            text: "This run used " + (net + 2) + " kit(s). The split route costs 2 kits.",
            feedback: "Kits left are " + state.materials + " of " + state.startMaterials + ", so this run used " + net + " kit(s), not " + (net + 2) + ". Splitting costs 0 kits. The center post route costs 2 kits."
          },
          {
            id: "turns",
            correct: false,
            text: "This run used " + (spent + 3) + " action turns, and both published routes cost the same number of turns.",
            feedback: "The action log spent " + spent + " turn(s), not " + (spent + 3) + ". The published routes are not equal: reinforce-once is 4 turns and the split route is 7 turns."
          }
        ]
      }
    ];
  }

  function level3Questions(state) {
    var last = null;
    state.tests.forEach(function (test) {
      if (test.passed) last = test;
    });
    var center = sectionOf(last, "center");
    var east = sectionOf(last, "east");
    var centerText = center ? center.demand + "/" + center.capacity : "the last reading";
    var eastText = east ? east.demand + "/" + east.capacity : "the last reading";
    return [
      {
        id: "flood-test",
        prompt: "Your last passing test reads center " + centerText + " and east " + eastText + ". The flood arrives at the start of turn 5. Which statement matches those rules and readings?",
        options: [
          {
            id: "fresh",
            correct: true,
            text: "Those readings already describe the supports that were standing during that test. A test from the other flood stage cannot authorize a later release."
          },
          {
            id: "keep",
            correct: false,
            text: "A pass recorded before turn 5 still authorizes a release after the temporary bent is gone.",
            feedback: "Flood stage is part of the test. After turn 5 the temporary bent and temporary brace add no capacity, so a pre-flood pass expires. Use the reading from the current stage."
          },
          {
            id: "brace-stays",
            correct: false,
            text: "The temporary brace still adds 4 center capacity after turn 5, so center capacity on the last test includes it.",
            feedback: "The temporary brace fails at the flood and its kit is not returned. It is not part of a post-flood rating. Read the center capacity on the test you are using: " + (center ? center.capacity : "none") + "."
          }
        ]
      },
      {
        id: "straddle",
        prompt: "A release takes 2 action turns. Why is a release that would occupy turns 4 and 5 blocked even after a passing test?",
        options: [
          {
            id: "mid",
            correct: true,
            text: "The vehicle would still be on the bridge at turn 5, when temporary supports fail. The pre-flood test does not describe the whole crossing."
          },
          {
            id: "deadline",
            correct: false,
            text: "Turns 4 and 5 are after the evacuation deadline.",
            feedback: "The deadline is the start of turn 16. Turns 4 and 5 are blocked because they cross the flood at turn 5."
          },
          {
            id: "free",
            correct: false,
            text: "Release is free, so the block is only a warning and the old test can still be used.",
            feedback: "Release costs 2 action turns, and the block spends nothing. The old test cannot be used for a crossing that changes supports halfway."
          }
        ]
      }
    ];
  }

  function questionsComplete(state) {
    var questions = buildQuestions(state);
    if (!questions.length) return state.phase === "report";
    return questions.every(function (question) {
      var answer = state.answers[question.id];
      return answer && answer.correct && (!answer.forSignature || answer.forSignature === currentSignature(state) || state.phase === "report");
    });
  }

  function debrief(state) {
    var level = levelOf(state);
    if (!level || level.id !== 2) return "";
    var net = netMaterials(state);
    var spent = state.turnsSpent;
    return "This run used " + net + " kit(s) and " + spent + " action turn(s). The other published route is not free in every resource: reinforcing the center and sending the full truck costs 2 kits and 4 turns; splitting costs 0 kits and 7 turns. Both can pass because center demand 14 fits capacity 16 after the center post, and each split truck demands 8, which is equal to the original center capacity of 8.";
  }

  function preview(state, turns, materials) {
    var level = levelOf(state);
    var blocked = [];
    if (materials > state.materials) blocked.push("not enough kits");
    if (level.turnMode === "budget") {
      if (turns > state.turnsLeft) blocked.push("not enough action turns");
      var left = state.turnsLeft - turns;
      var kits = state.materials - materials;
      var text = "Costs " + materials + " kit(s) and " + turns + " action turn(s). Action turns after: " + left + ". Kits after: " + kits + ".";
      if (blocked.length) text += " Blocked: " + blocked.join(", ") + ".";
      return text;
    }
    if (turns === 0 && !blocked.length) return "Costs no turns. The counter stays at turn " + state.turn + ".";
    var window = Model.actionWindow(state.turn, Math.max(turns, 0), level.floodTurn, level.deadlineTurn);
    var stageLater = Model.stageAt(window.next, level.floodTurn);
    var clockText = "Uses turn" + (turns > 1 ? "s " + window.start + "–" + window.end : " " + window.start) + ". After this action the counter is turn " + window.next + ". Flood stage then: " + (stageLater === "flood" ? "flood, temporary supports out" : "before the flood") + ". Kits after: " + (state.materials - materials) + ".";
    if (window.straddles) blocked.push("the action crosses the flood");
    if (window.tooLate) blocked.push("evacuation is closed");
    if (blocked.length) clockText += " Blocked: " + blocked.join(", ") + ".";
    return clockText;
  }

  return {
    createMatch: createMatch,
    chooseBlueprint: chooseBlueprint,
    predict: predict,
    selectVehicle: selectVehicle,
    runTest: runTest,
    install: install,
    removeSupport: removeSupport,
    splitLoad: splitLoad,
    recombine: recombine,
    waitTurn: waitTurn,
    raiseFlood: raiseFlood,
    release: release,
    finishRelease: finishRelease,
    submitAnswer: submitAnswer,
    buildQuestions: buildQuestions,
    questionsComplete: questionsComplete,
    debrief: debrief,
    preview: preview,
    evaluateState: evaluateState,
    currentStage: currentStage,
    visualStage: visualStage,
    currentSignature: currentSignature,
    testIsFresh: testIsFresh,
    gateOpen: gateOpen,
    feedbackFor: feedbackFor,
    activeVehicle: activeVehicle,
    blueprint: blueprint,
    supportById: supportById
  };
});
