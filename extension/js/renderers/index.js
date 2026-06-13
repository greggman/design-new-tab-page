import modularGrid from './modularGrid.js';
import concentricCircles from './concentricCircles.js';
import concentricSquares from './concentricSquares.js';
import sunburst from './sunburst.js';
import pieWheel from './pieWheel.js';
import tessellation from './tessellation.js';
import overlap from './overlap.js';
import nestedPolys from './nestedPolys.js';
import arcStacks from './arcStacks.js';
import circlePack from './circlePack.js';
import swissBands from './swissBands.js';
import diagonalField from './diagonalField.js';
import triangleRows from './triangleRows.js';
import spiral from './spiral.js';
import scallopGrid from './scallopGrid.js';
import orbit from './orbit.js';
import phyllotaxis from './phyllotaxis.js';
import isometric from './isometric.js';
import mondrian from './mondrian.js';
import pinwheel from './pinwheel.js';
import waveGrid from './waveGrid.js';
import cornerArcs from './cornerArcs.js';
import brickWall from './brickWall.js';
import crossHatch from './crossHatch.js';

export const SYSTEMS = [
  ['Modular grid', modularGrid, .55], ['Concentric', concentricCircles, .25], ['Concentric squares', concentricSquares, .25],
  ['Sunburst', sunburst, .45], ['Pie wheel', pieWheel, .4], ['Tessellation', tessellation, .55],
  ['Overlap', overlap, .2], ['Nested polygons', nestedPolys, .35], ['Arc stacks', arcStacks, .4],
  ['Circle packing', circlePack, .45], ['Swiss bands', swissBands, .3], ['Diagonal field', diagonalField, .3],
  ['Triangle rows', triangleRows, .4], ['Spiral', spiral, .35], ['Scallop grid', scallopGrid, .4], ['Orbit', orbit, .4],
  ['Phyllotaxis', phyllotaxis, .5], ['Isometric', isometric, .45], ['Mondrian', mondrian, .4], ['Pinwheel', pinwheel, .45],
  ['Wave grid', waveGrid, .45], ['Corner arcs', cornerArcs, .4], ['Brick wall', brickWall, .4], ['Cross-hatch', crossHatch, .2],
];
export default SYSTEMS;
