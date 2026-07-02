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
import contourLines from './contourLines.js';
import polkaDots from './polkaDots.js';
import plaid from './plaid.js';
import weave from './weave.js';
import terrazzo from './terrazzo.js';
import memphis from './memphis.js';
import mountains from './mountains.js';
import arcTiles from './arcTiles.js';
import checkerboard from './checkerboard.js';
import checkerWarp from './checkerWarp.js';
import goldenSpiral from './goldenSpiral.js';
import rosette from './rosette.js';
import stainedGlass from './stainedGlass.js';
import starfield from './starfield.js';
import nestedChevrons from './nestedChevrons.js';
import gradientGrid from './gradientGrid.js';
import maze from './maze.js';
import shards from './shards.js';
import argyle from './argyle.js';
import warpBands from './warpBands.js';
import perspectiveGrid from './perspectiveGrid.js';
import wireframeTunnel from './wireframeTunnel.js';
import lissajous from './lissajous.js';
import spirograph from './spirograph.js';
import glitch from './glitch.js';
import waveform from './waveform.js';
import hexGrid from './hexGrid.js';
import barcode from './barcode.js';
import kaleidoscope from './kaleidoscope.js';
import opWaves from './opWaves.js';
import hypnoRays from './hypnoRays.js';
import plasma from './plasma.js';
import dotSphere from './dotSphere.js';
import starFlare from './starFlare.js';
import chromeRings from './chromeRings.js';
import zoomLines from './zoomLines.js';
import suprematism from './suprematism.js';
import flowField from './flowField.js';
import quilt from './quilt.js';
import interference from './interference.js';
import isoCity from './isoCity.js';
import crossStitch from './crossStitch.js';
import warpGrid from './warpGrid.js';
import mosaic from './mosaic.js';
import spectrumRings from './spectrumRings.js';
import galaxy from './galaxy.js';
import hatchCells from './hatchCells.js';
import dither from './dither.js';
import lowPoly from './lowPoly.js';
import lattice from './lattice.js';
import bokeh from './bokeh.js';
import stipple from './stipple.js';
import gears from './gears.js';
import radar from './radar.js';
import blueprint from './blueprint.js';
import dazzle from './dazzle.js';
import mudcloth from './mudcloth.js';
import bubbles from './bubbles.js';
import shellFan from './shellFan.js';
import cafeWall from './cafeWall.js';
import herringbone from './herringbone.js';
import houndstooth from './houndstooth.js';
import voronoi from './voronoi.js';
import penrose from './penrose.js';
import girih from './girih.js';
import sierpinski from './sierpinski.js';
import hilbert from './hilbert.js';
import impossible from './impossible.js';
import anamorph from './anamorph.js';
import tieDye from './tieDye.js';
import marble from './marble.js';
import camouflage from './camouflage.js';
import leopard from './leopard.js';
import topographic from './topographic.js';
import guilloche from './guilloche.js';
import circuitBoard from './circuitBoard.js';
import subwayMap from './subwayMap.js';
import bargello from './bargello.js';
import pixelSprite from './pixelSprite.js';
import atomic from './atomic.js';
import coinStacks from './coinStacks.js';
import perspectiveTunnel from './perspectiveTunnel.js';
import dropShapes from './dropShapes.js';
import koch from './koch.js';
import spheres from './spheres.js';

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
  ['Contour lines', contourLines, .35], ['Polka dots', polkaDots, .4], ['Plaid', plaid, .35], ['Basketweave', weave, .45],
  ['Terrazzo', terrazzo, .4], ['Memphis', memphis, .4], ['Mountains', mountains, .4], ['Arc tiles', arcTiles, .5],
  ['Checkerboard', checkerboard, .5], ['Warped checker', checkerWarp, .5], ['Golden spiral', goldenSpiral, .3], ['Rosette', rosette, .35],
  ['Stained glass', stainedGlass, .5], ['Starfield', starfield, .3], ['Nested chevrons', nestedChevrons, .3], ['Gradient grid', gradientGrid, .4],
  ['Maze', maze, .45], ['Shards', shards, .45], ['Argyle', argyle, .5], ['Warp bands', warpBands, .45],
  ['Perspective grid', perspectiveGrid, .4], ['Wireframe tunnel', wireframeTunnel, .4], ['Lissajous', lissajous, .3], ['Spirograph', spirograph, .3],
  ['Glitch', glitch, .45], ['Waveform', waveform, .4], ['Hex grid', hexGrid, .5], ['Barcode', barcode, .5],
  ['Kaleidoscope', kaleidoscope, .45], ['Op waves', opWaves, .45], ['Hypno rays', hypnoRays, .45], ['Plasma', plasma, .3],
  ['Dot sphere', dotSphere, .4], ['Star flare', starFlare, .3], ['Chrome rings', chromeRings, .3], ['Zoom lines', zoomLines, .35],
  ['Suprematism', suprematism, .3], ['Flow field', flowField, .35], ['Quilt', quilt, .5], ['Interference', interference, .45],
  ['Iso city', isoCity, .45], ['Cross-stitch', crossStitch, .45], ['Warp grid', warpGrid, .35], ['Mosaic', mosaic, .5],
  ['Spectrum rings', spectrumRings, .45], ['Galaxy', galaxy, .35], ['Hatch cells', hatchCells, .4], ['Dither', dither, .5],
  ['Low poly', lowPoly, .5], ['Lattice', lattice, .35], ['Bokeh', bokeh, .3], ['Stipple', stipple, .4],
  ['Gears', gears, .35], ['Radar', radar, .35], ['Blueprint', blueprint, .4], ['Dazzle', dazzle, .5],
  ['Mudcloth', mudcloth, .5], ['Bubbles', bubbles, .35], ['Shell fan', shellFan, .4], ['Café wall', cafeWall, .5],
  ['Herringbone', herringbone, .5], ['Houndstooth', houndstooth, .45], ['Voronoi', voronoi, .45], ['Penrose', penrose, .4],
  ['Islamic star', girih, .45], ['Sierpinski', sierpinski, .4], ['Hilbert curve', hilbert, .4], ['Impossible cubes', impossible, .35],
  ['Bulge grid', anamorph, .45], ['Tie-dye', tieDye, .35], ['Marble', marble, .4], ['Camouflage', camouflage, .4],
  ['Leopard', leopard, .4], ['Topographic', topographic, .45], ['Guilloché', guilloche, .4], ['Circuit board', circuitBoard, .45],
  ['Subway map', subwayMap, .4], ['Bargello', bargello, .45], ['Pixel sprite', pixelSprite, .4],
  ['Atomic', atomic, .4], ['Coin stacks', coinStacks, .4], ['Tunnel', perspectiveTunnel, .4],
  ['Drop shapes', dropShapes, .4], ['Koch snowflake', koch, .35], ['Spheres', spheres, .4],
];
export default SYSTEMS;
