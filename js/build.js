/* The player designs the crossing by placing posts and stretching planks.
   Banks are fixed supports. A post can stand anywhere in the river.
   A plank runs from one support to another. A longer plank is weaker. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FloodBuild = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var LEFT = 150;
  var RIGHT = 570;
  var DECK_Y = 176;
  var POSTS = 3;
  var PLANKS = 4;
  var UNIT = 140;
  var BANK_GAP = 48;
  var POST_GAP = 64;
  var HINT_X = [290, 430];
  var ZONES = [
    { id: "west", x1: 150, x2: 290, mid: 220 },
    { id: "center", x1: 290, x2: 430, mid: 360 },
    { id: "east", x1: 430, x2: 570, mid: 500 }
  ];

  function create(options) {
    options = options || {};
    return { posts: [], planks: [], arches: [], trusses: [], deck: !!options.deck, notice: "", seq: 1, flooded: false };
  }

  function copy(state) {
    return {
      posts: state.posts.map(function (post) { return { id: post.id, x: post.x, material: post.material || "wood" }; }),
      planks: state.planks.map(function (plank) { return { id: plank.id, from: plank.from, to: plank.to }; }),
      arches: (state.arches || []).map(function (arch) { return { id: arch.id, from: arch.from, to: arch.to, rise: arch.rise }; }),
      trusses: (state.trusses || []).map(function (item) { return { id: item.id, zone: item.zone }; }),
      deck: !!state.deck,
      notice: "",
      seq: state.seq || 1,
      flooded: !!state.flooded
    };
  }

  function strength(length) {
    if (length < 36) return 10;
    return Math.max(2, Math.round(10 * UNIT / length));
  }

  function joints(state) {
    var list = [{ id: "left", x: LEFT }, { id: "right", x: RIGHT }];
    state.posts.forEach(function (post) { list.push({ id: post.id, x: post.x }); });
    return list;
  }

  function jointX(state, id) {
    if (id === "left") return LEFT;
    if (id === "right") return RIGHT;
    var found = null;
    state.posts.forEach(function (post) { if (post.id === id) found = post; });
    return found ? found.x : null;
  }

  function nearest(state, x, limit) {
    var best = null;
    joints(state).forEach(function (joint) {
      var distance = Math.abs(joint.x - x);
      if (distance <= limit && (!best || distance < best.distance)) {
        best = { id: joint.id, x: joint.x, distance: distance };
      }
    });
    return best;
  }

  function placeX(x) {
    return Math.max(LEFT + BANK_GAP, Math.min(RIGHT - BANK_GAP, x));
  }

  function tooClose(state, x, ignoreId) {
    var hit = false;
    state.posts.forEach(function (post) {
      if (post.id === ignoreId) return;
      if (Math.abs(post.x - x) < POST_GAP) hit = true;
    });
    return hit;
  }

  function addPost(state, x, y, material) {
    var next = copy(state);
    material = material === "stone" ? "stone" : "wood";
    if (y < 90 || y > 320) {
      next.notice = "Drop the post on the river.";
      return next;
    }
    if (next.flooded && material === "wood") {
      next.notice = "The flood already took the wood. Use a stone post.";
      return next;
    }
    if (next.posts.length >= POSTS) {
      next.notice = "No posts left. Drag one off the river to take it back.";
      return next;
    }
    if (material === "stone" && next.posts.filter(function (post) { return post.material === "stone"; }).length >= 2) {
      next.notice = "Only two stone posts. Put them where the bus still has to cross.";
      return next;
    }
    var place = placeX(x);
    if (tooClose(next, place, "")) {
      next.notice = "That spot is too close to another support.";
      return next;
    }
    next.posts.push({ id: "p" + next.seq, x: place, material: material });
    next.seq += 1;
    return next;
  }

  function movePost(state, id, x, y) {
    var next = copy(state);
    if (y < 70 || y > 330 || x < 160 || x > 560) {
      next.posts = next.posts.filter(function (post) { return post.id !== id; });
      next.planks = next.planks.filter(function (plank) { return plank.from !== id && plank.to !== id; });
      return next;
    }
    var place = placeX(x);
    if (tooClose(next, place, id)) {
      next.notice = "That spot is too close to another support.";
      return next;
    }
    next.posts.forEach(function (post) { if (post.id === id) post.x = place; });
    return next;
  }

  function addPlank(state, fromId, toId) {
    var next = copy(state);
    if (!fromId || !toId || fromId === toId) {
      next.notice = "Drag the plank from one support to another.";
      return next;
    }
    if (jointX(next, fromId) == null || jointX(next, toId) == null) {
      next.notice = "A plank has to start and end on a support.";
      return next;
    }
    var exists = next.planks.some(function (plank) {
      return (plank.from === fromId && plank.to === toId) || (plank.from === toId && plank.to === fromId);
    });
    if (exists) {
      next.notice = "That span already has a plank.";
      return next;
    }
    if (next.planks.length >= PLANKS) {
      next.notice = "No planks left. Tap a plank to take it back.";
      return next;
    }
    next.planks.push({ id: "b" + next.seq, from: fromId, to: toId });
    next.seq += 1;
    return next;
  }

  function removePlank(state, id) {
    var next = copy(state);
    next.planks = next.planks.filter(function (plank) { return plank.id !== id; });
    return next;
  }

  function hintFor(levelId) {
    if (Number(levelId) === 2) return [290, 360, 430];
    return HINT_X.slice();
  }

  function solution(levelId) {
    var id = Number(levelId);
    if (id === 2) return addArch(create(), "left", "right", 80);
    if (id === 4) {
      var truss = create({ deck: true });
      ["west", "center", "center", "east"].forEach(function (zone) { truss = addTruss(truss, zone); });
      return truss;
    }
    var next = create();
    var material = id === 3 ? "stone" : "wood";
    hintFor(levelId).forEach(function (x) { next = addPost(next, x, 200, material); });
    if (!next.posts.length) return next;
    return addPlank(next, "left", "right");
  }

  function flood(state) {
    var before = segments(state);
    var next = copy(state);
    next.flooded = true;
    next.posts = next.posts.filter(function (post) { return post.material === "stone"; });
    var pts = supports(next);
    next.planks = [];
    var index;
    for (index = 0; index < pts.length - 1; index += 1) {
      if (coverStrength(before, pts[index].x, pts[index + 1].x) > 0) {
        next.planks.push({ id: "f" + index, from: pts[index].id, to: pts[index + 1].id });
      }
    }
    next.notice = next.posts.length
      ? "The flood took the wood posts. The stone posts stayed."
      : "The flood took the wood posts. The plank is one long piece now.";
    return next;
  }

  function archStrength(length, rise) {
    if (rise < 28) return strength(length);
    return Math.max(2, Math.round(rise / 5));
  }

  function addArch(state, fromId, toId, rise) {
    var next = copy(state);
    if (!fromId || !toId || fromId === toId) {
      next.notice = "Drag the arch from one bank to the other, and pull the crown up.";
      return next;
    }
    if (jointX(next, fromId) == null || jointX(next, toId) == null) {
      next.notice = "An arch has to start and end on a support.";
      return next;
    }
    if (next.arches.length >= 1) {
      next.notice = "One arch at a time. Tap it to take it back.";
      return next;
    }
    next.arches.push({
      id: "a" + next.seq,
      from: fromId,
      to: toId,
      rise: Math.max(16, Math.min(110, Math.round(rise || 0)))
    });
    next.seq += 1;
    return next;
  }

  function removeArch(state, id) {
    var next = copy(state);
    next.arches = next.arches.filter(function (arch) { return arch.id !== id; });
    return next;
  }

  function addTruss(state, zoneId) {
    var next = copy(state);
    if (zoneId !== "west" && zoneId !== "center" && zoneId !== "east") {
      next.notice = "Drop the triangle on west, center, or east.";
      return next;
    }
    if (next.trusses.length >= 4) {
      next.notice = "No triangles left. Tap one to take it back.";
      return next;
    }
    next.trusses.push({ id: "t" + next.seq, zone: zoneId });
    next.seq += 1;
    return next;
  }

  function removeTruss(state, id) {
    var next = copy(state);
    next.trusses = next.trusses.filter(function (item) { return item.id !== id; });
    return next;
  }

  function zoneAt(x) {
    var found = "";
    ZONES.forEach(function (zone) {
      if (x >= zone.x1 && x <= zone.x2) found = zone.id;
    });
    return found;
  }

  function note(state, message) {
    var next = copy(state);
    next.notice = message;
    return next;
  }

  function supports(state) {
    return joints(state).slice().sort(function (a, b) { return a.x - b.x; });
  }

  function rawPlanks(state) {
    return state.planks.map(function (plank) {
      var a = jointX(state, plank.from);
      var b = jointX(state, plank.to);
      if (a == null || b == null) return null;
      return {
        id: plank.id,
        from: a <= b ? plank.from : plank.to,
        to: a <= b ? plank.to : plank.from,
        x1: Math.min(a, b),
        x2: Math.max(a, b)
      };
    }).filter(function (plank) { return plank; });
  }

  function segments(state) {
    var pts = supports(state);
    var raw = rawPlanks(state);
    var out = [];
    var index;
    for (index = 0; index < pts.length - 1; index += 1) {
      var x1 = pts[index].x;
      var x2 = pts[index + 1].x;
      var covered = raw.some(function (plank) {
        return plank.x1 <= x1 + 0.5 && plank.x2 >= x2 - 0.5;
      });
      if (!covered) continue;
      var length = x2 - x1;
      out.push({
        id: pts[index].id + ":" + pts[index + 1].id,
        from: pts[index].id,
        to: pts[index + 1].id,
        x1: x1,
        x2: x2,
        length: length,
        strength: strength(length)
      });
    }
    return out;
  }

  function uncover(state, fromId, toId) {
    var next = copy(state);
    var lo = jointX(next, fromId);
    var hi = jointX(next, toId);
    if (lo == null || hi == null) return next;
    if (lo > hi) {
      var swap = lo;
      lo = hi;
      hi = swap;
      var swapId = fromId;
      fromId = toId;
      toId = swapId;
    }
    var kept = [];
    rawPlanks(next).forEach(function (plank) {
      if (plank.x1 <= lo + 0.5 && plank.x2 >= hi - 0.5) {
        if (plank.x1 < lo - 0.5) kept.push({ id: plank.id + "L", from: plank.from, to: fromId });
        if (plank.x2 > hi + 0.5) kept.push({ id: plank.id + "R", from: toId, to: plank.to });
      } else kept.push({ id: plank.id, from: plank.from, to: plank.to });
    });
    next.planks = [];
    kept.forEach(function (plank) {
      if (plank.from === plank.to) return;
      var dup = next.planks.some(function (other) {
        return (other.from === plank.from && other.to === plank.to) || (other.from === plank.to && other.to === plank.from);
      });
      if (!dup) next.planks.push(plank);
    });
    return next;
  }

  function coverStrength(laid, x1, x2) {
    var points = [x1, x2];
    laid.forEach(function (plank) {
      if (plank.x2 <= x1 || plank.x1 >= x2) return;
      if (plank.x1 > x1 && plank.x1 < x2) points.push(plank.x1);
      if (plank.x2 > x1 && plank.x2 < x2) points.push(plank.x2);
    });
    points.sort(function (a, b) { return a - b; });
    var spots = [];
    points.forEach(function (point) {
      if (!spots.length || point - spots[spots.length - 1] > 0.5) spots.push(point);
    });
    var weakest = 0;
    var index;
    for (index = 0; index < spots.length - 1; index += 1) {
      var mid = (spots[index] + spots[index + 1]) / 2;
      var best = 0;
      laid.forEach(function (plank) {
        if (plank.x1 <= mid && mid <= plank.x2) best = Math.max(best, plank.strength);
      });
      if (!best) return 0;
      if (!weakest || best < weakest) weakest = best;
    }
    return weakest;
  }

  function laidArches(state) {
    return (state.arches || []).map(function (arch) {
      var a = jointX(state, arch.from);
      var b = jointX(state, arch.to);
      if (a == null || b == null) return null;
      var x1 = Math.min(a, b);
      var x2 = Math.max(a, b);
      var length = x2 - x1;
      return { id: arch.id, from: arch.from, to: arch.to, x1: x1, x2: x2, rise: arch.rise, length: length, strength: archStrength(length, arch.rise) };
    }).filter(function (arch) { return arch; });
  }

  function evaluate(state, demands) {
    var laid = segments(state);
    var arches = laidArches(state);
    var counts = { west: 0, center: 0, east: 0 };
    (state.trusses || []).forEach(function (item) { counts[item.zone] += 1; });
    var zones = ZONES.map(function (zone) {
      var beam = coverStrength(laid, zone.x1, zone.x2);
      var arched = 0;
      arches.forEach(function (arch) {
        if (arch.x1 <= zone.mid && zone.mid <= arch.x2) arched = Math.max(arched, arch.strength);
      });
      var amount = Math.max(beam, arched);
      if (state.deck) amount = Math.max(amount, 3);
      amount += counts[zone.id] * 7;
      return {
        id: zone.id,
        x1: zone.x1,
        x2: zone.x2,
        mid: zone.mid,
        demand: demands[zone.id] || 0,
        strength: amount,
        trusses: counts[zone.id]
      };
    });
    var passed = zones.every(function (zone) { return zone.demand <= zone.strength && zone.strength > 0; });
    return {
      posts: state.posts,
      planks: laid,
      arches: arches,
      trusses: state.trusses || [],
      deck: !!state.deck,
      zones: zones,
      passed: passed,
      postsLeft: POSTS - state.posts.length,
      planksLeft: Math.max(0, PLANKS - laid.length),
      archesLeft: Math.max(0, 1 - arches.length),
      trussesLeft: Math.max(0, 4 - (state.trusses || []).length),
      postCount: state.posts.length
    };
  }

  return {
    create: create,
    addPost: addPost,
    movePost: movePost,
    addPlank: addPlank,
    removePlank: removePlank,
    addArch: addArch,
    removeArch: removeArch,
    addTruss: addTruss,
    removeTruss: removeTruss,
    zoneAt: zoneAt,
    archStrength: archStrength,
    uncover: uncover,
    note: note,
    nearest: nearest,
    solution: solution,
    flood: flood,
    hintFor: hintFor,
    hintX: HINT_X,
    strength: strength,
    evaluate: evaluate,
    left: LEFT,
    right: RIGHT,
    deckY: DECK_Y
  };
});
