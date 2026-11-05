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
    return "<main id=\"main\" class=\"wrap\" tabindex=\"-1\">" +
      "<header class=\"mast\"><div><h1>洪峰倒计时</h1><p class=\"zh\">把车开过河</p></div></header>" +
      "<div class=\"hero\"><section class=\"sheet\">" +
      heroMap() +
      "<div class=\"actions\" style=\"margin-top:1rem\">" +
      "<a class=\"button primary\" href=\"#/play/" + mission + "/mission\">" + (replay ? "再玩一次" : "开始") + "</a>" +
      "<a class=\"button\" href=\"#/play/1/practice\">第 1 关</a>" +
      "<a class=\"button\" href=\"#/play/2/practice\">第 2 关</a>" +
      "<a class=\"button\" href=\"#/play/3/practice\">第 3 关</a>" +
      "</div></section></div></main>";
  }

  function heroMap() {
    return "<div class=\"map-frame\"><svg class=\"scene\" viewBox=\"0 0 720 280\" role=\"img\" aria-label=\"河、断桥、一辆救援车\">" +
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
    return "<main id=\"main\" class=\"prose\" tabindex=\"-1\"><article class=\"sheet\"><h1>第 " + id + " 关还没开</h1>" +
      "<p>先打完上一关。</p>" +
      "<div class=\"actions\"><a class=\"button primary\" href=\"#/\">回首页</a><a class=\"button\" href=\"#/play/" + id + "/practice\">直接试这一关</a></div></article></main>";
  }

  var SHORT = {
    timber: "木桥",
    steel: "钢桥",
    "center-clamp": "加固中段",
    "east-shoe": "加固东段",
    "center-post": "加粗中段",
    "west-knee": "加固西段",
    "temp-brace": "临时撑",
    "center-tower": "永久塔",
    "east-plate": "东边钢板",
    "med-van": "药车",
    heavy: "重车",
    "light-a": "轻车 A",
    "light-b": "轻车 B",
    medic: "吉普",
    cart: "补给车",
    bus: "大巴"
  };

  function shortName(id, fallback) {
    return SHORT[id] || fallback;
  }

  function placeName(id) {
    if (id === "west") return "西段";
    if (id === "center") return "中段";
    return "东段";
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
      if (preview.indexOf("kit") !== -1) return "材料不够";
      return "来不及";
    }
    var bits = [];
    if (materials) bits.push(materials + " 材料");
    if (turns) bits.push(turns + " 回合");
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

    var titles = { 1: "送药", 2: "补给", 3: "涨水" };
    var meters = level.turnMode === "clock"
      ? meter("回合", match.turn) + meter("涨水", level.floodTurn) + meter("材料", match.materials)
      : meter("材料", match.materials) + meter("回合", match.turnsLeft);

    return "<main id=\"main\" tabindex=\"-1\">" +
      "<header class=\"play-top\"><div><h1>第 " + level.id + " 关 · " + titles[level.id] + "</h1></div>" +
      "<div class=\"meters\">" + meters +
      "<button type=\"button\" data-action=\"mute\" data-focus=\"mute\">" + (progress.mute ? "声音关" : "声音开") + "</button>" +
      "<a class=\"button quiet\" href=\"#/\">首页</a></div></header>" +
      "<div class=\"layout\"><section>" + map(match, level, plan, live, stage) + timeline(match, level) + "</section>" +
      "<section class=\"console\" data-tone=\"" + tone + "\" aria-label=\"操作\">" +
      consoleBody(match, level, plan, live, fresh, stage) +
      "</section></div></main>";
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
    ["west", "center", "east"].forEach(function (id) {
      var found = live ? live.sections.filter(function (section) { return section.id === id; })[0] : null;
      var fill = found ? colors[found.status] : colors.none;
      var predict = level.requirePrediction && !match.tests.length;
      if (predict && plan && match.phase === "play") {
        sections += "<g class=\"" + (found && found.status === "overload" ? "deck-hot " : "") + "\" tabindex=\"0\" role=\"button\" data-action=\"predict\" data-id=\"" + id + "\" data-focus=\"map-predict-" + id + "\" aria-label=\"猜" + placeName(id) + "\">";
      } else sections += "<g class=\"" + (found && found.status === "overload" ? "deck-hot" : "") + "\" style=\"pointer-events:none\">";
      sections += "<rect x=\"" + deck[id][0] + "\" y=\"150\" width=\"" + (deck[id][1] - deck[id][0]) + "\" height=\"36\" fill=\"transparent\"></rect>";
      sections += "<rect x=\"" + deck[id][0] + "\" y=\"168\" width=\"" + (deck[id][1] - deck[id][0]) + "\" height=\"18\" fill=\"" + fill + "\" stroke=\"#1b1712\" pointer-events=\"none\"></rect>";
      if (found && found.status === "overload") {
        sections += "<path class=\"hatch\" d=\"M" + (deck[id][0] + 10) + " 168 l16 18 M" + (deck[id][0] + 36) + " 168 l16 18 M" + (deck[id][0] + 62) + " 168 l16 18\" stroke=\"#f4ecdc\" stroke-width=\"2\"></path>";
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
          piers += "<g class=\"pier\" tabindex=\"0\" role=\"button\" data-action=\"" + action + "\" data-id=\"" + esc(support.id) + "\" data-focus=\"map-" + esc(support.id) + "\" aria-label=\"" + esc((installed ? "拆掉" : "装上") + shortName(support.id, support.name)) + "\">";
        } else piers += "<g class=\"pier\" style=\"pointer-events:none\">";
        if (clickable) piers += "<rect x=\"" + (x - 8) + "\" y=\"160\" width=\"40\" height=\"110\" fill=\"transparent\"></rect>";
        piers += "<rect x=\"" + x + "\" y=\"186\" width=\"22\" height=\"70\" fill=\"" + (washed ? "#8aa0ad" : installed ? "#6b5436" : "none") + "\" stroke=\"#1b1712\" stroke-width=\"2\" stroke-dasharray=\"" + (support.temporary ? "4 3" : "0") + "\"></rect>";
        if (washed) piers += "<path d=\"M" + x + " 190 l22 62 M" + (x + 22) + " 190 l-22 62\" stroke=\"#9d2c22\" stroke-width=\"3\"></path>";
        if (!support.builtIn) {
          var tag = support.section === "west" ? "西" : support.section === "center" ? "中" : "东";
          piers += "<text x=\"" + (x + 2) + "\" y=\"158\" font-size=\"16\" fill=\"#1b1712\" pointer-events=\"none\">" + tag + "</text>";
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
    var planChoices = "";
    if (!plan && match.phase === "play") {
      planChoices = "<div class=\"actions\" style=\"margin-top:0.6rem\">" + level.blueprints.map(function (item) {
        return "<button type=\"button\" class=\"primary\" data-action=\"blueprint\" data-id=\"" + esc(item.id) + "\" data-focus=\"map-plan-" + esc(item.id) + "\">" + esc(shortName(item.id, item.name)) + "</button>";
      }).join("") + "</div>";
    }
    return "<div class=\"map-frame\"><svg class=\"scene" + (flood ? " is-flood" : "") + "\" viewBox=\"0 0 720 340\" role=\"group\" aria-label=\"河和桥\">" +
      "<rect width=\"720\" height=\"320\" fill=\"#efe4cf\"></rect>" +
      "<path d=\"M0 70 L140 48 L250 78 L390 40 L520 72 L720 46 L720 0 L0 0 Z\" fill=\"#d5dfd2\"></path>" +
      "<g class=\"rain\">" + rainLines(7) + "</g>" +
      "<g class=\"river" + (flood ? " is-high" : "") + "\">" +
      "<rect class=\"water\" x=\"140\" y=\"150\" width=\"470\" height=\"130\" fill=\"" + (flood ? "#0e3f52" : "#1f6f86") + "\"></rect>" +
      "<path class=\"waves\" d=\"M140 175 H610 M140 200 H610 M140 225 H610\" fill=\"none\" stroke=\"#d7eef5\" stroke-width=\"3\" stroke-dasharray=\"18 14\"></path></g>" +
      "<rect x=\"0\" y=\"186\" width=\"150\" height=\"22\" fill=\"#8d7a55\"></rect>" +
      "<rect x=\"610\" y=\"186\" width=\"110\" height=\"22\" fill=\"#8d7a55\"></rect>" +
      sections + piers + trucks +
      "</svg>" + planChoices + "</div>";
  }

  function truck(vehicle, x, y, moving) {
    var paint = "#f7f3ea";
    if (vehicle.id === "heavy" || vehicle.id.indexOf("light") === 0) paint = "#8a6232";
    if (vehicle.id === "medic") paint = "#d5e4cf";
    if (vehicle.id === "cart") paint = "#4d6a4a";
    if (vehicle.id === "bus") paint = "#e6c15a";
    return "<g class=\"truck-wrap\" transform=\"translate(" + x + " " + y + ")\"><g class=\"truck" + (moving ? " is-moving" : "") + "\">" +
      "<rect width=\"46\" height=\"20\" fill=\"" + paint + "\" stroke=\"#1b1712\"></rect>" +
      "<rect x=\"30\" y=\"4\" width=\"16\" height=\"14\" fill=\"#d9d3c6\" stroke=\"#1b1712\"></rect>" +
      "<g class=\"wheel\"><circle cx=\"12\" cy=\"22\" r=\"4\" fill=\"#1b1712\"></circle></g>" +
      "<g class=\"wheel\"><circle cx=\"34\" cy=\"22\" r=\"4\" fill=\"#1b1712\"></circle></g>" +
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
