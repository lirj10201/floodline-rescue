/* Deterministic teaching model for Floodline Rescue.
   Demand and capacity are integers in "load units".
   A section passes when demand <= capacity. Utilization is demand / capacity. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FloodModel = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var SECTIONS = ["west", "center", "east"];

  function capacities(supports, installed, stage) {
    var caps = { west: 0, center: 0, east: 0 };
    supports.forEach(function (support) {
      var active = support.builtIn || installed.indexOf(support.id) !== -1;
      if (!active) return;
      if (support.temporary && stage === "flood") return;
      SECTIONS.forEach(function (id) {
        caps[id] += support.capacity[id] || 0;
      });
    });
    return caps;
  }

  function statusOf(demand, capacity) {
    if (demand > capacity) return "overload";
    if (capacity > 0 && demand === capacity) return "at-capacity";
    return "ok";
  }

  function utilOf(demand, capacity) {
    if (capacity <= 0) return demand > 0 ? Infinity : 0;
    return demand / capacity;
  }

  function evaluate(demands, caps, names) {
    var sections = SECTIONS.map(function (id) {
      var demand = demands[id];
      var capacity = caps[id];
      return {
        id: id,
        name: names[id] || id,
        demand: demand,
        capacity: capacity,
        status: statusOf(demand, capacity),
        util: utilOf(demand, capacity)
      };
    });
    var weakest = sections[0];
    sections.forEach(function (section) {
      if (section.util > weakest.util) weakest = section;
    });
    var passed = sections.every(function (section) {
      return section.demand <= section.capacity;
    });
    return { sections: sections, weakest: weakest, passed: passed };
  }

  function percent(demand, capacity) {
    if (capacity <= 0) return demand > 0 ? "no capacity" : "0%";
    return Math.round((demand / capacity) * 100) + "%";
  }

  function actionWindow(turn, cost, floodTurn, deadlineTurn) {
    var safeCost = Math.max(0, cost);
    var start = turn;
    var end = safeCost === 0 ? turn : turn + safeCost - 1;
    var next = turn + safeCost;
    var straddles = floodTurn != null && safeCost > 0 && start < floodTurn && end >= floodTurn;
    var tooLate = deadlineTurn != null && safeCost > 0 && (start >= deadlineTurn || end >= deadlineTurn);
    var stage = "calm";
    if (floodTurn != null && start >= floodTurn) stage = "flood";
    return {
      start: start,
      end: end,
      next: next,
      straddles: straddles,
      tooLate: tooLate,
      stage: stage
    };
  }

  function stageAt(turn, floodTurn) {
    if (floodTurn == null) return "calm";
    return turn >= floodTurn ? "flood" : "calm";
  }

  function signature(parts) {
    var installed = parts.installed.slice().sort().join(",");
    return [parts.blueprintId, installed, parts.vehicleId, parts.stage].join("|");
  }

  function spend(current, cost) {
    if (cost < 0) return { ok: false, value: current, error: "Cost cannot be negative." };
    if (current < cost) return { ok: false, value: current, error: "Not enough." };
    return { ok: true, value: current - cost };
  }

  function refund(current, amount) {
    if (amount < 0) return { ok: false, value: current, error: "Refund cannot be negative." };
    return { ok: true, value: current + amount };
  }

  return {
    SECTIONS: SECTIONS,
    capacities: capacities,
    evaluate: evaluate,
    percent: percent,
    statusOf: statusOf,
    actionWindow: actionWindow,
    stageAt: stageAt,
    signature: signature,
    spend: spend,
    refund: refund
  };
});
