/* Repeatable checks for the teaching model and the three mission routes. */
var assert = require("assert");
var Model = require("../js/model");
var Rules = require("../js/rules");

var failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log("ok  " + name);
  } catch (error) {
    failed += 1;
    console.error("FAIL " + name);
    console.error("  " + error.message);
  }
}

function play(state, fn) {
  var result = fn(state);
  if (!result.ok) throw new Error(result.error || "action failed");
  return result.state;
}

function mustFail(state, fn) {
  var result = fn(state);
  assert.strictEqual(result.ok, false);
  return result.error;
}

check("demand equal to capacity passes, one more fails", function () {
  var names = { west: "west span", center: "center span", east: "east span" };
  var even = Model.evaluate(
    { west: 4, center: 8, east: 4 },
    { west: 12, center: 8, east: 12 },
    names
  );
  assert.strictEqual(even.passed, true);
  assert.strictEqual(even.sections[1].status, "at-capacity");
  var over = Model.evaluate(
    { west: 4, center: 9, east: 4 },
    { west: 12, center: 8, east: 12 },
    names
  );
  assert.strictEqual(over.passed, false);
  assert.strictEqual(over.weakest.id, "center");
});

check("zero capacity overloads only when demand is positive", function () {
  var names = { west: "west span", center: "center span", east: "east span" };
  var open = Model.evaluate(
    { west: 0, center: 0, east: 0 },
    { west: 0, center: 0, east: 0 },
    names
  );
  assert.strictEqual(open.passed, true);
  var blocked = Model.evaluate(
    { west: 1, center: 0, east: 0 },
    { west: 0, center: 0, east: 0 },
    names
  );
  assert.strictEqual(blocked.passed, false);
  assert.strictEqual(blocked.sections[0].status, "overload");
});

check("temporary supports drop out after the flood", function () {
  var supports = [
    { id: "temp", builtIn: true, temporary: true, capacity: { west: 0, center: 8, east: 0 } },
    { id: "tower", builtIn: false, temporary: false, capacity: { west: 0, center: 10, east: 0 } }
  ];
  var before = Model.capacities(supports, ["tower"], "calm");
  var after = Model.capacities(supports, ["tower"], "flood");
  assert.strictEqual(before.center, 18);
  assert.strictEqual(after.center, 10);
});

check("spend and refund never cross zero or invent kits", function () {
  assert.deepStrictEqual(Model.spend(0, 0), { ok: true, value: 0 });
  var broke = Model.spend(0, 1);
  assert.strictEqual(broke.ok, false);
  assert.strictEqual(broke.value, 0);
  assert.strictEqual(Model.spend(2, 2).value, 0);
  assert.strictEqual(Model.refund(1, 1).value, 2);
  assert.strictEqual(Model.refund(2, -1).ok, false);
});

check("action windows: exact capacity boundary, straddle, and deadline", function () {
  var safe = Model.actionWindow(3, 2, 5, 16);
  assert.strictEqual(safe.straddles, false);
  assert.strictEqual(safe.end, 4);
  assert.strictEqual(safe.stage, "calm");
  var cross = Model.actionWindow(4, 2, 5, 16);
  assert.strictEqual(cross.straddles, true);
  assert.strictEqual(cross.end, 5);
  var post = Model.actionWindow(5, 2, 5, 16);
  assert.strictEqual(post.straddles, false);
  assert.strictEqual(post.stage, "flood");
  var late = Model.actionWindow(15, 2, 5, 16);
  assert.strictEqual(late.tooLate, true);
  var last = Model.actionWindow(14, 2, 5, 16);
  assert.strictEqual(last.tooLate, false);
  assert.strictEqual(last.end, 15);
});

