/* Level data for Floodline Rescue. Numbers are teaching settings, shared by the
   model, the pictures, and the written feedback. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FloodLevels = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var sectionsL1 = [
    { id: "west", name: "west span" },
    { id: "center", name: "center span" },
    { id: "east", name: "east support" }
  ];
  var sections = [
    { id: "west", name: "west span" },
    { id: "center", name: "center span" },
    { id: "east", name: "east span" }
  ];

  var levels = [
    {
      id: 1,
      code: "Medicine Run",
      difficulty: "Easy",
      mission: "Get one medicine van to the clinic.",
      requirePrediction: true,
      turnMode: "budget",
      budget: 8,
      materials: 2,
      floodTurn: null,
      deadlineTurn: null,
      testCost: 0,
      releaseCost: 1,
      waitCost: null,
      radio: "Clinic to rescue engineer: the road is gone. One medicine van is waiting on the west bank. It weighs 10 load units. Choose a bridge plan, mark the weak point, then run the load test.",
      brief: [
        "A load unit is the weight unit in this simplified model. It is not a tonne or a kilonewton.",
        "The medicine van weighs 10 load units. The spans do not share that weight evenly: the west span must carry 5, the center span 7, and the east support 8.",
        "Utilization is demand divided by capacity. The test fails if any section's demand is greater than its capacity. Equal demand and capacity still passes.",
        "Retests on this mission are free. Installing or removing a part costs 1 kit and 1 action turn. Sending the van costs 1 action turn. The first bridge plan is free; switching plans costs 1 action turn and returns any kits on that plan."
      ],
      coop: "Before the first test, say out loud which section you think is weakest and why. Then compare your mark with the test table.",
      sections: sectionsL1,
      blueprints: [
        {
          id: "timber",
          name: "Timber trestle",
          detail: "Fast to build. The east support is a narrow timber crib. The center span looks busy because the brace work is large, but that does not add east capacity.",
          supports: [
            { id: "timber-west", name: "west trestle", shortName: "west trestle", section: "west", builtIn: true, temporary: false, material: 0, turns: 0, capacity: { west: 10, center: 0, east: 0 } },
            { id: "timber-center", name: "center bent", shortName: "center bent", section: "center", builtIn: true, temporary: false, material: 0, turns: 0, capacity: { west: 0, center: 9, east: 0 } },
            { id: "timber-east", name: "east crib", shortName: "east crib", section: "east", builtIn: true, temporary: false, material: 0, turns: 0, capacity: { west: 0, center: 0, east: 6 } },
            { id: "center-clamp", name: "center clamp", shortName: "center", section: "center", builtIn: false, temporary: false, material: 1, turns: 1, detail: "Adds capacity to the center span only. It does not help the east support.", capacity: { west: 0, center: 4, east: 0 } },
            { id: "east-shoe", name: "east shoe", shortName: "east shoe", section: "east", builtIn: false, temporary: false, material: 1, turns: 1, detail: "Adds a bearing shoe under the east support.", capacity: { west: 0, center: 0, east: 4 } }
          ]
        },
        {
          id: "steel",
          name: "Steel girder",
          detail: "A deeper girder. Rated capacity is higher on every section, including the east support. It needs no extra kit for this van.",
          supports: [
            { id: "steel-west", name: "west girder", shortName: "west girder", section: "west", builtIn: true, temporary: false, material: 0, turns: 0, capacity: { west: 12, center: 0, east: 0 } },
            { id: "steel-center", name: "center girder", shortName: "center girder", section: "center", builtIn: true, temporary: false, material: 0, turns: 0, capacity: { west: 0, center: 10, east: 0 } },
            { id: "steel-east", name: "east bearing", shortName: "east bearing", section: "east", builtIn: true, temporary: false, material: 0, turns: 0, capacity: { west: 0, center: 0, east: 10 } }
          ]
        }
      ],
      vehicles: [
        {
          id: "med-van",
          name: "Medicine van",
          load: 10,
          demands: { west: 5, center: 7, east: 8 },
          note: "10 load units. Section demand: west 5, center 7, east 8."
        }
      ]
    },
    {
      id: 2,
      code: "Supply Split",
      difficulty: "Medium",
      mission: "Deliver the clinic supplies. One heavy truck, or two lighter trucks.",
      requirePrediction: false,
      turnMode: "budget",
      budget: 10,
      materials: 3,
      floodTurn: null,
      deadlineTurn: null,
      testCost: 1,
      releaseCost: 2,
      waitCost: null,
      radio: "Supply desk to engineer: the heavy truck demands 14 load units at the center span. The center rating is 8. You can reinforce, or split the cargo into two trucks. Test the truck you intend to send. Each test costs 1 action turn. Each crossing costs 2.",
      brief: [
        "The Bailey bridge starts at west 12, center 8, east 12.",
        "The full supply truck demands west 7, center 14, east 7. That center demand is above the rating of 8.",
        "A center post costs 2 kits and 1 action turn. It adds 8 capacity at the center only.",
        "A west knee brace costs 2 kits and 1 action turn. It adds capacity on the west span only, so it cannot fix a center overload.",
        "Removing a part returns its full kit cost and spends 1 action turn. You cannot gain kits by removing and reinstalling.",
        "Splitting costs 1 action turn and no kits. It replaces the heavy truck with Supply A and Supply B. Each demands west 4, center 8, east 4. Recombining, before either light truck has crossed, also costs 1 action turn."
      ],
      coop: "Two students, one device. Before anyone presses Test, each person writes a plan alone: reinforce the center, or split the cargo. Then compare kit cost, center demand, and action turns, and choose one plan together. After this mission, swap the Design Lead and Test Analyst roles.",
      sections: sections,
      alternateRoutes: [
        { id: "reinforce", name: "Reinforce the center and send the full truck", materials: 2, turns: 4 },
        { id: "split", name: "Split into two trucks", materials: 0, turns: 7 }
      ],
      blueprints: [
        {
          id: "bailey",
          name: "Bailey bridge",
          detail: "A temporary panel bridge. The center span is the short rating.",
          supports: [
            { id: "bailey-west", name: "west abutment", shortName: "west abutment", section: "west", builtIn: true, temporary: false, material: 0, turns: 0, capacity: { west: 12, center: 0, east: 0 } },
            { id: "bailey-center", name: "center panel", shortName: "center panel", section: "center", builtIn: true, temporary: false, material: 0, turns: 0, capacity: { west: 0, center: 8, east: 0 } },
            { id: "bailey-east", name: "east abutment", shortName: "east abutment", section: "east", builtIn: true, temporary: false, material: 0, turns: 0, capacity: { west: 0, center: 0, east: 12 } },
            { id: "center-post", name: "center post", shortName: "center post", section: "center", builtIn: false, temporary: false, material: 2, turns: 1, detail: "Adds 8 capacity at the center span.", capacity: { west: 0, center: 8, east: 0 } },
            { id: "west-knee", name: "west knee brace", shortName: "west approach", section: "west", builtIn: false, temporary: false, material: 2, turns: 1, detail: "Adds 6 capacity on the west span only.", capacity: { west: 6, center: 0, east: 0 } }
          ]
        }
      ],
      vehicles: [
        {
          id: "heavy",
          name: "Supply truck",
          load: 14,
          demands: { west: 7, center: 14, east: 7 },
          note: "Full cargo. Center demand 14."
        }
      ],
      split: {
        from: "heavy",
        parts: [
          { id: "light-a", name: "Supply A", load: 8, demands: { west: 4, center: 8, east: 4 }, note: "Half cargo. Center demand 8." },
          { id: "light-b", name: "Supply B", load: 8, demands: { west: 4, center: 8, east: 4 }, note: "Half cargo. Center demand 8." }
        ]
      }
    },
    {
      id: 3,
      code: "Rising Water",
      difficulty: "Hard",
      mission: "Send the medic jeep, the supply cart, and the evac bus before the evacuation closes.",
      requirePrediction: false,
      turnMode: "clock",
      budget: null,
      materials: 3,
      floodTurn: 5,
      deadlineTurn: 16,
      testCost: 1,
      releaseCost: 2,
      waitCost: 1,
      radio: "Lookout to engineer: the flood arrives at the start of turn 5. The temporary center bent and any temporary brace will then carry nothing. Evacuation closes at the start of turn 16. A crossing takes 2 turns. If those turns would still be on the bridge when the flood hits, the earlier test cannot be used.",
      brief: [
        "The turn counter starts at 1. You spend turns only when you choose an action. There is no real-time clock, so you can stop and talk.",
        "The flood arrives at the start of turn 5, before any action that begins on turn 5. From turn 5 on, temporary supports add no capacity.",
        "An action may not run on both sides of turn 5. A release takes 2 turns, so a release that would occupy turns 4 and 5 is blocked. The truck would still be crossing when the supports change.",
        "Evacuation closes at the start of turn 16. You cannot begin an action on turn 16 or occupy turn 16.",
        "Install or remove: 1 action turn, except the permanent center tower, which takes 2 action turns. Test: 1. Release: 2. Wait: 1.",
        "Removing a part before the flood returns its full kit cost and spends 1 turn. If the flood washes a temporary part away, that kit is not returned.",
        "Vehicle demand is fixed. Medic jeep: west 4, center 5, east 3. Supply cart: west 5, center 7, east 4. Evac bus: west 6, center 10, east 8.",
        "Starting ratings, before the flood: west pier 10, temporary center bent 8, east pier 6. The temporary brace adds 4 at the center and fails at the flood. The permanent tower adds 10 at the center and stays. The east plate adds 6 on the east span and stays."
      ],
      coop: "Before each release, the Test Analyst reads the turn window out loud and says whether turn 5 falls inside it. The Design Lead says which supports will still be standing at the end of that window. Do not release until you agree.",
      sections: sections,
      blueprints: [
        {
          id: "gorge",
          name: "Gorge crossing",
          detail: "Permanent piers on the banks. A temporary bent stands in the channel until the flood.",
          supports: [
            { id: "west-pier", name: "west pier", shortName: "west pier", section: "west", builtIn: true, temporary: false, material: 0, turns: 0, capacity: { west: 10, center: 0, east: 0 } },
            { id: "temp-bent", name: "temporary center bent", shortName: "temporary bent", section: "center", builtIn: true, temporary: true, material: 0, turns: 0, detail: "Fails at the start of turn 5.", capacity: { west: 0, center: 8, east: 0 } },
            { id: "east-pier", name: "east pier", shortName: "east pier", section: "east", builtIn: true, temporary: false, material: 0, turns: 0, capacity: { west: 0, center: 0, east: 6 } },
            { id: "temp-brace", name: "temporary brace", shortName: "temporary brace", section: "center", builtIn: false, temporary: true, material: 1, turns: 1, detail: "Adds 4 center capacity. The flood removes it and does not return the kit.", capacity: { west: 0, center: 4, east: 0 } },
            { id: "center-tower", name: "permanent center tower", shortName: "center tower", section: "center", builtIn: false, temporary: false, material: 2, turns: 2, detail: "Adds 10 center capacity. Stays up after the flood. Takes 2 action turns.", capacity: { west: 0, center: 10, east: 0 } },
            { id: "east-plate", name: "east plate", shortName: "east plate", section: "east", builtIn: false, temporary: false, material: 1, turns: 1, detail: "Adds 6 east capacity. Stays up after the flood.", capacity: { west: 0, center: 0, east: 6 } }
          ]
        }
      ],
      vehicles: [
        { id: "medic", name: "Medic jeep", load: 6, demands: { west: 4, center: 5, east: 3 }, note: "Lightest vehicle." },
        { id: "cart", name: "Supply cart", load: 9, demands: { west: 5, center: 7, east: 4 }, note: "Passes the starting bridge before the flood." },
        { id: "bus", name: "Evac bus", load: 12, demands: { west: 6, center: 10, east: 8 }, note: "Overloads the starting center and east ratings." }
      ]
    }
  ];

  function getLevel(id) {
    return levels.filter(function (level) { return level.id === id; })[0] || null;
  }

  return {
    list: function () { return levels; },
    getLevel: getLevel
  };
});
