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
    if (!progress.done[4] && !progress.done["4"]) return 4;
    return 1;
  }

  function done(progress, id) {
    return !!(progress.done[id] || progress.done[String(id)]);
  }

  var scenes = [
    { art: "storm", lines: ["The storm has passed.", "The bridge to the village is gone."] },
    { art: "clinic", lines: ["The clinic is across the river.", "The medicine van is still on this side."] },
    { art: "you", lines: ["You have to get the van across.", "The water is still rising."], go: "#/play/1/mission", cta: "Start level 1" },
    { art: "cargo", lines: ["The medicine is across.", "The next truck is too heavy for the center span."], go: "#/play/2/mission", cta: "Start level 2" },
    { art: "flood", lines: ["The flood will take the wood.", "You choose which stone supports stay."], go: "#/play/3/mission", cta: "Design the bridge" }
  ];

  function levelSelect(progress) {
    var levels = [
      { id: 1, name: "Beam", line: "A longer span carries less. Posts make it shorter.", href: "#/intro/0" },
      { id: 2, name: "Arch", line: "The center is too deep for a post. Raise the crown.", href: "#/intro/5" },
      { id: 3, name: "Flood", line: "Wood washes away. Stone stays.", href: "#/intro/6" },
      { id: 4, name: "Truss", line: "A triangle helps only the span under it.", href: "#/intro/8" }
    ];
    return "<main id=\"main\" class=\"boot\" tabindex=\"-1\">" +
      "<div class=\"boot-card\">" +
      "<a class=\"back-link\" href=\"#/\">Title</a>" +
      "<h1>Choose a level</h1>" +
      "<p class=\"boot-line\">Start with level 1, or open any crossing.</p>" +
      "<div class=\"level-grid\">" +
      levels.map(function (level) {
        var cleared = done(progress, level.id);
        return "<a class=\"level-card" + (level.id === 1 ? " is-first" : "") + (cleared ? " is-done" : "") + "\" href=\"" + level.href + "\">" +
          levelMark(level.id) +
          "<b>" + level.id + " · " + esc(level.name) + "</b>" +
          "<small>" + esc(level.line) + "</small>" +
          (cleared ? "<em>Cleared</em>" : "") +
          "</a>";
      }).join("") +
      "</div></div></main>";
  }

  function levelMark(id) {
    if (id === 2) return "<svg class=\"level-mark\" viewBox=\"0 0 88 48\" aria-hidden=\"true\"><path d=\"M6 40 Q44 4 82 40\" fill=\"none\" stroke=\"#2f6f4e\" stroke-width=\"6\"></path></svg>";
    if (id === 3) return "<svg class=\"level-mark\" viewBox=\"0 0 88 48\" aria-hidden=\"true\"><rect x=\"4\" y=\"28\" width=\"80\" height=\"14\" fill=\"#1f6f86\"></rect><rect x=\"22\" y=\"8\" width=\"10\" height=\"28\" fill=\"#3e4c57\" stroke=\"#1b1712\"></rect><rect x=\"56\" y=\"8\" width=\"10\" height=\"28\" fill=\"#3e4c57\" stroke=\"#1b1712\"></rect></svg>";
    if (id === 4) return "<svg class=\"level-mark\" viewBox=\"0 0 88 48\" aria-hidden=\"true\"><path d=\"M8 40 L28 12 L48 40 Z M40 40 L60 12 L80 40 Z\" fill=\"none\" stroke=\"#1b1712\" stroke-width=\"3\"></path></svg>";
    return "<svg class=\"level-mark\" viewBox=\"0 0 88 48\" aria-hidden=\"true\"><rect x=\"8\" y=\"18\" width=\"10\" height=\"24\" fill=\"#6b5436\" stroke=\"#1b1712\"></rect><rect x=\"70\" y=\"18\" width=\"10\" height=\"24\" fill=\"#6b5436\" stroke=\"#1b1712\"></rect><rect x=\"8\" y=\"16\" width=\"72\" height=\"8\" fill=\"#2f6f4e\" stroke=\"#1b1712\"></rect></svg>";
  }

  function titleScreen(progress, about) {
    var mission = nextMission(progress);
    var started = done(progress, 1) || done(progress, 2) || done(progress, 3);
    return "<main id=\"main\" class=\"boot\" tabindex=\"-1\">" +
      "<div class=\"boot-card\">" +
      heroMap() +
      "<h1>Floodline Rescue</h1>" +
      "<p class=\"boot-line\">A structural engineering game. A span holds a vehicle only when the load is within its strength.</p>" +
      "<div class=\"boot-choices\">" +
      "<button type=\"button\" class=\"boot-box start\" data-action=\"begin\" data-focus=\"begin\"><b>Start game</b><small>Get the vehicles across the river.</small></button>" +
      "<button type=\"button\" class=\"boot-box\" data-action=\"about\" data-focus=\"about\"><b>About game</b><small>STEM topic, what you do, and what you learn.</small></button>" +
      "</div>" +
      (started ? "<a class=\"boot-continue\" href=\"#/play/" + mission + "/mission\">Continue</a>" : "") +
      "</div>" +
      (about ? aboutDialog() : "") +
      "</main>";
  }

  function aboutDialog() {
    return "<div class=\"brief-pop\" data-action=\"close-about\">" +
      "<div class=\"brief-sheet\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"brief-title\" data-action=\"keep-about\">" +
      "<h2 id=\"brief-title\">About this game</h2>" +
      "<section class=\"about-block\"><h3>STEM topic</h3><p>Engineering, in the branch of civil engineering. The subject is structural engineering: how a beam, an arch, and a truss carry load, and how a designer checks that each part can hold the vehicle.</p></section>" +
      "<section class=\"about-block\"><h3>About the game</h3><p>A storm has damaged the bridge to a village. The student acts as the rescue engineer and builds the crossing. The game is only the setting. The decisions are the engineering checks below.</p></section>" +
      "<section class=\"about-block\"><h3>Types of knowledge</h3>" +
      "<p class=\"lo-key\"><span class=\"lo-a\">Audience</span><span class=\"lo-b\">Behavior</span><span class=\"lo-c\">Condition</span><span class=\"lo-d\">Degree</span></p>" +
      "<h4>Conceptual knowledge</h4>" +
      "<p><span class=\"lo-a\">Students</span> <span class=\"lo-b\">will be able to state how a beam bridge, an arch bridge, and a truss carry load</span> <span class=\"lo-c\">after building each of those crossings</span>, <span class=\"lo-d\">by correctly identifying that a longer beam span carries less, a higher arch rise carries more than a flat beam of the same span, and a triangle raises the capacity of only the span under it</span>.</p>" +
      "<h4>Problem-solving knowledge</h4>" +
      "<p><span class=\"lo-a\">Students</span> <span class=\"lo-b\">will be able to get the vehicle across</span> <span class=\"lo-c\">by selecting a structure and a material for the constraint on that crossing</span>, <span class=\"lo-d\">until the load on every part is less than or equal to its capacity</span>.</p>" +
      "</section>" +
      "<button type=\"button\" class=\"primary\" data-action=\"close-about\" data-focus=\"close-about\">Close</button>" +
      "</div></div>";
  }

  function storyScreen(step) {
    var scene = scenes[step] || scenes[0];
    var last = scene.go;
    var nextHash = last || ("#/story/" + (step + 1));
    var label = scene.cta || "Continue";
    var dots = "";
    if (step < 3) {
      dots = [0, 1, 2].map(function (index) {
        return "<i" + (index === step ? " class=\"on\"" : "") + "></i>";
      }).join("");
    }
    return "<main id=\"main\" class=\"tale\" tabindex=\"-1\">" +
      "<div class=\"tale-card\">" +
      sceneArt(scene.art) +
      "<div class=\"tale-copy\">" +
      scene.lines.map(function (line) { return "<p>" + esc(line) + "</p>"; }).join("") +
      "</div>" +
      "<a class=\"button primary tale-next\" href=\"" + nextHash + "\">" + esc(label) + "</a>" +
      "<div class=\"dots\" aria-hidden=\"true\">" + dots + "</div>" +
      "</div></main>";
  }

  function sceneArt(kind) {
    var sky = kind === "flood" ? "#1a3a4a" : kind === "storm" ? "#24343c" : "#6e8b96";
    var rain = kind === "you" ? rainLines(4) : rainLines(8);
    var water = kind === "flood" ? 118 : kind === "cargo" ? 150 : 156;
    var truck = kind === "clinic" || kind === "you" || kind === "cargo";
    var truckColor = kind === "cargo" ? "#8a6232" : "#f7f3ea";
    var clinic = kind !== "storm";
    return "<div class=\"map-frame tale-art\"><svg class=\"scene\" viewBox=\"0 0 720 280\" role=\"img\" aria-label=\"Story scene\">" +
      "<rect width=\"720\" height=\"280\" fill=\"" + sky + "\"></rect>" +
      "<path d=\"M0 100 L140 70 L260 108 L400 64 L560 96 L720 70 L720 0 L0 0 Z\" fill=\"#c5d0c4\" opacity=\"0.85\"></path>" +
      "<g class=\"rain\">" + rain + "</g>" +
      "<rect x=\"250\" y=\"" + water + "\" width=\"230\" height=\"" + (260 - water) + "\" fill=\"#1f6f86\"></rect>" +
      "<path class=\"waves\" d=\"M250 " + (water + 16) + " H480 M250 " + (water + 36) + " H480\" fill=\"none\" stroke=\"#d7eef5\" stroke-width=\"3\" stroke-dasharray=\"16 12\"></path>" +
      "<rect x=\"0\" y=\"168\" width=\"250\" height=\"22\" fill=\"#8d7a55\"></rect>" +
      "<rect x=\"480\" y=\"168\" width=\"240\" height=\"22\" fill=\"#8d7a55\"></rect>" +
      (truck ? "<g transform=\"translate(70 140)\"><rect width=\"54\" height=\"22\" fill=\"" + truckColor + "\" stroke=\"#1b1712\"></rect><circle cx=\"12\" cy=\"24\" r=\"4\" fill=\"#1b1712\"></circle><circle cx=\"40\" cy=\"24\" r=\"4\" fill=\"#1b1712\"></circle></g>" : "") +
      (kind === "you" ? "<g transform=\"translate(36 132)\"><circle cx=\"10\" cy=\"8\" r=\"6\" fill=\"#f4ecdc\" stroke=\"#1b1712\"></circle><rect x=\"4\" y=\"16\" width=\"12\" height=\"18\" fill=\"#ffb703\" stroke=\"#1b1712\"></rect></g>" : "") +
      (clinic ? "<g transform=\"translate(560 124)\"><rect width=\"48\" height=\"44\" fill=\"#f7f1e4\" stroke=\"#1b1712\"></rect><path d=\"M78 18 h10 M83 13 v10\" transform=\"translate(-70 -4)\" stroke=\"#9d2c22\" stroke-width=\"3\"></path></g>" : "") +
      "</svg></div>";
  }

  function heroMap() {
    return "<div class=\"map-frame\"><svg class=\"scene\" viewBox=\"0 0 720 280\" role=\"img\" aria-label=\"A river gap between a rescue van and a clinic\">" +
      "<rect width=\"720\" height=\"280\" fill=\"#efe4cf\"></rect>" +
      "<path d=\"M0 90 L120 70 L200 100 L250 60 L360 90 L480 50 L600 86 L720 64 L720 0 L0 0 Z\" fill=\"#c8d3c0\"></path>" +
      "<g class=\"rain\">" + rainLines(6) + "</g>" +
      "<g class=\"pond\"><rect x=\"250\" y=\"150\" width=\"230\" height=\"90\" fill=\"#1f6f86\"></rect>" +
      "<path class=\"waves\" d=\"M250 168 H480 M250 188 H480 M250 208 H480\" fill=\"none\" stroke=\"#d7eef5\" stroke-width=\"3\" stroke-dasharray=\"16 12\"></path></g>" +
      "<rect x=\"0\" y=\"150\" width=\"250\" height=\"24\" fill=\"#8d7a55\"></rect>" +
      "<rect x=\"480\" y=\"150\" width=\"240\" height=\"24\" fill=\"#8d7a55\"></rect>" +
      "<rect x=\"70\" y=\"126\" width=\"54\" height=\"24\" fill=\"#f7f3ea\" stroke=\"#1b1712\"></rect>" +
      "<rect x=\"108\" y=\"132\" width=\"22\" height=\"16\" fill=\"#d8d2c4\" stroke=\"#1b1712\"></rect>" +
      "<rect x=\"560\" y=\"118\" width=\"46\" height=\"32\" fill=\"#f7f1e4\" stroke=\"#1b1712\"></rect>" +
      "</svg></div>";
  }

  function rainLines(rows) {
    var lines = "";
    var i;
    for (i = 0; i < rows; i += 1) {
      lines += "<line class=\"drop\" x1=\"" + (40 + i * 110) + "\" y1=\"8\" x2=\"" + (28 + i * 110) + "\" y2=\"28\" stroke=\"#7aa0b4\" stroke-width=\"2\"></line>";
    }
    return lines;
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
      "<p>Finish the previous level first. Practice still opens this level.</p>" +
      "<div class=\"actions\"><a class=\"button primary\" href=\"#/\">Title</a><a class=\"button\" href=\"#/play/" + id + "/practice\">Practice this level</a></div></article></main>";
  }

  var SHORT = {
    timber: "Timber bridge",
    steel: "Steel bridge",
    "center-clamp": "center post",
    "east-shoe": "east support",
    "center-post": "center post",
    "west-knee": "west brace",
    "temp-bent": "wood post",
    "temp-brace": "wood brace",
    "center-tower": "stone tower",
    "east-plate": "east stone",
    "med-van": "medicine van",
    heavy: "heavy truck",
    "light-a": "light truck A",
    "light-b": "light truck B",
    medic: "medic jeep",
    cart: "supply cart",
    crane: "crane truck",
  };

  function shortName(id, fallback) {
    return SHORT[id] || fallback;
  }

  function placeName(id) {
    if (id === "west") return "West";
    if (id === "center") return "Center";
    return "East";
  }

  function button(spec) {
    var blocked = spec.disabled ? " data-blocked=\"1\" aria-disabled=\"true\" class=\"is-blocked\"" : "";
    var detail = spec.detail ? "<small>" + esc(spec.detail) + "</small>" : "";
    return "<button type=\"button\" data-focus=\"" + esc(spec.focus) + "\" data-action=\"" + esc(spec.action) + "\" data-id=\"" + esc(spec.id || "") + "\"" + blocked + ">" +
      esc(spec.label) + detail + "</button>";
  }

  function payHint(match, turns, materials) {
    var preview = Rules.preview(match, turns, materials);
    if (preview.indexOf("Blocked") !== -1) {
      if (preview.indexOf("kit") !== -1) return "Not enough materials";
      return "No moves left";
    }
    var bits = [];
    if (materials) bits.push(materials + " material");
    if (turns) bits.push(turns + " move");
    return bits.join(" · ");
  }

  function lineStatus(match, live) {
    if (match.phase === "animating") return "车正在过桥";
    if (match.phase === "fail") return "来不及了";
    if (match.phase === "report") return "送到了";
    if (!Rules.blueprint(match)) return "先选一座桥";
    var level = Levels.getLevel(match.levelId);
    if (level.requirePrediction && !match.tests.length && !match.prediction) return "点桥面，猜最容易断的一段";
    if (live && live.weakest.demand > live.weakest.capacity) {
      return placeName(live.weakest.id) + " 撑不住：" + live.weakest.demand + " > " + live.weakest.capacity;
    }
    if (Rules.testIsFresh(match)) return "能过，可以发车";
    if (match.lastTest) return "桥变了，再测一次";
    return "测一下，再发车";
  }

  function weakIds(live) {
    if (!live) return [];
    return live.sections.filter(function (section) { return section.demand > section.capacity; }).map(function (section) { return section.id; });
  }

  function playStep(plan, live) {
    if (!plan) return "choose";
    if (!live || !live.passed) return "fix";
    return "send";
  }

  function stepBar(step) {
    var items = [
      { id: "choose", n: 1, label: "Choose a bridge" },
      { id: "fix", n: 2, label: "Fix the red span" },
      { id: "send", n: 3, label: "Send" }
    ];
    var order = { choose: 0, fix: 1, send: 2 };
    return "<ol class=\"steps\">" + items.map(function (item) {
      var cls = item.id === step ? "is-now" : (order[item.id] < order[step] ? "is-done" : "");
      return "<li class=\"" + cls + "\"><b>" + item.n + "</b> " + item.label + "</li>";
    }).join("") + "</ol>";
  }

  function guideLine(match, level, plan, live) {
    if (match.phase === "animating") return "The vehicle is crossing.";
    if (match.phase === "fail") return "Time ran out before every vehicle crossed.";
    if (match.phase === "report") return "Done. Every span carried its load within its strength.";
    if (!plan) return "Start here: pick a bridge.";
    if (!live) return "Pick a bridge.";
    var names = weakIds(live).map(placeName);
    if (!live.passed && match.installed.indexOf("center-clamp") !== -1 && names.indexOf("East") !== -1) {
      return "East is still red. The Center piece does not help East. Drag +4 East onto the red span.";
    }
    if (!live.passed && match.installed.indexOf("west-knee") !== -1 && names.indexOf("Center") !== -1) {
      return "Center is still red. The West piece does not help Center.";
    }
    if (!live.passed && level.id === 2) return names.join(" and ") + " is red. Drag the Center piece onto it, or split the truck.";
    if (!live.passed && level.id === 3) return names.join(" and ") + " is red. Drag the stone for that span onto it.";
    if (!live.passed) {
      var weak = live.sections.filter(function (section) { return section.demand > section.capacity; })[0];
      return placeName(weak.id) + " is red. Load " + weak.demand + " is above strength " + weak.capacity + ". Drag the " + placeName(weak.id) + " piece onto it.";
    }
    return "The bridge can hold this vehicle. Press Send.";
  }

  function addedStrength(plan, installed, stage, sectionId) {
    var full = Model.capacities(plan.supports, installed, stage);
    var base = Model.capacities(plan.supports.filter(function (support) { return support.builtIn; }), [], stage);
    return full[sectionId] - base[sectionId];
  }

  function supportAdd(support) {
    var total = 0;
    ["west", "center", "east"].forEach(function (id) { total += support.capacity[id] || 0; });
    return total;
  }

  function guideLevel3(match, live) {
    var vehicle = Rules.activeVehicle(match);
    var name = shortName(vehicle.id, vehicle.name);
    if (!live.passed) {
      var weak = live.sections.filter(function (section) { return section.demand > section.capacity; })[0];
      return "Drag a material onto " + placeName(weak.id) + ". Load " + weak.demand + " is above strength " + weak.capacity + ".";
    }
    return name + " can cross. Press Send.";
  }

  function readout(live, match, plan, stage) {
    if (!live) return "";
    return "<div class=\"readout\">" + live.sections.map(function (section) {
      var bad = section.demand > section.capacity;
      var extra = "";
      if (plan && match.levelId === 3) {
        var added = addedStrength(plan, match.installed, stage, section.id);
        if (added) extra = " (+" + added + ")";
      }
      var words = bad ? "too heavy · " : "";
      return "<span class=\"" + (bad ? "bad" : "") + "\"><b>" + placeName(section.id) + "</b><small>" + words + "load " + section.demand + " · strength " + section.capacity + extra + "</small></span>";
    }).join("") + "</div>";
  }

  function levelVehicle(level) {
    if (level.id === 3) {
      var bus = level.vehicles.filter(function (item) { return item.id === "bus"; })[0];
      if (bus) return bus;
    }
    return level.vehicles[0];
  }

  function buildScreen(match, progress, level) {
    var vehicle = levelVehicle(level);
    var flooded = !!match.build.flooded;
    var view = FloodBuild.evaluate(match.build, vehicle.demands);
    var moving = match.phase === "animating";
    var deck = "<line x1=\"" + FloodBuild.left + "\" y1=\"" + FloodBuild.deckY + "\" x2=\"" + FloodBuild.right + "\" y2=\"" + FloodBuild.deckY + "\" stroke=\"#8d7a55\" stroke-width=\"2\" stroke-dasharray=\"6 6\" pointer-events=\"none\"></line>";
    var bands = "";
    view.zones.forEach(function (zone, index) {
      var bad = zone.demand > zone.strength;
      bands += "<rect x=\"" + zone.x1 + "\" y=\"150\" width=\"" + (zone.x2 - zone.x1) + "\" height=\"130\" fill=\"" + (bad ? "rgba(157,44,34,0.34)" : "rgba(255,255,255,0.08)") + "\" pointer-events=\"none\"></rect>";
      if (index < view.zones.length - 1) {
        bands += "<line x1=\"" + zone.x2 + "\" y1=\"150\" x2=\"" + zone.x2 + "\" y2=\"280\" stroke=\"#d7eef5\" stroke-width=\"2\" stroke-dasharray=\"4 5\" pointer-events=\"none\"></line>";
      }
      bands += "<text x=\"" + zone.mid + "\" y=\"268\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"700\" fill=\"#d7eef5\" pointer-events=\"none\">" + placeName(zone.id) + "</text>";
    });
    if (match.showHint && level.id !== 2 && level.id !== 4) {
      FloodBuild.hintFor(level.id).forEach(function (x) {
        bands += "<rect x=\"" + (x - 12) + "\" y=\"184\" width=\"24\" height=\"78\" fill=\"none\" stroke=\"#ffb703\" stroke-width=\"3\" stroke-dasharray=\"5 4\" pointer-events=\"none\"></rect>";
      });
    }
    view.planks.forEach(function (plank) {
      var hot = view.zones.some(function (zone) {
        return plank.x1 <= zone.mid && zone.mid <= plank.x2 && zone.demand > plank.strength;
      });
      deck += "<g data-action=\"build-remove-plank\" data-from=\"" + plank.from + "\" data-to=\"" + plank.to + "\" role=\"button\" tabindex=\"0\" aria-label=\"Plank strength " + plank.strength + ". Tap to take it back.\">";
      deck += "<rect x=\"" + plank.x1 + "\" y=\"160\" width=\"" + (plank.x2 - plank.x1) + "\" height=\"32\" fill=\"transparent\"></rect>";
      deck += "<rect x=\"" + plank.x1 + "\" y=\"168\" width=\"" + (plank.x2 - plank.x1) + "\" height=\"16\" fill=\"" + (hot ? "#9d2c22" : "#2f6f4e") + "\" stroke=\"#1b1712\"></rect>";
      deck += "<text x=\"" + ((plank.x1 + plank.x2) / 2) + "\" y=\"158\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"700\" fill=\"#1b1712\" pointer-events=\"none\">strength " + plank.strength + "</text></g>";
    });
    (view.arches || []).forEach(function (arch) {
      var crown = FloodBuild.deckY - arch.rise;
      var mid = (arch.x1 + arch.x2) / 2;
      var hot = view.zones.some(function (zone) {
        return arch.x1 <= zone.mid && zone.mid <= arch.x2 && zone.demand > arch.strength;
      });
      deck += "<g data-action=\"build-remove-arch\" data-id=\"" + arch.id + "\" role=\"button\" tabindex=\"0\" aria-label=\"Arch strength " + arch.strength + ". Tap to take it back.\">";
      deck += "<path d=\"M" + arch.x1 + " " + FloodBuild.deckY + " Q" + mid + " " + crown + " " + arch.x2 + " " + FloodBuild.deckY + "\" fill=\"none\" stroke=\"" + (hot ? "#9d2c22" : "#2f6f4e") + "\" stroke-width=\"14\"></path>";
      deck += "<text x=\"" + mid + "\" y=\"" + (crown - 8) + "\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"700\" fill=\"#1b1712\" pointer-events=\"none\">arch " + arch.strength + "</text></g>";
    });
    if (view.deck) {
      view.zones.forEach(function (zone) {
        deck += "<rect x=\"" + zone.x1 + "\" y=\"168\" width=\"" + (zone.x2 - zone.x1) + "\" height=\"12\" fill=\"" + (zone.demand > zone.strength ? "#9d2c22" : "#2f6f4e") + "\" pointer-events=\"none\"></rect>";
        var used = 0;
        view.trusses.forEach(function (item) {
          if (item.zone !== zone.id) return;
          var slot = (zone.x2 - zone.x1) / zone.trusses;
          var left = zone.x1 + used * slot;
          var right = left + slot;
          var top = FloodBuild.deckY + 8;
          deck += "<g data-action=\"build-remove-truss\" data-id=\"" + item.id + "\" role=\"button\" tabindex=\"0\" aria-label=\"Triangle under " + zone.id + ". Tap to take it back.\">";
          deck += "<path d=\"M" + (left + 8) + " 250 L" + ((left + right) / 2) + " " + top + " L" + (right - 8) + " 250 Z\" fill=\"none\" stroke=\"#1b1712\" stroke-width=\"4\"></path></g>";
          used += 1;
        });
      });
    }
    var labels = "";
    view.zones.forEach(function (zone) {
      var bad = zone.demand > zone.strength;
      var word = zone.strength === 0
        ? placeName(zone.id) + " needs " + zone.demand
        : placeName(zone.id) + " " + zone.demand + (bad ? " > " : " ≤ ") + zone.strength;
      labels += "<text x=\"" + zone.mid + "\" y=\"124\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"700\" fill=\"" + (bad ? "#9d2c22" : "#1b1712") + "\" pointer-events=\"none\">" +
        word + "</text>";
    });
    var piers = "<rect x=\"" + (FloodBuild.left - 16) + "\" y=\"168\" width=\"16\" height=\"70\" fill=\"#6b5436\" stroke=\"#1b1712\" pointer-events=\"none\"></rect>" +
      "<rect x=\"" + FloodBuild.right + "\" y=\"168\" width=\"16\" height=\"70\" fill=\"#6b5436\" stroke=\"#1b1712\" pointer-events=\"none\"></rect>";
    var nudgePosts = view.zones.some(function (zone) { return zone.strength > 0 && zone.demand > zone.strength; });
    view.posts.forEach(function (post) {
      piers += "<g data-drag=\"move-post\" data-id=\"" + post.id + "\" role=\"button\" tabindex=\"0\" aria-label=\"Drag this post. Drag it off the river to take it back.\">";
      piers += "<rect x=\"" + (post.x - 22) + "\" y=\"150\" width=\"44\" height=\"120\" fill=\"transparent\"></rect>";
      piers += "<rect x=\"" + (post.x - 12) + "\" y=\"184\" width=\"24\" height=\"78\" fill=\"" + (post.material === "stone" ? "#3e4c57" : "#6b5436") + "\" stroke=\"" + (nudgePosts ? "#ffb703" : "#1b1712") + "\" stroke-width=\"" + (nudgePosts ? "4" : "2") + "\"></rect></g>";
    });
    var guide = match.phase === "animating" ? "The vehicle is crossing." : match.phase === "report" ? "The vehicle is across." : buildGuide(view, level, flooded);
    var canSend = view.passed && match.phase === "play" && (level.id !== 3 || flooded);
    var overlay = "";
    if (match.phase === "report") overlay = reportVeil(match, level);
    var toast = match.toast ? "<p class=\"toast\" role=\"status\">" + esc(match.toast) + "</p>" : "";
    var send = canSend
      ? "<button type=\"button\" class=\"primary send-cross\" data-action=\"build-send\" data-focus=\"send\">Send " + esc(shortName(vehicle.id)) + "</button>"
      : "";
    return "<main id=\"main\" class=\"stage\" tabindex=\"-1\">" +
      "<div class=\"hud\"><a class=\"icon-btn\" href=\"#/\" aria-label=\"Title\">Menu</a>" +
      "<b class=\"level-pip\">" + level.id + "</b>" +
      "<button type=\"button\" class=\"icon-btn\" data-action=\"mute\" data-focus=\"mute\" aria-label=\"Sound\">" + (progress.mute ? "Sound off" : "Sound") + "</button></div>" +
      "<p class=\"guide\" role=\"status\">" + esc(guide) + "</p>" +
      "<div class=\"stage-map\"><div class=\"map-frame\"><svg class=\"scene\" viewBox=\"0 0 720 340\" role=\"group\" aria-label=\"Design the bridge\">" +
      "<rect width=\"720\" height=\"320\" fill=\"#efe4cf\"></rect>" +
      "<path d=\"M0 70 L140 48 L250 78 L390 40 L520 72 L720 46 L720 0 L0 0 Z\" fill=\"#d5dfd2\"></path>" +
      "<g class=\"rain\">" + rainLines(7) + "</g>" +
      "<rect class=\"water\" x=\"140\" y=\"150\" width=\"440\" height=\"130\" fill=\"" + (flooded ? "#14344a" : "#1f6f86") + "\"></rect>" +
      (level.id === 2 ? "<rect x=\"290\" y=\"150\" width=\"140\" height=\"130\" fill=\"#0c3040\" pointer-events=\"none\"></rect><text x=\"360\" y=\"210\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"700\" fill=\"#d7eef5\" pointer-events=\"none\">too deep</text>" : "") +
      bands +
      "<path class=\"waves\" d=\"M140 190 H580 M140 220 H580\" fill=\"none\" stroke=\"#d7eef5\" stroke-width=\"3\" stroke-dasharray=\"18 14\"></path>" +
      "<rect x=\"0\" y=\"186\" width=\"150\" height=\"22\" fill=\"#8d7a55\"></rect>" +
      "<rect x=\"570\" y=\"186\" width=\"150\" height=\"22\" fill=\"#8d7a55\"></rect>" +
      deck + labels + piers +
      truck(vehicle, 40, 130, { moving: moving, ready: canSend, drive: false }) +
      "</svg></div>" + toast + overlay + "</div>" +
      send +
      "<section class=\"toolbox\"><h2>Your pieces</h2>" + buildSteps(view, level, flooded) +
      "<div class=\"hint-row\">" +
      "<button type=\"button\" class=\"quiet\" data-action=\"build-hint\">" + (match.showHint ? "Hide hint" : "Hint") + "</button>" +
      "<button type=\"button\" class=\"primary\" data-action=\"build-solve\">Place a working bridge</button>" +
      (level.id === 3 && !flooded ? "<button type=\"button\" class=\"primary\" data-action=\"build-flood\">Flood</button>" : "") +
      "</div>" +
      (match.showHint ? "<p class=\"hint-card\">" + esc(hintText(level)) + "</p>" : "") +
      "<div class=\"basket\">" + pieceButtons(view, level, flooded) +
      "</div></section></main>";
  }

  function pieceButtons(view, level, flooded) {
    if (level.id === 2) {
      return "<button type=\"button\" class=\"token piece is-next\" data-drag=\"build-arch\">" + archIcon() + "<b>Arch</b><small>" + view.archesLeft + " left</small></button>";
    }
    if (level.id === 4) {
      return "<button type=\"button\" class=\"token piece is-next\" data-drag=\"build-truss\">" + trussIcon() + "<b>Triangle</b><small>" + view.trussesLeft + " left</small></button>";
    }
    var plankNext = view.postCount >= (level.id === 2 ? 3 : 2) && view.zones.some(function (zone) { return zone.strength === 0; });
    var plank = "<button type=\"button\" class=\"token piece" + (plankNext ? " is-next" : "") + "\" data-drag=\"build-plank\">" + plankIcon() + "<b>Plank</b><small>" + view.planksLeft + " left</small></button>";
    if (level.id !== 3) {
      return "<button type=\"button\" class=\"token piece" + (view.postCount < (level.id === 2 ? 3 : 2) ? " is-next" : "") + "\" data-drag=\"build-post\" data-material=\"wood\">" + postIcon("wood") + "<b>Post</b><small>" + view.postsLeft + " left</small></button>" + plank;
    }
    var stoneUsed = view.posts.filter(function (post) { return post.material === "stone"; }).length;
    var wood = flooded ? "" : "<button type=\"button\" class=\"token piece\" data-drag=\"build-post\" data-material=\"wood\">" + postIcon("wood") + "<b>Wood</b><small>" + view.postsLeft + " left</small></button>";
    var stone = "<button type=\"button\" class=\"token piece" + (stoneUsed < 2 ? " is-next" : "") + "\" data-drag=\"build-post\" data-material=\"stone\">" + postIcon("stone") + "<b>Stone</b><small>" + Math.max(0, 2 - stoneUsed) + " left</small></button>";
    return wood + stone + plank;
  }

  function postIcon(material) {
    var fill = material === "stone" ? "#3e4c57" : "#6b5436";
    return "<svg class=\"piece-icon\" viewBox=\"0 0 24 78\" aria-hidden=\"true\"><rect x=\"1\" y=\"1\" width=\"22\" height=\"76\" fill=\"" + fill + "\" stroke=\"#1b1712\" stroke-width=\"2\"></rect></svg>";
  }

  function archIcon() {
    return "<svg class=\"piece-icon arch\" viewBox=\"0 0 72 28\" aria-hidden=\"true\"><path d=\"M4 24 Q36 2 68 24\" fill=\"none\" stroke=\"#2f6f4e\" stroke-width=\"4\"></path></svg>";
  }

  function trussIcon() {
    return "<svg class=\"piece-icon\" viewBox=\"0 0 48 40\" aria-hidden=\"true\"><path d=\"M6 36 L24 8 L42 36 Z\" fill=\"none\" stroke=\"#1b1712\" stroke-width=\"3\"></path></svg>";
  }

  function hintText(level) {
    if (level.id === 2) return "The center is too deep for a post. Drag an arch from bank to bank and pull the crown up. A flat arch is weak. A higher arch carries more load to the banks.";
    if (level.id === 4) return "The deck is already there, and it is only strength 3. Drop a triangle on the part that is too weak. A triangle helps only that part. Center needs two.";
    if (level.id === 3) return "The dashed lines are for stone. Wood washes away. After the flood, a missing post joins the planks into one long weak piece.";
    return "Put a post on each dashed line. Drag one plank from bank to bank. The posts cut it into shorter, stronger pieces.";
  }

  function plankIcon() {
    return "<svg class=\"piece-icon plank\" viewBox=\"0 0 72 16\" aria-hidden=\"true\"><rect x=\"1\" y=\"1\" width=\"70\" height=\"14\" fill=\"#2f6f4e\" stroke=\"#1b1712\" stroke-width=\"2\"></rect></svg>";
  }

  function buildSteps(view, level, flooded) {
    if (level.id === 2) {
      var risen = (view.arches || []).some(function (arch) { return arch.rise >= 70; });
      var items2 = [
        ["Arch from bank to bank", view.arches.length ? "is-done" : "is-now"],
        ["Pull the crown up", !view.arches.length ? "" : (view.passed ? "is-done" : "is-now")],
        [view.passed ? "Press Send" : "Center still needs 14", risen || view.passed ? "is-now" : ""]
      ];
      return "<ol class=\"steps\">" + items2.map(function (item, index) {
        return "<li class=\"" + item[1] + "\">" + (index + 1) + " " + item[0] + "</li>";
      }).join("") + "</ol>";
    }
    if (level.id === 4) {
      var items4 = [
        ["Triangles on the weak parts", view.trusses.length ? "is-done" : "is-now"],
        ["Two triangles on the center", view.zones[1].trusses >= 2 ? "is-done" : (view.trusses.length ? "is-now" : "")],
        [view.passed ? "Press Send" : "Check every part", view.trusses.length ? "is-now" : ""]
      ];
      return "<ol class=\"steps\">" + items4.map(function (item, index) {
        return "<li class=\"" + item[1] + "\">" + (index + 1) + " " + item[0] + "</li>";
      }).join("") + "</ol>";
    }
    var need = level.id === 2 ? 3 : 2;
    var stone = view.posts.filter(function (post) { return post.material === "stone"; }).length;
    var postsReady = level.id === 3 ? stone >= 2 : view.postCount >= need;
    var covered = view.zones.every(function (zone) { return zone.strength > 0; });
    var last = level.id === 3 ? (flooded && view.passed ? "Press Send" : "Press Flood") : (view.passed ? "Press Send" : "Shorten a red plank");
    var first = level.id === 3 ? "Stone posts on the lines" : level.id === 2 ? "Posts on the lines and in the center" : "Posts on the two lines";
    var items = [
      [first, postsReady ? "is-done" : "is-now"],
      ["One plank from bank to bank", !postsReady ? "" : (covered ? "is-done" : "is-now")],
      [last, covered ? "is-now" : ""]
    ];
    return "<ol class=\"steps\">" + items.map(function (item, index) {
      return "<li class=\"" + item[1] + "\">" + (index + 1) + " " + item[0] + "</li>";
    }).join("") + "</ol>";
  }

  function buildGuide(view, level, flooded) {
    var open = view.zones.filter(function (zone) { return zone.strength === 0; })[0];
    var weak = view.zones.filter(function (zone) { return zone.demand > zone.strength; })[0];
    if (level.id === 3 && !flooded && view.passed) return "This holds the bus for now. Press Flood. Wood posts wash away, and the planks beside them join into one longer piece.";
    if (level.id === 3 && flooded && weak) return placeName(weak.id) + " needs " + weak.demand + ", but the joined plank is only " + weak.strength + ". Put a stone post on a dividing line.";
    if (level.id === 3 && flooded && view.passed) return "The stone posts stayed, and each load is within the plank. Press Send.";
    if (level.id === 3 && !view.postCount) return "The bus needs 6, 10, and 8. Drag stone posts onto the two dividing lines. Wood will not survive the flood.";
    if (level.id === 2 && !(view.arches || []).length) return "The center water is too deep for a post. Drag an arch from the left bank to the right bank, and pull the crown up.";
    if (level.id === 2 && weak) return placeName(weak.id) + " needs " + weak.demand + ", but this arch is only " + weak.strength + ". A flat arch acts like a weak beam. Pull the crown higher.";
    if (level.id === 2 && view.passed) return "The arch carries the load to the two banks. Press Send.";
    if (level.id === 4 && !view.trusses.length) return "This deck is one long beam, strength 3. Drop triangles on the parts that fail. A triangle helps only the part under it.";
    if (level.id === 4 && weak && weak.id === "center") return "Center needs 16. Each triangle adds 7 there, and nowhere else. This part needs two triangles.";
    if (level.id === 4 && weak) return placeName(weak.id) + " needs " + weak.demand + ", and it is only " + weak.strength + ". Put a triangle on that part.";
    if (level.id === 4 && view.passed) return "Each part's load is within its capacity. The triangles did not have to shorten the span. Press Send.";
    if (!view.postCount) return "Put a post on each dividing line. A post cuts a plank into shorter, stronger pieces.";
    if (view.postCount < (level.id === 2 ? 3 : 2) && level.id !== 3) return "Add the other post on a dividing line, then drag one plank from bank to bank.";
    if (open) return placeName(open.id) + " needs " + open.demand + ". Drag a plank from the left bank to the right bank. Posts will cut it.";
    if (weak && level.id === 2 && weak.id === "center") return "Center needs 14, but this arch is only " + weak.strength + ". Pull the crown higher. A higher arch carries more to the banks.";
    if (weak) return placeName(weak.id) + " needs " + weak.demand + ", but this plank is only " + weak.strength + ". Move a post so that piece is shorter.";
    if (level.id === 3) return "Press Flood before you send. Only the stone posts will still be standing.";
    return "Each load is within the plank over it. Press Send.";
  }

  function play(match, progress) {
    var level = Levels.getLevel(match.levelId);
    if (match.build) return buildScreen(match, progress, level);
    var plan = Rules.blueprint(match);
    var stage = Rules.visualStage(match);
    var live = plan && Rules.activeVehicle(match) ? Rules.evaluateState(match, stage) : null;
    var ended = match.phase === "report" || match.phase === "fail";
    var overlay = "";
    if (match.phase === "report") overlay = reportVeil(match, level);
    if (match.phase === "fail") {
      overlay = "<div class=\"veil\"><button type=\"button\" class=\"primary\" data-action=\"retry\" data-focus=\"retry\">Try again</button></div>";
    }
    var toast = match.toast ? "<p class=\"toast\" role=\"status\">" + esc(match.toast) + "</p>" : "";
    var step = match.phase === "play" ? playStep(plan, live) : "";
    var showCards = level.id !== 3 && step === "send";
    return "<main id=\"main\" class=\"stage\" tabindex=\"-1\">" +
      hud(match, level, progress) +
      (step ? stepBar(step) : "") +
      "<p class=\"guide\" role=\"status\">" + esc(guideLine(match, level, plan, live)) + "</p>" +
      "<div class=\"stage-map\">" +
      map(match, level, plan, live, stage) +
      readout(live, match, plan, stage) +
      toast + overlay +
      "</div>" +
      (step === "send" ? sendButton(match) : "") +
      (level.id === 3 ? "" : tray(match, level, plan, live)) +
      (showCards ? knowledgeCards(match, level) : "") +
      dock(match, level, ended) +
      level3Dock(match, level, live) +
      "</main>";
  }

  function sendButton(match) {
    if (!match || match.phase !== "play") return "";
    var active = Rules.activeVehicle(match);
    if (!active || active.status !== "waiting") return "";
    return "<button type=\"button\" class=\"primary send-cross\" data-action=\"drive\" data-id=\"" + esc(active.id) + "\" data-focus=\"send\">Send " + esc(shortName(active.id)) + "</button>";
  }

  function tray(match, level, plan, live) {
    if (!plan || match.phase !== "play") return "";
    var weak = weakIds(live);
    var pieces = plan.supports.filter(function (support) { return !support.builtIn; }).map(function (support) {
      var installed = match.installed.indexOf(support.id) !== -1;
      var add = supportAdd(support);
      var action = installed ? "remove" : "install";
      var next = !installed && weak.indexOf(support.section) !== -1;
      var drag = installed ? "" : " data-drag=\"support\" data-add=\"" + add + "\" data-section=\"" + support.section + "\"";
      return "<button type=\"button\" class=\"token" + (installed ? " is-used" : "") + (next ? " is-next" : "") + "\"" + drag + " data-action=\"" + action + "\" data-id=\"" + esc(support.id) + "\" aria-label=\"" + esc(shortName(support.id)) + " +" + add + "\">" +
        "<b>+" + add + "</b><small>" + placeName(support.section) + "</small></button>";
    }).join("");
    if (!pieces) return "";
    return "<section class=\"toolbox\"><h2>Toolbox</h2><div class=\"basket\">" + pieces + "</div></section>";
  }

  function knowledgeCards(match, level) {
    if (match.phase === "animating") return "";
    var deck = [
      { id: "load", title: "Load", body: "Load is the weight this vehicle puts on one span." },
      { id: "strength", title: "Strength", body: "A span holds when its load is less than or equal to its strength." },
      { id: "local", title: "One span", body: "A post adds strength only on the span where you drop it." }
    ];
    if (level.id === 2) deck.push({ id: "split", title: "Two trucks", body: "Two lighter trucks put less load on each span than one heavy truck." });
    if (level.id === 3) deck.push({ id: "temp", title: "Wood and stone", body: "Wood adds strength only until the flood. Stone is still there afterward, and only on the span where you place it." });
    return "<div class=\"cards\">" + deck.map(function (card) {
      var open = match.openCard === card.id ? " is-open" : "";
      return "<button type=\"button\" class=\"card" + open + "\" data-action=\"card\" data-id=\"" + card.id + "\"><b>" + card.title + "</b><small>" + card.body + "</small></button>";
    }).join("") + "</div>";
  }

  function hud(match, level, progress) {
    var beams = "";
    var i;
    for (i = 0; i < match.startMaterials; i += 1) {
      beams += "<i class=\"beam" + (i < match.materials ? "" : " spent") + "\"></i>";
    }
    var other = "";
    if (level.blueprints.length > 1 && Rules.blueprint(match) && match.phase === "play") {
      var alt = level.blueprints.filter(function (item) { return item.id !== match.blueprintId; })[0];
      other = "<button type=\"button\" class=\"icon-btn\" data-action=\"blueprint\" data-id=\"" + esc(alt.id) + "\" data-focus=\"swap\" aria-label=\"Switch to " + esc(shortName(alt.id, alt.name)) + "\">" + esc(shortName(alt.id, alt.name)) + "</button>";
    }
    return "<div class=\"hud\"><a class=\"icon-btn\" href=\"#/\" aria-label=\"Title\">Menu</a>" +
      "<span class=\"hud-stat\"><em>Materials</em><span class=\"beams\" aria-label=\"Materials\">" + beams + "</span></span>" +
      "<b class=\"level-pip\">" + level.id + "</b>" +
      other +
      "<button type=\"button\" class=\"icon-btn\" data-action=\"mute\" data-focus=\"mute\" aria-label=\"Sound\">" + (progress.mute ? "Sound off" : "Sound") + "</button></div>";
  }

  function dock(match, level, ended) {
    if (ended || match.phase === "animating" || !level.split) return "";
    if (!match.splitOpen) {
      return "<div class=\"dock\"><button type=\"button\" class=\"icon-btn split\" data-action=\"split\" data-focus=\"split\">Split into two lighter trucks</button></div>";
    }
    var sent = match.vehicles.some(function (vehicle) { return vehicle.status === "released"; });
    if (sent) return "";
    return "<div class=\"dock\"><button type=\"button\" class=\"icon-btn\" data-action=\"recombine\" data-focus=\"recombine\">Put the cargo back on one truck</button></div>";
  }

  function level3Dock(match, level, live) {
    if (level.id !== 3 || match.phase !== "play") return "";
    var plan = Rules.blueprint(match);
    if (!plan) return "";
    var stage = Rules.visualStage(match);
    var weak = weakIds(live);
    var tokens = plan.supports.filter(function (support) { return !support.builtIn; }).map(function (support) {
      var installed = match.installed.indexOf(support.id) !== -1;
      var washed = support.temporary && stage === "flood";
      var add = supportAdd(support);
      var kind = support.temporary ? "wood" : "stone";
      var action = installed && !washed ? "remove" : "install";
      var blocked = washed || (!installed && support.temporary && stage === "flood") ? " data-blocked=\"1\" aria-disabled=\"true\"" : "";
      var next = !installed && !washed && !support.temporary && weak.indexOf(support.section) !== -1;
      var drag = !installed && !washed ? " data-drag=\"support\" data-add=\"" + add + "\" data-section=\"" + support.section + "\"" : "";
      var used = installed || washed ? " is-used" : "";
      var label = washed ? "0" : "+" + add;
      return "<button type=\"button\" class=\"token " + kind + used + (next ? " is-next" : "") + "\"" + drag + " data-action=\"" + action + "\" data-id=\"" + esc(support.id) + "\" data-focus=\"build-" + esc(support.id) + "\"" + blocked + " aria-label=\"" + kind + " " + label + " " + placeName(support.section) + "\">" +
        "<i class=\"swatch\"></i><b>" + label + "</b><small>" + placeName(support.section) + "</small></button>";
    }).join("");
    var flood = !match.floodApplied
      ? "<button type=\"button\" class=\"token flood\" data-drag=\"flood\" data-action=\"flood\" aria-label=\"Flood\"><i class=\"swatch\"></i><b>Flood</b></button>"
      : "";
    return "<section class=\"toolbox\"><h2>Toolbox</h2><div class=\"basket\">" + tokens + flood + "</div></section>";
  }

  function meter(label, value) {
    return "<div class=\"meter\"><span>" + esc(label) + "</span><b>" + esc(value) + "</b></div>";
  }

  function consoleBody(match, level, plan, live) {
    var tone = live && live.weakest.demand > live.weakest.capacity ? "bad" : (Rules.testIsFresh(match) ? "good" : "info");
    var html = "<div class=\"status\" data-tone=\"" + tone + "\" role=\"status\">" + esc(lineStatus(match, live)) + "</div>";
    html += chips(live);
    if (match.phase === "play" || match.phase === "animating") html += controls(match, level, plan);
    if (match.phase === "report") {
      html += "<button type=\"button\" class=\"primary\" data-action=\"finish\" data-focus=\"finish\">回首页</button>";
    }
    if (match.phase === "fail") {
      html += "<button type=\"button\" class=\"primary\" data-action=\"retry\" data-focus=\"retry\">再来一次</button>";
    }
    return html;
  }

  function chips(live) {
    if (!live) return "";
    return "<div class=\"chips\">" + live.sections.map(function (section) {
      var bad = section.demand > section.capacity;
      return "<span class=\"chip" + (bad ? " bad" : "") + "\">" + placeName(section.id) + " " + section.demand + "/" + section.capacity + "</span>";
    }).join("") + "</div>";
  }

  function controls(match, level, plan) {
    var html = "<div class=\"stack\">";
    if (level.blueprints.length > 1 && plan) {
      level.blueprints.forEach(function (item) {
        if (match.blueprintId === item.id) return;
        html += button({
          focus: "plan-" + item.id,
          action: "blueprint",
          id: item.id,
          label: "换成 " + shortName(item.id, item.name),
          detail: match.blueprintPicks > 0 ? "1 回合" : "",
          disabled: match.phase !== "play"
        });
      });
    }
    var waiting = match.vehicles.filter(function (vehicle) { return vehicle.status === "waiting"; });
    if (waiting.length > 1) {
      match.vehicles.forEach(function (vehicle) {
        html += button({
          focus: "vehicle-" + vehicle.id,
          action: "vehicle",
          id: vehicle.id,
          label: (match.activeVehicleId === vehicle.id ? "当前 " : "") + shortName(vehicle.id, vehicle.name) + (vehicle.status === "released" ? " 已过" : ""),
          detail: "",
          disabled: match.phase !== "play" || vehicle.status !== "waiting"
        });
      });
    }
    if (plan) {
      plan.supports.forEach(function (support) {
        if (support.builtIn) return;
        var installed = match.installed.indexOf(support.id) !== -1;
        var floodBlocked = !installed && support.temporary && Rules.currentStage(match) === "flood";
        var materials = installed ? 0 : support.material;
        var hint = floodBlocked ? "水来了" : payHint(match, support.turns, materials);
        if (installed && !floodBlocked) hint = "拆掉退回 " + support.material;
        html += button({
          focus: (installed ? "remove" : "install") + "-" + support.id,
          action: installed ? "remove" : "install",
          id: support.id,
          label: (installed ? "拆掉 " : "装上 ") + shortName(support.id, support.name),
          detail: hint,
          disabled: match.phase !== "play" || floodBlocked || Rules.preview(match, support.turns, materials).indexOf("Blocked") !== -1
        });
      });
    }
    if (level.split && !match.splitOpen) {
      html += button({
        focus: "split",
        action: "split",
        label: "分成两辆轻车",
        detail: payHint(match, 1, 0),
        disabled: match.phase !== "play" || Rules.preview(match, 1, 0).indexOf("Blocked") !== -1
      });
    }
    if (level.split && match.splitOpen) {
      var sent = match.vehicles.some(function (vehicle) { return vehicle.status === "released"; });
      html += button({
        focus: "recombine",
        action: "recombine",
        label: "合成一辆重车",
        detail: sent ? "已经开走了" : payHint(match, 1, 0),
        disabled: match.phase !== "play" || sent || Rules.preview(match, 1, 0).indexOf("Blocked") !== -1
      });
    }
    var needPrediction = level.requirePrediction && !match.tests.length && !match.prediction;
    html += button({
      focus: "test",
      action: "test",
      label: "测试",
      detail: needPrediction ? "先点桥面" : payHint(match, level.testCost, 0),
      disabled: match.phase !== "play" || !plan || needPrediction || Rules.preview(match, level.testCost, 0).indexOf("Blocked") !== -1
    });
    var releaseDetail = Rules.preview(match, level.releaseCost, 0);
    var releaseHint = !Rules.testIsFresh(match) ? "先测过" : payHint(match, level.releaseCost, 0);
    html += button({
      focus: "release",
      action: "release",
      label: "发车",
      detail: releaseHint,
      disabled: match.phase !== "play" || !Rules.testIsFresh(match) || releaseDetail.indexOf("Blocked") !== -1
    });
    if (level.waitCost) {
      html += button({
        focus: "wait",
        action: "wait",
        label: "等一回合",
        detail: payHint(match, level.waitCost, 0),
        disabled: match.phase !== "play" || Rules.preview(match, level.waitCost, 0).indexOf("Blocked") !== -1
      });
    }
    html += "</div>";
    return html;
  }

  function timeline(match, level) {
    if (level.turnMode !== "clock") return "";
    var cells = "";
    var turn = 1;
    for (turn = 1; turn <= 15; turn += 1) {
      cells += "<li data-now=\"" + (match.turn === turn) + "\" data-flood=\"" + (turn === level.floodTurn) + "\" data-past=\"" + (turn < match.turn) + "\">" +
        turn + (turn === level.floodTurn ? " 水" : "") + "</li>";
    }
    return "<ol class=\"timeline\" aria-label=\"回合\">" + cells + "</ol>";
  }

  function map(match, level, plan, live, stage) {
    var deck = { west: [150, 290], center: [290, 450], east: [450, 610] };
    var slots = { west: 210, center: 370, east: 530 };
    var colors = { ok: "#2f6f4e", "at-capacity": "#c47b12", overload: "#9d2c22", none: "#8d7a55" };
    var sections = "";
    if (plan) ["west", "center", "east"].forEach(function (id) {
      var found = live ? live.sections.filter(function (section) { return section.id === id; })[0] : null;
      var fill = found ? colors[found.status] : colors.none;
      var hot = found && found.status === "overload";
      var width = deck[id][1] - deck[id][0];
      sections += "<g class=\"" + (hot ? "deck-hot" : "") + "\">";
      sections += "<rect x=\"" + deck[id][0] + "\" y=\"168\" width=\"" + width + "\" height=\"18\" fill=\"" + fill + "\" stroke=\"#1b1712\"></rect>";
      if (found && found.capacity > 0) {
        var ratio = Math.min(1.35, found.demand / found.capacity);
        var barH = Math.max(6, Math.round(ratio * 36));
        sections += "<rect x=\"" + (deck[id][0] + 18) + "\" y=\"" + (164 - barH) + "\" width=\"" + (width - 36) + "\" height=\"" + barH + "\" fill=\"" + fill + "\" opacity=\"0.9\"></rect>";
      }
      if (hot) {
        sections += "<path class=\"hatch\" d=\"M" + (deck[id][0] + 10) + " 168 l16 18 M" + (deck[id][0] + 36) + " 168 l16 18 M" + (deck[id][0] + 62) + " 168 l16 18\" stroke=\"#f4ecdc\" stroke-width=\"2\" pointer-events=\"none\"></path>";
      }
      if (hot) {
        sections += "<text x=\"" + (deck[id][0] + width / 2) + "\" y=\"108\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"700\" fill=\"#9d2c22\" pointer-events=\"none\">too heavy</text>";
      }
      sections += "<text x=\"" + (deck[id][0] + width / 2) + "\" y=\"124\" text-anchor=\"middle\" font-size=\"15\" font-weight=\"700\" fill=\"#1b1712\" pointer-events=\"none\">" + placeName(id) + "</text>";
      if (match.phase === "play") {
        sections += "<rect data-drop=\"span\" data-section=\"" + id + "\" x=\"" + deck[id][0] + "\" y=\"130\" width=\"" + width + "\" height=\"70\" fill=\"transparent\"></rect>";
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
          var dragAttr = action === "install" ? " data-drag=\"support\" data-section=\"" + support.section + "\"" : "";
          piers += "<g class=\"pier\" tabindex=\"0\" role=\"button\"" + dragAttr + " data-action=\"" + action + "\" data-id=\"" + esc(support.id) + "\" data-focus=\"map-" + esc(support.id) + "\" aria-label=\"" + esc((installed ? "Remove " : "Add ") + shortName(support.id, support.name)) + "\">";
        } else piers += "<g class=\"pier\" style=\"pointer-events:none\">";
        var pierFill = "none";
        if (washed) pierFill = "#8aa0ad";
        else if (installed && level.id === 3 && support.temporary) pierFill = "#c4a574";
        else if (installed && level.id === 3 && !support.builtIn) pierFill = "#3e4c57";
        else if (installed) pierFill = "#6b5436";
        if (clickable) piers += "<rect x=\"" + (x - 8) + "\" y=\"160\" width=\"40\" height=\"110\" fill=\"transparent\"></rect>";
        piers += "<rect x=\"" + x + "\" y=\"186\" width=\"22\" height=\"70\" fill=\"" + pierFill + "\" stroke=\"#1b1712\" stroke-width=\"2\" stroke-dasharray=\"" + (support.temporary ? "4 3" : "0") + "\"></rect>";
        if (washed) piers += "<path d=\"M" + x + " 190 l22 62 M" + (x + 22) + " 190 l-22 62\" stroke=\"#9d2c22\" stroke-width=\"3\"></path>";
        if (!support.builtIn && !installed && !washed && match.phase === "play") {
          piers += "<text class=\"plus\" x=\"" + (x + 3) + "\" y=\"220\" font-size=\"32\" font-weight=\"700\" fill=\"#ffb703\" stroke=\"#1b1712\" stroke-width=\"1\" pointer-events=\"none\">+</text>";
        }
        if (level.id === 3 && !support.builtIn && installed && !washed) {
          piers += "<text x=\"" + (x - 4) + "\" y=\"272\" font-size=\"16\" font-weight=\"700\" fill=\"#ffb703\" pointer-events=\"none\">+" + supportAdd(support) + "</text>";
        }
        piers += "</g>";
      });
    }

    var trucks = "";
    var queue = 0;
    var park = 0;
    var safe = !!(live && live.passed && match.phase === "play");
    match.vehicles.forEach(function (vehicle) {
      var crossing = match.phase === "animating" && match.releaseVehicleId === vehicle.id;
      if (crossing || (vehicle.status === "waiting" && vehicle.id === match.activeVehicleId)) {
        trucks += truck(vehicle, 46, 136, {
          moving: crossing,
          bump: match.bump === vehicle.id,
          ready: safe && vehicle.id === match.activeVehicleId,
          drive: match.phase === "play" && vehicle.status === "waiting"
        });
      } else if (vehicle.status === "waiting") {
        trucks += truck(vehicle, 12, 92 + queue * 34, { pick: match.phase === "play", small: true });
        queue += 1;
      } else {
        trucks += truck(vehicle, 640, 96 + park * 30, {});
        park += 1;
      }
    });

    var flood = stage === "flood";
    var rise = 52;
    if (level.floodTurn) {
      var step = Math.max(0, Math.min(1, (match.turn - 1) / Math.max(1, level.floodTurn - 1)));
      rise = Math.round(52 - step * 44);
    }
    var planChoices = "";
    if (!plan && match.phase === "play") {
      var blurbs = {
        timber: "East strength is low for this van",
        steel: "Higher strength on every span"
      };
      planChoices = "<div class=\"choices\">" + level.blueprints.map(function (item) {
        return "<button type=\"button\" class=\"choice-card\" data-action=\"blueprint\" data-id=\"" + esc(item.id) + "\" data-focus=\"map-plan-" + esc(item.id) + "\">" +
          miniBridge(item.id) + "<b>" + esc(shortName(item.id, item.name)) + "</b><small>" + esc(blurbs[item.id] || "") + "</small></button>";
      }).join("") + "</div>";
    }
    return "<div class=\"map-frame\"><svg class=\"scene" + (flood || (match.toast && match.toast.indexOf("flood") !== -1) ? " is-flood" : "") + "\" viewBox=\"0 0 720 340\" role=\"group\" aria-label=\"River and bridge\">" +
      "<rect width=\"720\" height=\"320\" fill=\"#efe4cf\"></rect>" +
      "<path d=\"M0 70 L140 48 L250 78 L390 40 L520 72 L720 46 L720 0 L0 0 Z\" fill=\"#d5dfd2\"></path>" +
      "<g class=\"rain\">" + rainLines(7) + "</g>" +
      "<g class=\"river" + (match.toast && match.toast.indexOf("flood") !== -1 ? " surge" : "") + "\" style=\"--rise:" + rise + "px\">" +
      "<rect class=\"water\" x=\"140\" y=\"150\" width=\"470\" height=\"130\" fill=\"" + (flood ? "#0e3f52" : "#1f6f86") + "\"></rect>" +
      "<path class=\"waves\" d=\"M140 175 H610 M140 200 H610 M140 225 H610\" fill=\"none\" stroke=\"#d7eef5\" stroke-width=\"3\" stroke-dasharray=\"18 14\"></path></g>" +
      "<rect x=\"0\" y=\"186\" width=\"150\" height=\"22\" fill=\"#8d7a55\"></rect>" +
      "<rect x=\"610\" y=\"186\" width=\"110\" height=\"22\" fill=\"#8d7a55\"></rect>" +
      (level.id === 3 && stage !== "flood" ? "<rect data-drop=\"river\" x=\"140\" y=\"210\" width=\"470\" height=\"90\" fill=\"transparent\"></rect>" : "") +
      sections + piers + trucks +
      "</svg>" + planChoices + "</div>";
  }

  function miniBridge(id) {
    var deck = id === "steel" ? "#5c6b76" : "#8d7a55";
    var pier = id === "steel" ? "#2c3338" : "#6b5436";
    return "<svg viewBox=\"0 0 160 70\" aria-hidden=\"true\"><rect width=\"160\" height=\"70\" fill=\"#efe4cf\"></rect>" +
      "<rect x=\"20\" y=\"36\" width=\"120\" height=\"8\" fill=\"" + deck + "\" stroke=\"#1b1712\"></rect>" +
      "<rect x=\"36\" y=\"44\" width=\"10\" height=\"18\" fill=\"" + pier + "\"></rect>" +
      "<rect x=\"74\" y=\"44\" width=\"10\" height=\"18\" fill=\"" + pier + "\"></rect>" +
      "<rect x=\"112\" y=\"44\" width=\"10\" height=\"18\" fill=\"" + pier + "\"></rect></svg>";
  }

  function truck(vehicle, x, y, opts) {
    opts = opts || {};
    var paint = "#f7f3ea";
    if (vehicle.id === "heavy" || vehicle.id.indexOf("light") === 0) paint = "#8a6232";
    if (vehicle.id === "medic") paint = "#d5e4cf";
    if (vehicle.id === "cart") paint = "#4d6a4a";
    if (vehicle.id === "bus") paint = "#e6c15a";
    var klass = "truck" + (opts.moving ? " is-moving" : "") + (opts.bump ? " is-bump" : "") + (opts.ready ? " is-ready" : "") + (opts.small ? " is-small" : "");
    var verb = opts.drive ? "drive" : opts.pick ? "pick" : "";
    var open = verb
      ? "<g tabindex=\"0\" role=\"button\"" + (opts.drive ? " data-drag=\"vehicle\"" : "") + " data-action=\"" + verb + "\" data-id=\"" + esc(vehicle.id) + "\" data-focus=\"truck-" + esc(vehicle.id) + "\" aria-label=\"" + esc(shortName(vehicle.id, vehicle.name)) + "\">"
      : "<g style=\"pointer-events:none\">";
    return "<g class=\"truck-wrap\" transform=\"translate(" + x + " " + y + ")\">" + open + "<g class=\"" + klass + "\">" +
      (verb ? "<rect x=\"-8\" y=\"-8\" width=\"62\" height=\"42\" fill=\"transparent\"></rect>" : "") +
      "<rect width=\"46\" height=\"20\" fill=\"" + paint + "\" stroke=\"#1b1712\"></rect>" +
      "<rect x=\"30\" y=\"4\" width=\"16\" height=\"14\" fill=\"#d9d3c6\" stroke=\"#1b1712\"></rect>" +
      "<g class=\"wheel\"><circle cx=\"12\" cy=\"22\" r=\"4\" fill=\"#1b1712\"></circle></g>" +
      "<g class=\"wheel\"><circle cx=\"34\" cy=\"22\" r=\"4\" fill=\"#1b1712\"></circle></g>" +
      (vehicle.id === "med-van" || vehicle.id === "medic" ? "<path d=\"M16 10 h6 M19 7 v6\" stroke=\"#9d2c22\" stroke-width=\"2\"></path>" : "") +
      "</g></g></g>";
  }

  var introLines = [
    { art: "storm", speaker: "Villager", text: "The storm has passed. The bridge to the village is gone." },
    { art: "clinic", speaker: "Villager", text: "The clinic is across the river. The medicine van is still on this side." },
    { art: "you", speaker: "Engineer", text: "Load is the force on a member. Capacity is the most it can carry. It holds only when the load is less than or equal to the capacity." },
    { art: "you", speaker: "Engineer", text: "A span is the distance between supports. A longer span can carry less. A support shortens the span." },
    { art: "you", speaker: "Engineer", text: "Come and help. Get the medicine van across.", go: "#/play/1/mission", cta: "Help" },
    { art: "cargo", speaker: "Engineer", text: "The center is too deep for a post. An arch carries the load to the two banks. A flat arch is weak. Pull the crown higher until the center can carry 14.", go: "#/play/2/mission", cta: "Start level 2" },
    { art: "flood", speaker: "Villager", text: "The water is rising. People still have to get out." },
    { art: "flood", speaker: "Engineer", text: "A flood can take a support away. The span gets longer, and its capacity falls. Stone supports stay. Check the bridge after the wood is gone.", go: "#/play/3/mission", cta: "Start level 3" },
    { art: "cargo", speaker: "Engineer", text: "The channel has to stay open, so you cannot put a post in the water. A truss is made of triangles. A triangle keeps its shape, and it raises the capacity of only the span under it.", go: "#/play/4/mission", cta: "Start level 4" }
  ];

  function introTarget(step) {
    if (step <= 4) return "#/play/1/mission";
    if (step === 5) return "#/play/2/mission";
    if (step <= 7) return "#/play/3/mission";
    return "#/play/4/mission";
  }

  function reportVeil(match, level) {
    var next = match.mode === "mission" && level.id < 4 ? "Next" : "Finish";
    return "<div class=\"veil\"><div class=\"veil-actions\">" +
      "<button type=\"button\" class=\"quiet\" data-action=\"retry\" data-focus=\"retry\">Play again</button>" +
      "<button type=\"button\" class=\"primary\" data-action=\"finish\" data-focus=\"finish\">" + next + "</button>" +
      "</div></div>";
  }

  function introDots(step) {
    if (step === 5 || step === 8) return "";
    var count = step < 5 ? 5 : 2;
    var index = step < 5 ? step : step - 6;
    if (index < 0) index = 0;
    var marks = "";
    var i;
    for (i = 0; i < count; i += 1) marks += "<i" + (i === index ? " class=\"on\"" : "") + "></i>";
    return "<div class=\"dots\" aria-hidden=\"true\">" + marks + "</div>";
  }

  function introScreen(step) {
    var line = introLines[step] || introLines[0];
    var next = line.go
      ? "<a class=\"button primary tale-next\" href=\"" + line.go + "\">" + esc(line.cta) + "</a>"
      : "<button type=\"button\" class=\"primary tale-next\" data-action=\"intro-next\" data-focus=\"intro\">Continue</button>";
    return "<main id=\"main\" class=\"tale\" tabindex=\"-1\">" +
      "<div class=\"tale-card\">" +
      "<a class=\"skip-intro\" href=\"" + introTarget(step) + "\">Skip</a>" +
      sceneArt(line.art) +
      "<div class=\"tale-dialogue\"><b>" + esc(line.speaker) + "</b><p>" + esc(line.text) + "</p></div>" +
      next +
      introDots(step) +
      "</div></main>";
  }

  function render(ctx) {
    if (ctx.page === "course") return course();
    if (ctx.page === "guide") return guide();
    if (ctx.page === "locked") return locked(ctx.lockedId);
    if (ctx.page === "intro") return introScreen(ctx.intro || 0);
    if (ctx.page === "levels") return levelSelect(ctx.progress);
    if (ctx.page === "story") return storyScreen(ctx.story || 0);
    if (ctx.page === "play" && ctx.match) return play(ctx.match, ctx.progress);
    return titleScreen(ctx.progress, ctx.about);
  }

  return { render: render };
});