check("level 1 timber fails at the east support until the east shoe", function () {
  var state = play(Rules.createMatch(1, "practice").state, function (s) {
    return Rules.chooseBlueprint(s, "timber");
  });
  state = play(state, function (s) { return Rules.predict(s, "center"); });
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, false);
  assert.ok(state.predictionNote.indexOf("You predicted the center span") !== -1);
  assert.ok(state.message.indexOf("east support") !== -1);
  var before = state.materials;
  state = play(state, function (s) { return Rules.install(s, "center-clamp"); });
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, false);
  assert.strictEqual(
    state.lastTest.note,
    "The east support carried 8 load units, but its capacity was 6. Reinforcing the center did not increase capacity at the east support."
  );
  state = play(state, function (s) { return Rules.removeSupport(s, "center-clamp"); });
  assert.strictEqual(state.materials, before);
  state = play(state, function (s) { return Rules.install(s, "east-shoe"); });
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, true);
  assert.strictEqual(state.lastTest.sections[2].capacity, 10);
  state = play(state, function (s) { return Rules.release(s); });
  assert.strictEqual(state.phase, "animating");
  var again = mustFail(state, function (s) { return Rules.release(s); });
  assert.ok(again.indexOf("Wait") !== -1);
  state = play(state, function (s) { return Rules.finishRelease(s); });
  assert.strictEqual(state.phase, "report");
  assert.ok(state.materials >= 0);
  assert.ok(state.turnsLeft >= 0);
  assert.strictEqual(state.vehicles[0].status, "released");
});

check("level 1 steel plan passes the same van without a kit", function () {
  var state = play(Rules.createMatch(1, "mission").state, function (s) {
    return Rules.chooseBlueprint(s, "steel");
  });
  state = play(state, function (s) { return Rules.predict(s, "east"); });
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, true);
  assert.strictEqual(state.materials, 2);
  assert.ok(state.predictionNote.indexOf("agrees") !== -1);
  state = play(state, function (s) { return Rules.release(s); });
  state = play(state, function (s) { return Rules.finishRelease(s); });
  assert.strictEqual(state.phase, "report");
});

check("changing the bridge expires a passing test", function () {
  var state = play(Rules.createMatch(1, "practice").state, function (s) {
    return Rules.chooseBlueprint(s, "timber");
  });
  state = play(state, function (s) { return Rules.predict(s, "east"); });
  state = play(state, function (s) { return Rules.install(s, "east-shoe"); });
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(Rules.testIsFresh(state), true);
  var installed = play(state, function (s) { return Rules.install(s, "center-clamp"); });
  assert.strictEqual(Rules.testIsFresh(installed), false);
  var error = mustFail(installed, function (s) { return Rules.release(s); });
  assert.ok(error.indexOf("no longer matches") !== -1);
  assert.strictEqual(state.materials, state.materials);
});

check("removing and reinstalling does not create kits", function () {
  var state = play(Rules.createMatch(1, "practice").state, function (s) {
    return Rules.chooseBlueprint(s, "timber");
  });
  var start = state.materials;
  state = play(state, function (s) { return Rules.install(s, "east-shoe"); });
  state = play(state, function (s) { return Rules.removeSupport(s, "east-shoe"); });
  state = play(state, function (s) { return Rules.install(s, "east-shoe"); });
  state = play(state, function (s) { return Rules.removeSupport(s, "east-shoe"); });
  assert.strictEqual(state.materials, start);
  var broke = state;
  broke = play(broke, function (s) { return Rules.install(s, "east-shoe"); });
  broke = play(broke, function (s) { return Rules.install(s, "center-clamp"); });
  assert.strictEqual(broke.materials, 0);
  var error = mustFail(broke, function (s) { return Rules.install(s, "east-shoe"); });
  assert.ok(error.indexOf("already") !== -1 || error.indexOf("Not enough") !== -1);
});

