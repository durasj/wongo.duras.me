// Fongo piece 4: Gate. GPL-3.0; see README.txt.
// All cube positions derive from the canonical catalogue. z points up.
unit = 15; // mm, scale all pieces AND cards together
positions = [[0,0,0],[0,1,0],[0,2,0],[1,0,0],[1,2,0]];
union() { for (p = positions) translate(p * unit) cube([unit, unit, unit]); }
