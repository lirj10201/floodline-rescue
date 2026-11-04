/* Pages and the rescue console. The rules module decides what is legal. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./model"), require("./levels"), require("./rules"));
  } else {
    root.FloodUI = factory(root.FloodModel, root.FloodLevels, root.FloodRules);
  }
})(typeof self !== "undefined" ? self : this, function (Model, Levels, Rules) {
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nextMission(progress) {
    if (!progress.done[1] && !progress.done["1"]) return 1;
    if (!progress.done[2] && !progress.done["2"]) return 2;
    if (!progress.done[3] && !progress.done["3"]) return 3;
    return 1;
  }

  function done(progress, id) {
    return !!(progress.done[id] || progress.done[String(id)]);
  }

  function home(progress) {
    var mission = nextMission(progress);
    var replay = mission === 1 && done(progress, 1);
    var levels = Levels.list().map(function (level) {
      var state = done(progress, level.id) ? "done" : "open";
      return "<li><span data-state=\"" + state + "\">Level " + level.id + " · " + esc(level.code) + "</span> — " +
        (done(progress, level.id) ? "mission complete" : "not complete in mission mode") + "</li>";
    }).join("");
    return "<main id=\"main\" class=\"wrap\" tabindex=\"-1\">" +
      "<header class=\"mast\"><div><p class=\"kicker\">Field engineering desk</p><h1>Floodline Rescue</h1><p class=\"zh\">洪峰倒计时</p></div></header>" +
      "<div class=\"hero\"><section class=\"sheet\">" +
      heroMap() +
      "<p class=\"story\">After the storm, the bridge to the village is gone. You are the rescue engineer. Send medicine, move supplies, and evacuate residents before the flood takes the temporary supports.</p>" +
      "<p>This is a simplified bridge model for class. You will compare load and capacity, then spend kits and action turns on purpose.</p>" +
      "<ul class=\"progress-list\">" + levels + "</ul>" +
      "<div class=\"actions\" style=\"margin-top:1rem\">" +
      "<a class=\"button primary\" href=\"#/play/" + mission + "/mission\">" + (replay ? "Replay mission" : "Start Mission") + "</a>" +
      "<button type=\"button\" data-action=\"clear-progress\">Clear saved progress</button>" +
      "</div></section><section class=\"cards\">" +
      "<article class=\"card\"><h2>Practice Levels</h2><p>Open any mission for a demonstration or a retest. Practice does not unlock the full mission.</p>" +
      "<div class=\"actions\">" +
      "<a class=\"button\" href=\"#/play/1/practice\">Level 1</a>" +
      "<a class=\"button\" href=\"#/play/2/practice\">Level 2</a>" +
      "<a class=\"button\" href=\"#/play/3/practice\">Level 3</a>" +
      "</div></article>" +
      "<article class=\"card\"><h2>About the Course</h2><p>STEM topic, branch, description, and the two learning objectives this desk assesses.</p><a class=\"button\" href=\"#/course\">Open course page</a></article>" +
      "<article class=\"card\"><h2>Facilitator Guide</h2><p>Pair roles, when to stop and talk, what evidence to keep, and three debrief questions.</p><a class=\"button\" href=\"#/guide\">Open facilitator guide</a></article>" +
      "</section></div></main>";
  }

  function heroMap() {
    return "<div class=\"map-frame\"><svg viewBox=\"0 0 720 280\" role=\"img\" aria-label=\"A broken mountain crossing. The west bank has a rescue truck. The east bank has a clinic. Floodwater sits in the gap.\">" +
      "<rect width=\"720\" height=\"280\" fill=\"#efe4cf\"></rect>" +
      "<path d=\"M0 90 L120 70 L200 100 L250 60 L360 90 L480 50 L600 86 L720 64 L720 0 L0 0 Z\" fill=\"#c8d3c0\"></path>" +
      "<rect x=\"250\" y=\"150\" width=\"230\" height=\"90\" fill=\"#1f6f86\"></rect>" +
      "<path d=\"M250 168 C300 160 360 180 420 166 C460 158 490 172 480 168\" fill=\"none\" stroke=\"#d7eef5\" stroke-width=\"3\"></path>" +
      "<rect x=\"0\" y=\"150\" width=\"250\" height=\"24\" fill=\"#8d7a55\"></rect>" +
      "<rect x=\"480\" y=\"150\" width=\"240\" height=\"24\" fill=\"#8d7a55\"></rect>" +
      "<path d=\"M230 162 H270 M450 162 H490\" stroke=\"#9d2c22\" stroke-width=\"4\"></path>" +
      "<rect x=\"70\" y=\"126\" width=\"54\" height=\"24\" fill=\"#f7f3ea\" stroke=\"#1b1712\"></rect>" +
      "<rect x=\"108\" y=\"132\" width=\"22\" height=\"16\" fill=\"#d8d2c4\" stroke=\"#1b1712\"></rect>" +
      "<path d=\"M88 138 h8 M92 134 v8\" stroke=\"#9d2c22\" stroke-width=\"2\"></path>" +
      "<rect x=\"560\" y=\"118\" width=\"46\" height=\"32\" fill=\"#f7f1e4\" stroke=\"#1b1712\"></rect>" +
      "<path d=\"M572 134 h8 M576 130 v8\" stroke=\"#9d2c22\" stroke-width=\"2\"></path>" +
      "<text x=\"24\" y=\"40\" fill=\"#1b1712\" font-size=\"20\">West depot</text>" +
      "<text x=\"560\" y=\"40\" fill=\"#1b1712\" font-size=\"20\">Clinic village</text>" +
      "<text x=\"300\" y=\"210\" fill=\"#f4ecdc\" font-size=\"16\">flood gap</text>" +
      "</svg></div>";
  }

  function course() {
    return "<main id=\"main\" class=\"prose\" tabindex=\"-1\"><article class=\"sheet\">" +
      "<p class=\"kicker\">Course page</p><h1>About the Course</h1>" +
      "<h2>STEM Topic</h2><p>Bridge engineering design: how load, supports, and local failure interact, and how engineers choose what to build when materials and time are limited.</p>" +
      "<h2>STEM Branch</h2><p>Engineering.</p>" +
      "<h2>Game Description</h2><p>Floodline Rescue places a student team at a broken mountain crossing. The medicine van, the supply trucks, and the evacuation vehicles each put a published demand on the west span, the center span, and the east support. Students choose a bridge plan or add a support, predict the weak section, and run a load test. The test uses one deterministic model: a section passes only when its demand is less than or equal to its capacity. Teams then revise the bridge or the transport plan and retest before a vehicle is allowed to cross.</p>" +
      "<h2>Learning objectives</h2>" +
      "<p class=\"objective\"><strong>Objective 1.</strong> Compare two bridge configurations under the same vehicle load and explain which section is most likely to fail using test evidence.</p>" +
      "<p>Level 1 assesses this directly. The medicine van is the same on the timber trestle and the steel girder. Before the first test, the team marks a predicted weak point. The action report keeps that prediction beside the demand and capacity table. A center clamp that does not raise east capacity is there so a wrong revision can be checked against the numbers.</p>" +
      "<p class=\"objective\"><strong>Objective 2.</strong> Revise a bridge or transport plan to meet the mission requirements within the available materials and action turns, then justify the revision using test results.</p>" +
      "<p>Level 2 assesses the revision: reinforce the center and send one heavy truck, or split the cargo and spend more action turns. Level 3 adds the flood clock. A temporary brace can pass a test and still be the wrong revision, because the flood removes it. The report questions use the readings from the run the team just finished.</p>" +
      "<h2>The teaching model</h2>" +
      "<p>The game uses a simplified teaching model, not a bridge code and not a real flood forecast. A <strong>load unit</strong> is the weight unit inside the model. It is not a tonne or a kilonewton. Each vehicle has a demand in load units at each section. Each support adds capacity, in the same load units, to one section.</p>" +
      "<p><strong>Utilization</strong> is demand divided by capacity. Above 1, demand is greater than capacity, and the test fails. At exactly 1, the section is at capacity and the test passes. The picture, the pass or overload stamp, and the written feedback all use this same result. When the bridge, the vehicle, or the flood stage changes, the previous test expires.</p>" +
      "<p><a class=\"button\" href=\"#/\">Back to desk</a></p>" +
      "</article></main>";
  }

  function guide() {
    return "<main id=\"main\" class=\"prose\" tabindex=\"-1\"><article class=\"sheet\">" +
      "<p class=\"kicker\">For the teacher</p><h1>Facilitator Guide</h1>" +
      "<p>Use one device for two students. One is the <strong>Design Lead</strong>. The other is the <strong>Test Analyst</strong>. After Level 2, swap roles. There is no real-time clock. Action turns advance only when the team presses a button, so they can stop and talk.</p>" +
      "<h2>Before class</h2><ol>" +
      "<li>Open the desk and choose Practice Levels if you want to demonstrate one mission, or Start Mission if the class will play in order.</li>" +
      "<li>Read the public rules on the mission screen with the class. Costs, flood turn, and vehicle demands are already on that screen.</li>" +
      "<li>Project the river picture. The labeled buttons on the right repeat every control that can be clicked on the picture.</li>" +
      "</ol>" +
      "<h2>During each mission</h2><ol>" +
      "<li><strong>Level 1, before the first test.</strong> Each student writes a predicted weak section privately. The Design Lead then marks one prediction on the bridge. Do not test until both have spoken.</li>" +
      "<li><strong>Level 1, after the test.</strong> Stop. The Test Analyst reads the demand, capacity, and utilization for every section. Compare that table with the prediction. If the team reinforces the center and the east support is still over capacity, read the feedback sentence before changing anything else.</li>" +
      "<li><strong>Level 1, before release.</strong> The team must choose the explanation that matches this test. A wrong answer gets a specific correction and can be tried again. Only then send the van.</li>" +
      "<li><strong>Level 2, before the first test.</strong> Stop. Each student writes a plan alone: center post, or split the cargo. The plan must include kit cost, center demand, and action turns. Then compare and choose one plan together. The Test Analyst presses the buttons.</li>" +
      "<li><strong>Level 2, after the run.</strong> Read the mission summary. It states what this run spent and what the other published route would have spent. Both routes can pass for a reason the summary states in one sentence.</li>" +
      "<li><strong>Swap roles.</strong> The Test Analyst becomes Design Lead for Level 3.</li>" +
      "<li><strong>Level 3, before every release.</strong> Stop. The Test Analyst reads the turn window on the button. The Design Lead says which supports will still be standing at the end of that window. If turn 5 falls inside the window, do not release. A passing test from before the flood cannot be used after temporary supports fail.</li>" +
      "<li>If time runs out, read the failure reason, then use Retry level. The failure keeps the readings that explain it.</li>" +
      "</ol>" +
      "<h2>Evidence to submit</h2><ul>" +
      "<li>The predicted weak section, and whether the first test agreed.</li>" +
      "<li>The test table: section, demand, capacity, utilization, and pass, at capacity, or overload.</li>" +
      "<li>What changed between a failing test and a passing test.</li>" +
      "<li>Kits and action turns left, or the turn counter and flood stage on Level 3.</li>" +
      "<li>The action-report answers, including any correction the team needed.</li>" +
      "</ul>" +
      "<h2>Three debrief questions</h2><ol>" +
      "<li>On the timber trestle, which section was over capacity, and why did reinforcing the center leave that reading unchanged?</li>" +
      "<li>For the supply mission, when is it wiser to spend 2 kits and fewer turns, and when is it wiser to split the cargo?</li>" +
      "<li>Why can the evac bus pass a test and still be unsafe to release on turns 4 and 5?</li>" +
      "</ol>" +
      "<div class=\"actions\"><a class=\"button\" href=\"#/\">Back to desk</a><button type=\"button\" data-action=\"clear-progress\">Clear saved progress</button></div>" +
      "</article></main>";
  }

  function locked(id) {
    return "<main id=\"main\" class=\"prose\" tabindex=\"-1\"><article class=\"sheet\"><h1>Level " + id + " is locked</h1>" +
      "<p>The full mission unlocks in order. Finish the previous mission from Start Mission. Practice Levels can open this mission without changing that lock.</p>" +
      "<div class=\"actions\"><a class=\"button primary\" href=\"#/\">Back to desk</a><a class=\"button\" href=\"#/play/" + id + "/practice\">Practice this level</a></div></article></main>";
  }

  function supportLine(support) {
    var bits = [];
    ["west", "center", "east"].forEach(function (id) {
      if (support.capacity[id]) bits.push(id + " +" + support.capacity[id]);
    });
    var life = support.temporary ? "Temporary. Fails at the flood." : "Permanent.";
    var cost = support.builtIn ? "Already built." : support.material + " kit(s), " + support.turns + " action turn(s).";
    return esc(support.name) + ": " + bits.join(", ") + ". " + life + " " + cost;
  }

  function statusWord(status) {
    if (status === "overload") return "Overload";
    if (status === "at-capacity") return "At capacity — pass";
    return "Within capacity";
  }

  function tableRows(sections) {
    return sections.map(function (section) {
      var klass = section.status === "overload" ? "bad" : section.status === "at-capacity" ? "warn" : "ok";
      return "<tr><td>" + esc(section.name) + "</td><td>" + section.demand + "</td><td>" + section.capacity + "</td><td>" +
        esc(Model.percent(section.demand, section.capacity)) + "</td><td><span class=\"tag " + klass + "\">" + statusWord(section.status) + "</span></td></tr>";
    }).join("");
  }

  function readingTable(title, sections) {
    return "<div class=\"reading\"><h2>" + esc(title) + "</h2><table><thead><tr><th>Section</th><th>Demand</th><th>Capacity</th><th>Utilization</th><th>Result</th></tr></thead><tbody>" +
      tableRows(sections) + "</tbody></table></div>";
  }

  function button(spec) {
    var disabled = spec.disabled ? " disabled" : "";
    return "<button type=\"button\" data-focus=\"" + esc(spec.focus) + "\" data-action=\"" + esc(spec.action) + "\" data-id=\"" + esc(spec.id || "") + "\"" + disabled + ">" +
      esc(spec.label) + "<small>" + esc(spec.detail) + "</small></button>";
  }

  function questionsBlock(state) {
    var questions = Rules.buildQuestions(state);
    if (!questions.length) return "";
    return questions.map(function (question) {
      var saved = state.answers[question.id];
      var current = !saved || !saved.forSignature || saved.forSignature === Rules.currentSignature(state) || state.phase === "report";
      var note = "";
      if (saved && current && saved.correct) note = "<p>Recorded. This answer matches the test.</p>";
      if (saved && current && !saved.correct) note = "<p>That answer does not match. Read the message above, then choose again.</p>";
      var options = question.options.map(function (option) {
        var checked = saved && current && saved.optionId === option.id ? " checked" : "";
        return "<label><input type=\"radio\" name=\"q-" + esc(question.id) + "\" value=\"" + esc(option.id) + "\"" + checked + "> " + esc(option.text) + "</label>";
      }).join("");
      return "<fieldset class=\"question\"><legend>" + esc(question.prompt) + "</legend>" + options +
        "<button type=\"button\" data-action=\"answer\" data-qid=\"" + esc(question.id) + "\" data-focus=\"answer-" + esc(question.id) + "\">Check answer</button>" +
        note + "</fieldset>";
    }).join("");
  }

  function bars(test, title) {
    if (!test) return "";
    var rows = test.sections.map(function (section) {
      var max = Math.max(section.demand, section.capacity, 1);
      return "<div><div class=\"bar-label\"><span>" + esc(section.name) + "</span><span>" + section.demand + " demand / " + section.capacity + " capacity</span></div>" +
        "<div class=\"track\"><div class=\"demand\" style=\"width:" + Math.round(section.demand / max * 100) + "%\"></div></div>" +
        "<div class=\"track\"><div class=\"capacity\" style=\"width:" + Math.round(section.capacity / max * 100) + "%\"></div></div></div>";
    }).join("");
    return "<div class=\"reading\"><h2>" + esc(title) + "</h2><p>Upper bar: demand. Lower bar: capacity. A demand bar longer than the capacity bar is an overload.</p><div class=\"bars\">" + rows + "</div></div>";
  }

  function play(match, progress) {
    var level = Levels.getLevel(match.levelId);
    var plan = Rules.blueprint(match);
    var stage = Rules.visualStage(match);
    var live = plan && Rules.activeVehicle(match) ? Rules.evaluateState(match, stage) : null;
    var fresh = Rules.testIsFresh(match);
    var tone = "ready";
    if (stage === "flood" && match.phase !== "animating") tone = "flood";
    else if (fresh) tone = "safe";
    else if (match.lastTest && !match.lastTest.passed && match.lastTest.signature === Rules.currentSignature(match)) tone = "overload";
    if (match.phase === "fail") tone = "overload";
    if (match.phase === "report") tone = "safe";

    var meters = level.turnMode === "clock"
      ? meter("Turn", match.turn) + meter("Flood", "Turn " + level.floodTurn) + meter("Close", "Turn " + level.deadlineTurn) + meter("Kits", match.materials)
      : meter("Kits", match.materials) + meter("Action turns", match.turnsLeft);

    return "<main id=\"main\" tabindex=\"-1\">" +
      "<header class=\"play-top\"><div><p class=\"kicker\">" + esc(match.mode) + " · " + esc(level.difficulty) + "</p><h1>Level " + level.id + " · " + esc(level.code) + "</h1><p>" + esc(level.mission) + "</p></div>" +
      "<div class=\"meters\">" + meters +
      "<button type=\"button\" data-action=\"mute\" data-focus=\"mute\">" + (progress.mute ? "Sound off" : "Sound on") + "</button>" +
      "<a class=\"button quiet\" href=\"#/\">Desk</a></div></header>" +
      "<div class=\"layout\"><section>" + map(match, level, plan, live, stage) + timeline(match, level) + "</section>" +
      "<section class=\"console\" data-tone=\"" + tone + "\" aria-label=\"Rescue console\">" +
      consoleBody(match, level, plan, live, fresh, stage) +
      "</section></div></main>";
  }

  function meter(label, value) {
    return "<div class=\"meter\"><span>" + esc(label) + "</span><b>" + esc(value) + "</b></div>";
  }

  function consoleBody(match, level, plan, live, fresh, stage) {
    var html = "<div class=\"radio\"><h2>Radio briefing</h2><p>" + esc(level.radio) + "</p>" +
      "<button type=\"button\" data-action=\"radio\" data-focus=\"radio\">Play radio briefing</button>" +
      "<p class=\"caption\" id=\"sound-caption\">Sound caption: " + esc(match.caption) + "</p></div>";
    html += "<div class=\"status\" data-tone=\"" + esc(match.messageTone) + "\" role=\"" + (match.messageTone === "bad" ? "alert" : "status") + "\">" + esc(match.message) + "</div>";
    if (match.phase === "fail") {
      html += "<div class=\"reading\"><h2>Why the mission failed</h2><p>" + esc(match.failReason) + "</p></div>";
    }
    html += "<h2>Public rules</h2><ul class=\"rules\">" + level.brief.map(function (line) {
      return "<li>" + esc(line) + "</li>";
    }).join("") + "</ul>";
    if (level.coop) html += "<div class=\"callout\"><h2>Pair stop</h2><p>" + esc(level.coop) + "</p></div>";
    if (match.phase === "play" || match.phase === "animating") html += controls(match, level, plan);
    html += readings(match, live, fresh, stage);
    if (match.predictionNote) html += "<div class=\"reading\"><h2>Prediction check</h2><p>" + esc(match.predictionNote) + "</p></div>";
    html += questionsBlock(match);
    if (match.phase === "report") html += reportExtra(match, level);
    if (match.phase === "fail") html += "<button type=\"button\" class=\"primary\" data-action=\"retry\" data-focus=\"retry\">Retry level</button>";
    if (match.phase === "animating") html += "<p>Crossing in progress. Controls stay locked so this action cannot be charged twice.</p>";
    html += "<p class=\"foot-note\">Tab reaches every control. Diagram supports also have labeled buttons. Animations follow the reduced-motion setting on this device.</p>";
    return html;
  }

  function controls(match, level, plan) {
    var html = "<h2>Actions</h2><div class=\"stack\">";
    if (level.blueprints.length > 1) {
      level.blueprints.forEach(function (item) {
        var selected = match.blueprintId === item.id;
        var detail = selected ? "This is the working plan. " + item.detail : item.detail;
        if (!selected && match.blueprintPicks > 0) detail += " Switching costs 1 action turn and returns kits from the current plan.";
        if (!selected && match.blueprintPicks === 0) detail += " The first plan is free.";
        html += button({
          focus: "plan-" + item.id,
          action: "blueprint",
          id: item.id,
          label: (selected ? "Using " : "Choose ") + item.name,
          detail: detail,
          disabled: match.phase !== "play"
        });
      });
    }
    match.vehicles.forEach(function (vehicle) {
      var demand = "West " + vehicle.demands.west + ", center " + vehicle.demands.center + ", east " + vehicle.demands.east + ".";
      html += button({
        focus: "vehicle-" + vehicle.id,
        action: "vehicle",
        id: vehicle.id,
        label: (match.activeVehicleId === vehicle.id ? "Selected: " : "Select ") + vehicle.name + (vehicle.status === "released" ? " (across)" : ""),
        detail: vehicle.note + " " + demand,
        disabled: match.phase !== "play" || vehicle.status !== "waiting"
      });
    });
    if (plan) {
      html += "<div class=\"reading\"><h2>Supports on this plan</h2><ul class=\"plain-list\">" + plan.supports.map(function (support) {
        var onBridge = support.builtIn || match.installed.indexOf(support.id) !== -1;
        var washed = support.temporary && Rules.currentStage(match) === "flood";
        return "<li>" + supportLine(support) + (washed ? " Washed out." : onBridge ? " In place." : " Not installed.") + "</li>";
      }).join("") + "</ul></div>";
      plan.supports.forEach(function (support) {
        if (support.builtIn) return;
        var installed = match.installed.indexOf(support.id) !== -1;
        var action = installed ? "remove" : "install";
        var turns = support.turns;
        var materials = installed ? 0 : support.material;
        var detail = Rules.preview(match, turns, materials) + " " + (support.detail || "");
        if (installed) detail = "Remove returns " + support.material + " kit(s). " + detail;
        var floodBlocked = !installed && support.temporary && Rules.currentStage(match) === "flood";
        html += button({
          focus: action + "-" + support.id,
          action: action,
          id: support.id,
          label: (installed ? "Remove " : "Install ") + support.name,
          detail: floodBlocked ? "Blocked: the flood has removed temporary works. " + detail : detail,
          disabled: match.phase !== "play" || floodBlocked || Rules.preview(match, turns, materials).indexOf("Blocked") !== -1
        });
      });
    }
    if (level.split && !match.splitOpen) {
      html += button({
        focus: "split",
        action: "split",
        label: "Split into two trucks",
        detail: Rules.preview(match, 1, 0) + " Supply A and Supply B will each demand west 4, center 8, east 4.",
        disabled: match.phase !== "play" || Rules.preview(match, 1, 0).indexOf("Blocked") !== -1
      });
    }
    if (level.split && match.splitOpen) {
      var sent = match.vehicles.some(function (vehicle) { return vehicle.status === "released"; });
      html += button({
        focus: "recombine",
        action: "recombine",
        label: "Recombine into one heavy truck",
        detail: Rules.preview(match, 1, 0) + " Center demand returns to 14. Unavailable after a split truck has crossed.",
        disabled: match.phase !== "play" || sent || Rules.preview(match, 1, 0).indexOf("Blocked") !== -1
      });
    }
    var needPrediction = level.requirePrediction && !match.tests.length && !match.prediction;
    html += button({
      focus: "test",
      action: "test",
      label: "Test selected vehicle",
      detail: Rules.preview(match, level.testCost, 0) + (level.testCost === 0 ? " Retests on this mission are free." : "") + (needPrediction ? " Mark a predicted weak point first." : ""),
      disabled: match.phase !== "play" || !plan || needPrediction || Rules.preview(match, level.testCost, 0).indexOf("Blocked") !== -1
    });
    if (level.requirePrediction && !match.tests.length) {
      level.sections.forEach(function (section) {
        html += button({
          focus: "predict-" + section.id,
          action: "predict",
          id: section.id,
          label: (match.prediction === section.id ? "Predicted: " : "Predict ") + section.name,
          detail: "Free. Required before the first test. You can change it until that test.",
          disabled: match.phase !== "play" || !plan
        });
      });
    }
    var releaseDetail = Rules.preview(match, level.releaseCost, 0);
    var releaseDisabled = match.phase !== "play" || !Rules.testIsFresh(match) || releaseDetail.indexOf("Blocked") !== -1;
    if (level.requirePrediction) {
      var answer = match.answers.gate;
      var answered = answer && answer.correct && answer.forSignature === Rules.currentSignature(match);
      if (!answered) releaseDisabled = true;
      releaseDetail += answered ? " The explanation is recorded." : " Answer the matching explanation first.";
    }
    if (!Rules.testIsFresh(match)) releaseDetail += " A current passing test is required.";
    html += button({
      focus: "release",
      action: "release",
      label: "Release " + (Rules.activeVehicle(match) ? Rules.activeVehicle(match).name : "vehicle"),
      detail: releaseDetail,
      disabled: releaseDisabled
    });
    if (level.waitCost) {
      html += button({
        focus: "wait",
        action: "wait",
        label: "Wait one turn",
        detail: Rules.preview(match, level.waitCost, 0) + " Use this to let the flood arrive without building.",
        disabled: match.phase !== "play" || Rules.preview(match, level.waitCost, 0).indexOf("Blocked") !== -1
      });
    }
    html += "</div>";
    return html;
  }

  function readings(match, live, fresh, stage) {
    var html = "";
    if (live) {
      var title = fresh ? "Official test — current bridge" : "Plan rating — not a release test yet";
      if (stage === "flood") title = (fresh ? "Official post-flood test" : "Ratings after the flood");
      if (match.phase === "report") title = "Final ratings";
      if (match.phase === "fail") title = "Ratings when the run stopped";
      html += readingTable(title, live.sections);
    }
    if (match.lastTest && !fresh) {
      html += "<div class=\"expired\"><h2>Expired test</h2><p>" + esc(match.lastTest.vehicleName) + " at turn " + match.lastTest.turn + ", stage " + match.lastTest.stage + ". " + esc(match.lastTest.note) + "</p></div>";
      html += readingTable("Expired readings", match.lastTest.sections);
    }
    return html;
  }

  function reportExtra(match, level) {
    var failed = null;
    var passed = null;
    match.tests.forEach(function (test) {
      if (!test.passed && !failed) failed = test;
      if (test.passed) passed = test;
    });
    var html = "<div class=\"reading\"><h2>Action report</h2><ul class=\"plain-list\">";
    html += "<li>Result: all waiting vehicles have crossed.</li>";
    if (match.prediction) html += "<li>Prediction: " + esc(match.prediction) + " on the " + esc(match.predictionBlueprint || "selected") + " plan.</li>";
    html += "<li>Kits left: " + match.materials + " of " + match.startMaterials + ". Action turns spent: " + match.turnsSpent + ".</li>";
    if (level.turnMode === "clock") html += "<li>Turn counter ended at " + match.turn + ". Flood " + (match.floodApplied ? "had arrived." : "had not arrived.") + "</li>";
    html += "</ul></div>";
    if (Rules.debrief(match)) html += "<div class=\"callout\"><h2>Route comparison</h2><p>" + esc(Rules.debrief(match)) + "</p></div>";
    html += bars(failed, "Before the revision");
    html += bars(passed, passed && failed ? "After the revision" : "Passing test");
    if (match.log.length) {
      html += "<h2>Action log</h2><ol class=\"log\">" + match.log.map(function (entry) {
        return "<li>" + esc(entry.label) + " — kits " + entry.materials + (level.turnMode === "clock" ? ", counter " + entry.clock : ", turns left " + entry.turnsLeft) + "</li>";
      }).join("") + "</ol>";
    }
    var ready = Rules.questionsComplete(match);
    html += "<button type=\"button\" class=\"primary\" data-action=\"finish\" data-focus=\"finish\"" + (ready ? "" : " disabled") + ">" +
      (match.mode === "mission" ? "Save mission and return" : "Finish practice") +
      "<small>" + (ready ? "Both checks match this run." : "Answer the report questions first. A wrong answer can be tried again.") + "</small></button>";
    return html;
  }

  function timeline(match, level) {
    if (level.turnMode !== "clock") return "";
    var cells = "";
    var turn = 1;
    for (turn = 1; turn <= 15; turn += 1) {
      var now = String(match.phase === "animating" ? match.turn - 1 : match.turn) === String(turn);
      cells += "<li data-now=\"" + (match.turn === turn) + "\" data-flood=\"" + (turn === level.floodTurn) + "\" data-past=\"" + (turn < match.turn) + "\">" +
        turn + (turn === level.floodTurn ? " flood" : "") + "</li>";
    }
    return "<div class=\"sheet\" style=\"margin-top:0.6rem\"><h2>Turn line</h2><p>The flood arrives at the start of turn 5. Evacuation closes at the start of turn 16. Highlighted cell: current turn.</p><ol class=\"timeline\">" + cells + "</ol></div>";
  }

  function map(match, level, plan, live, stage) {
    var deck = { west: [150, 290], center: [290, 450], east: [450, 610] };
    var slots = { west: 210, center: 370, east: 530 };
    var colors = { ok: "#2f6f4e", "at-capacity": "#c47b12", overload: "#9d2c22", none: "#8d7a55" };
    var sections = "";
    ["west", "center", "east"].forEach(function (id) {
      var found = live ? live.sections.filter(function (section) { return section.id === id; })[0] : null;
      var fill = found ? colors[found.status] : colors.none;
      var predict = level.requirePrediction && !match.tests.length;
      var label = (level.sections.filter(function (section) { return section.id === id; })[0] || {}).name || id;
      if (predict && plan) {
        sections += "<g tabindex=\"0\" role=\"button\" data-action=\"predict\" data-id=\"" + id + "\" data-focus=\"map-predict-" + id + "\" aria-label=\"Predict " + esc(label) + " as the weak point\">";
      } else sections += "<g>";
      sections += "<rect x=\"" + deck[id][0] + "\" y=\"168\" width=\"" + (deck[id][1] - deck[id][0]) + "\" height=\"18\" fill=\"" + fill + "\" stroke=\"#1b1712\"></rect>";
      if (found && found.status === "overload") {
        sections += "<path d=\"M" + (deck[id][0] + 10) + " 168 l16 18 M" + (deck[id][0] + 36) + " 168 l16 18 M" + (deck[id][0] + 62) + " 168 l16 18\" stroke=\"#f4ecdc\" stroke-width=\"2\"></path>";
      }
      if (match.prediction === id) sections += "<circle cx=\"" + ((deck[id][0] + deck[id][1]) / 2) + "\" cy=\"150\" r=\"8\" fill=\"#ffb703\" stroke=\"#1b1712\"></circle>";
      if (match.lastTest && match.lastTest.weakestId === id) {
        sections += "<path d=\"M" + ((deck[id][0] + deck[id][1]) / 2) + " 214 l8 12 h-16 z\" fill=\"" + (Rules.testIsFresh(match) ? "#9d2c22" : "#66788a") + "\"></path>";
      }
      sections += "</g>";
    });

    var piers = "";
    var optionalCount = { west: 0, center: 0, east: 0 };
    if (plan) {
      plan.supports.forEach(function (support) {
        var installed = support.builtIn || match.installed.indexOf(support.id) !== -1;
        var washed = support.temporary && stage === "flood";
        var x = slots[support.section] - 18;
        if (!support.builtIn) {
          x = slots[support.section] + 14 + optionalCount[support.section] * 42;
          optionalCount[support.section] += 1;
        }
        var clickable = !support.builtIn && match.phase === "play";
        var action = installed && !support.builtIn ? "remove" : "install";
        if (clickable) {
          piers += "<g tabindex=\"0\" role=\"button\" data-action=\"" + action + "\" data-id=\"" + esc(support.id) + "\" data-focus=\"map-" + esc(support.id) + "\" aria-label=\"" + esc((installed ? "Remove " : "Install ") + support.name) + "\">";
        } else piers += "<g>";
        if (clickable) piers += "<rect x=\"" + (x - 8) + "\" y=\"160\" width=\"40\" height=\"110\" fill=\"transparent\"></rect>";
        piers += "<rect x=\"" + x + "\" y=\"186\" width=\"22\" height=\"70\" fill=\"" + (washed ? "#8aa0ad" : installed ? "#6b5436" : "none") + "\" stroke=\"#1b1712\" stroke-width=\"2\" stroke-dasharray=\"" + (support.temporary ? "4 3" : "0") + "\"></rect>";
        if (washed) piers += "<path d=\"M" + x + " 190 l22 62 M" + (x + 22) + " 190 l-22 62\" stroke=\"#9d2c22\" stroke-width=\"3\"></path>";
        if (!support.builtIn) {
          var mapWord = support.shortName.split(" ").slice(-1)[0];
          piers += "<text x=\"" + (x - 8) + "\" y=\"312\" font-size=\"16\" fill=\"#1b1712\">" + esc(mapWord) + "</text>";
        }
        piers += "</g>";
      });
    }

    var trucks = "";
    var queue = 0;
    var park = 0;
    match.vehicles.forEach(function (vehicle) {
      var crossing = match.phase === "animating" && match.releaseVehicleId === vehicle.id;
      if (crossing || (vehicle.status === "waiting" && vehicle.id === match.activeVehicleId)) {
        trucks += truck(vehicle, 46, 136, crossing);
      } else if (vehicle.status === "waiting") {
        trucks += truck(vehicle, 16, 96 + queue * 30, false);
        queue += 1;
      } else {
        trucks += truck(vehicle, 640, 96 + park * 30, false);
        park += 1;
      }
    });

    var flood = stage === "flood";
    var waterY = flood ? 150 : 210;
    var waterH = flood ? 130 : 70;
    var title = "River crossing, " + (plan ? plan.name : "no plan selected") + (flood ? ", flood stage" : ", before the flood") + ".";
    return "<div class=\"map-frame\"><svg viewBox=\"0 0 720 340\" role=\"img\" aria-label=\"" + esc(title) + "\">" +
      "<rect width=\"720\" height=\"320\" fill=\"#efe4cf\"></rect>" +
      "<path d=\"M0 70 L140 48 L250 78 L390 40 L520 72 L720 46 L720 0 L0 0 Z\" fill=\"#d5dfd2\"></path>" +
      "<rect x=\"0\" y=\"186\" width=\"150\" height=\"22\" fill=\"#8d7a55\"></rect>" +
      "<rect x=\"610\" y=\"186\" width=\"110\" height=\"22\" fill=\"#8d7a55\"></rect>" +
      "<rect class=\"water\" x=\"140\" y=\"" + waterY + "\" width=\"470\" height=\"" + waterH + "\" fill=\"" + (flood ? "#0e3f52" : "#1f6f86") + "\"></rect>" +
      "<text x=\"24\" y=\"36\" fill=\"#1b1712\" font-size=\"18\">Depot</text>" +
      "<text x=\"560\" y=\"36\" fill=\"#1b1712\" font-size=\"18\">Village</text>" +
      (flood ? "<text x=\"250\" y=\"120\" fill=\"#0e3f52\" font-size=\"16\">Flood — temporary supports out</text>" : "<text x=\"168\" y=\"248\" fill=\"#f4ecdc\" font-size=\"16\">Channel</text>") +
      (level.floodTurn ? "<text x=\"160\" y=\"132\" fill=\"#0e3f52\" font-size=\"16\">Flood line: start of turn " + level.floodTurn + "</text>" : "") +
      sections + piers + trucks +
      "</svg><p class=\"foot-note\" style=\"color:#1b1712\">Gold dot: your prediction. Triangle: busiest section on the latest test. Dashed pier: temporary, and it fails at the flood. A pier you can click is repeated as a labeled button.</p></div>";
  }

  function truck(vehicle, x, y, moving) {
    var paint = "#f7f3ea";
    if (vehicle.id === "heavy" || vehicle.id.indexOf("light") === 0) paint = "#8a6232";
    if (vehicle.id === "medic") paint = "#d5e4cf";
    if (vehicle.id === "cart") paint = "#4d6a4a";
    if (vehicle.id === "bus") paint = "#e6c15a";
    return "<g transform=\"translate(" + x + " " + y + ")\"><g class=\"truck" + (moving ? " is-moving" : "") + "\">" +
      "<rect width=\"46\" height=\"20\" fill=\"" + paint + "\" stroke=\"#1b1712\"></rect>" +
      "<rect x=\"30\" y=\"4\" width=\"16\" height=\"14\" fill=\"#d9d3c6\" stroke=\"#1b1712\"></rect>" +
      "<circle cx=\"12\" cy=\"22\" r=\"4\" fill=\"#1b1712\"></circle><circle cx=\"34\" cy=\"22\" r=\"4\" fill=\"#1b1712\"></circle>" +
      (vehicle.id === "med-van" || vehicle.id === "medic" ? "<path d=\"M16 10 h6 M19 7 v6\" stroke=\"#9d2c22\" stroke-width=\"2\"></path>" : "") +
      "</g></g>";
  }

  function render(ctx) {
    if (ctx.page === "course") return course();
    if (ctx.page === "guide") return guide();
    if (ctx.page === "locked") return locked(ctx.lockedId);
    if (ctx.page === "play" && ctx.match) return play(ctx.match, ctx.progress);
    return home(ctx.progress);
  }

  return { render: render };
});