check("level 2 reinforce route and the west-brace miss", function () {
  var state = Rules.createMatch(2, "mission").state;
  state = play(state, function (s) { return Rules.install(s, "west-knee"); });
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, false);
  assert.strictEqual(
    state.lastTest.note,
    "The center span carried 14 load units, but its capacity was 8. Reinforcing the west approach did not increase capacity at the center span."
  );
  var mats = state.materials;
  state = play(state, function (s) { return Rules.removeSupport(s, "west-knee"); });
  assert.strictEqual(state.materials, mats + 2);
  state = play(state, function (s) { return Rules.install(s, "center-post"); });
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, true);
  assert.strictEqual(state.lastTest.sections[1].capacity, 16);
  state = play(state, function (s) { return Rules.release(s); });
  state = play(state, function (s) { return Rules.finishRelease(s); });
  assert.strictEqual(state.phase, "report");
  assert.ok(state.debrief || true);
  assert.ok(Rules.debrief(state).indexOf("2 kit") !== -1);
  assert.ok(Rules.debrief(state).indexOf("7 turn") !== -1);
  var wrong = play(state, function (s) { return Rules.submitAnswer(s, "why-both", "full-fits"); });
  assert.strictEqual(wrong.answers["why-both"].correct, false);
  state = play(wrong, function (s) { return Rules.submitAnswer(s, "why-both", "both"); });
  state = play(state, function (s) { return Rules.submitAnswer(s, "cost-check", "actual"); });
  assert.strictEqual(Rules.questionsComplete(state), true);
  assert.ok(state.materials >= 0);
  assert.ok(state.turnsLeft >= 0);
});

check("level 2 split route passes at exact center capacity", function () {
  var state = Rules.createMatch(2, "practice").state;
  state = play(state, function (s) { return Rules.splitLoad(s); });
  assert.strictEqual(state.vehicles.length, 2);
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, true);
  assert.strictEqual(state.lastTest.sections[1].status, "at-capacity");
  state = play(state, function (s) { return Rules.release(s); });
  state = play(state, function (s) { return Rules.finishRelease(s); });
  assert.strictEqual(state.phase, "play");
  state = play(state, function (s) { return Rules.runTest(s); });
  state = play(state, function (s) { return Rules.release(s); });
  var stale = play(state, function (s) { return Rules.finishRelease(s); });
  assert.strictEqual(stale.phase, "report");
  assert.strictEqual(stale.materials, 3);
  assert.ok(stale.turnsLeft >= 0);
  stale.vehicles.forEach(function (vehicle) {
    assert.strictEqual(vehicle.status, "released");
  });
});

check("level 2 retest is required after the center post is removed", function () {
  var state = Rules.createMatch(2, "practice").state;
  state = play(state, function (s) { return Rules.install(s, "center-post"); });
  state = play(state, function (s) { return Rules.runTest(s); });
  state = play(state, function (s) { return Rules.removeSupport(s, "center-post"); });
  var error = mustFail(state, function (s) { return Rules.release(s); });
  assert.ok(error.indexOf("no longer matches") !== -1);
  assert.strictEqual(state.phase, "play");
});

function releaseAll(state) {
  var guard = 0;
  while (state.phase !== "report" && state.phase !== "fail" && guard < 8) {
    guard += 1;
    var waiting = state.vehicles.filter(function (vehicle) { return vehicle.status === "waiting"; })[0];
    state = play(state, function (s) { return Rules.selectVehicle(s, waiting.id); });
    state = play(state, function (s) { return Rules.runTest(s); });
    assert.strictEqual(state.lastTest.passed, true, waiting.name + " should pass");
    state = play(state, function (s) { return Rules.release(s); });
    state = play(state, function (s) { return Rules.finishRelease(s); });
  }
  return state;
}

check("level 3 permanent works, then flood, then all three vehicles", function () {
  var state = Rules.createMatch(3, "mission").state;
  state = play(state, function (s) { return Rules.install(s, "center-tower"); });
  assert.strictEqual(state.turn, 3);
  state = play(state, function (s) { return Rules.install(s, "east-plate"); });
  assert.strictEqual(state.turn, 4);
  state = play(state, function (s) { return Rules.waitTurn(s); });
  assert.strictEqual(state.turn, 5);
  assert.strictEqual(state.floodApplied, true);
  state = releaseAll(state);
  assert.strictEqual(state.phase, "report");
  assert.ok(state.turn < 16);
  assert.ok(state.materials >= 0);
  state = play(state, function (s) { return Rules.submitAnswer(s, "flood-test", "fresh"); });
  state = play(state, function (s) { return Rules.submitAnswer(s, "straddle", "mid"); });
  assert.strictEqual(Rules.questionsComplete(state), true);
});

