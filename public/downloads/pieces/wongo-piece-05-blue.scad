// Wongo piece 5: Raised hook. GPL-3.0; see README.txt.
// All cube positions derive from the canonical catalogue. z points up.
unit = 20; // mm, scale all pieces AND cards together
positions = [[0,0,0],[0,0,1],[1,0,0],[1,1,0],[1,2,0]];
union() { for (p = positions) translate(p * unit) cube([unit, unit, unit]); }
