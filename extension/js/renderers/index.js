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
import truchet from './truchet.js';
import halftone from './halftone.js';
import albers from './albers.js';
import bauhaus from './bauhaus.js';
import eclipse from './eclipse.js';
import sunrise from './sunrise.js';
import chevronRows from './chevronRows.js';
import plusField from './plusField.js';
import bullseyeGrid from './bullseyeGrid.js';
import staircase from './staircase.js';
import radialBars from './radialBars.js';
import moireRings from './moireRings.js';
import columnStripes from './columnStripes.js';
import rotatingSquares from './rotatingSquares.js';
import confetti from './confetti.js';
import tangram from './tangram.js';
import barStack from './barStack.js';
import nestedFrames from './nestedFrames.js';
import quarterFan from './quarterFan.js';
import constellation from './constellation.js';
import windmillTiles from './windmillTiles.js';
import ripple from './ripple.js';
import aurora from './aurora.js';
import seigaiha from './seigaiha.js';
import colorField from './colorField.js';

export const SYSTEMS = [
  ['Modular grid', modularGrid, .55], ['Concentric', concentricCircles, .25], ['Concentric squares', concentricSquares, .25],
  ['Sunburst', sunburst, .45], ['Pie wheel', pieWheel, .4], ['Tessellation', tessellation, .55],
  ['Overlap', overlap, .2], ['Nested polygons', nestedPolys, .35], ['Arc stacks', arcStacks, .4],
  ['Circle packing', circlePack, .45], ['Swiss bands', swissBands, .3], ['Diagonal field', diagonalField, .3],
  ['Triangle rows', triangleRows, .4], ['Spiral', spiral, .35], ['Scallop grid', scallopGrid, .4], ['Orbit', orbit, .4],
  ['Phyllotaxis', phyllotaxis, .5], ['Isometric', isometric, .45], ['Mondrian', mondrian, .4], ['Pinwheel', pinwheel, .45],
  ['Wave grid', waveGrid, .45], ['Corner arcs', cornerArcs, .4], ['Brick wall', brickWall, .4], ['Cross-hatch', crossHatch, .2],
  ['Truchet', truchet, .5], ['Halftone', halftone, .5], ['Homage', albers, .3], ['Bauhaus', bauhaus, .3],
  ['Eclipse', eclipse, .25], ['Sunrise', sunrise, .4], ['Chevron rows', chevronRows, .45], ['Plus field', plusField, .5],
  ['Bullseye grid', bullseyeGrid, .45], ['Staircase', staircase, .4], ['Radial bars', radialBars, .4], ['Moiré rings', moireRings, .3],
  ['Column stripes', columnStripes, .45], ['Rotating squares', rotatingSquares, .5], ['Confetti', confetti, .3], ['Tangram', tangram, .45],
  ['Bar stack', barStack, .4], ['Nested frames', nestedFrames, .3], ['Quarter fan', quarterFan, .4], ['Constellation', constellation, .25],
  ['Windmill tiles', windmillTiles, .5], ['Ripple', ripple, .45], ['Aurora', aurora, .3], ['Seigaiha', seigaiha, .45], ['Color field', colorField, .3],
];
export default SYSTEMS;