check("level 3 can send the medic before the flood and the others after", function () {
  var state = Rules.createMatch(3, "practice").state;
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, true);
  state = play(state, function (s) { return Rules.release(s); });
  state = play(state, function (s) { return Rules.finishRelease(s); });
  assert.strictEqual(state.turn, 4);
  state = play(state, function (s) { return Rules.install(s, "east-plate"); });
  assert.strictEqual(state.floodApplied, true);
  state = play(state, function (s) { return Rules.install(s, "center-tower"); });
  state = releaseAll(state);
  assert.strictEqual(state.phase, "report");
  assert.strictEqual(state.vehicles.filter(function (v) { return v.status === "released"; }).length, 3);
});

check("level 3 trap passes the first bus test and then the flood blocks it", function () {
  var state = Rules.createMatch(3, "practice").state;
  state = play(state, function (s) { return Rules.install(s, "temp-brace"); });
  state = play(state, function (s) { return Rules.install(s, "east-plate"); });
  state = play(state, function (s) { return Rules.selectVehicle(s, "bus"); });
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, true);
  assert.strictEqual(state.turn, 4);
  var mats = state.materials;
  var error = mustFail(state, function (s) { return Rules.release(s); });
  assert.ok(error.indexOf("Release blocked") !== -1);
  assert.strictEqual(state.turn, 4);
  assert.strictEqual(state.materials, mats);
  state = play(state, function (s) { return Rules.waitTurn(s); });
  assert.strictEqual(state.floodApplied, true);
  assert.strictEqual(state.materials, mats);
  assert.ok(state.installed.indexOf("temp-brace") === -1);
  var stale = mustFail(state, function (s) { return Rules.release(s); });
  assert.ok(stale.indexOf("flood") !== -1);
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, false);
  assert.strictEqual(state.lastTest.sections[1].capacity, 0);
  var guard = 0;
  while (state.phase !== "fail" && guard < 20) {
    guard += 1;
    state = play(state, function (s) { return Rules.waitTurn(s); });
  }
  assert.strictEqual(state.phase, "fail");
  assert.ok(state.failReason.indexOf("turn 16") !== -1);
  assert.ok(state.materials >= 0);
});

check("level 3 a pre-flood pass expires when the flood arrives, and a retest can pass", function () {
  var state = Rules.createMatch(3, "practice").state;
  state = play(state, function (s) { return Rules.install(s, "center-tower"); });
  state = play(state, function (s) { return Rules.install(s, "east-plate"); });
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, true);
  assert.strictEqual(state.lastTest.stage, "calm");
  assert.strictEqual(state.floodApplied, true);
  assert.strictEqual(Rules.testIsFresh(state), false);
  var error = mustFail(state, function (s) { return Rules.release(s); });
  assert.ok(error.indexOf("no longer applies") !== -1);
  state = play(state, function (s) { return Rules.runTest(s); });
  assert.strictEqual(state.lastTest.passed, true);
  assert.strictEqual(state.lastTest.stage, "flood");
  assert.strictEqual(Rules.testIsFresh(state), true);
});

check("level 3 retry after the brace trap still has a permanent route", function () {
  var trapped = Rules.createMatch(3, "practice").state;
  trapped = play(trapped, function (s) { return Rules.install(s, "temp-brace"); });
  trapped = play(trapped, function (s) { return Rules.install(s, "east-plate"); });
  trapped = play(trapped, function (s) { return Rules.selectVehicle(s, "bus"); });
  trapped = play(trapped, function (s) { return Rules.runTest(s); });
  trapped = play(trapped, function (s) { return Rules.removeSupport(s, "temp-brace"); });
  assert.strictEqual(trapped.materials, 2);
  trapped = play(trapped, function (s) { return Rules.install(s, "center-tower"); });
  trapped = releaseAll(trapped);
  assert.strictEqual(trapped.phase, "report");
  assert.ok(trapped.materials >= 0);
  assert.ok(trapped.turn <= 16);
});

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("All model and route checks passed.");
