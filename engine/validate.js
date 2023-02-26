// what if i rewrite
namespace(function() {
class Polyomino {
    constructor(puzzle, c) {
        this.pos = c;
        let [x, y] = xy(c);
        this.cell = puzzle.getCell(x, y);
        this.shape = this.cell.polyshape + 0; // 131072: upscale flag, 1048576: rotate flag
        this.type = this.cell.type;
    }
    aon(e) { return (this.cell.polyshape & e == 0) || (this.cell.polyshape & e == e); }
    downscalable() {
        return this.aon(51) && this.aon(204) && this.aon(13056) && this.aon(52224); // check if each 2x2 square is in same state
    }
    upscalable() { 
        return (this.cell.polyshape & 1048627 == this.cell.polyshape); // check if only first 2x2 exist (+1048576)
    }
    downscale() { // nearest neighbor
        let ret = this.cell.polyshape & 1048576;
        if (this.cell.polyshape &    1) ret += 1; // if x1y1~x2y2, x1y1
        if (this.cell.polyshape &    4) ret += 2;
        if (this.cell.polyshape &  512) ret += 16;
        if (this.cell.polyshape & 2048) ret += 32; 
        this.cell.polyshape = ret;
    }
    upscale() { 
        if (this.upscalable()) {
            let ret = this.cell.polyshape & 1048576;
            if (this.cell.polyshape &  1) ret += 51; // if x1y1, x1y1~x2y2
            if (this.cell.polyshape &  2) ret += 204;
            if (this.cell.polyshape & 16) ret += 13056;
            if (this.cell.polyshape & 32) ret += 52224; 
            this.cell.polyshape = ret;
        } else this.cell.polyshape += 131072;
    }
}

const NEGATE_IMMEDIATELY = ['dot', 'cross', 'curve', 'dots', 'triangle', 'atriangle', 'arrow', 'dart', 'twobytwo', 'crystal', 'dice', 'eye', 'drop', 'fulcrum']; // these work individually, and can be negated
const CHECK_ALSO = { // removing this 1 thing can affect these other symbols
    'square': ['pentagon'],
    'pentagon': ['square'],
    'celledhex': ['dart', 'divdiamond', 'poly', 'ylop', 'xvmino']
};
const ALWAYS_CHECK = ['bridge', 'star', 'pokerchip'];
const METASHAPES = ['nega', 'copier'];
const NONSYMBOLS = ['line']; // extension sake
const NONSYMBOL_PROPERTY = ['type', 'line', 'start', 'end'];
const COLOR_DEPENDENT = ['square', 'star', 'pentagon', 'vtriangle', 'bridge'];

// coordinate conversion
let width; 
let height;
function ret(x, y, w=width) { return y * w + x; }
function retPillar(puzzle, x, y, w=width) { return puzzle.pillar ? ret(rdiv(x, puzzle.width), y, w) : ret(x, y, w); }
function xy(c, w=width) { return [c % w, Math.floor(c / w)]; }
function cel(puzzle, c, w=puzzle.width) { return puzzle.getCell(...xy(c, w)); }
const DIR = [
    {'x': 0, 'y':-1},
    {'x': 1, 'y':-1},
    {'x': 1, 'y': 0},
    {'x': 1, 'y': 1},
    {'x': 0, 'y': 1},
    {'x':-1, 'y': 1},
    {'x':-1, 'y': 0},
    {'x':-1, 'y':-1},
];  
function dr(n) { return [DIR[n].x, DIR[n].y]; }
const detectionMode = {
    "all":    (x, y) => { return true; },
    "cell":   (x, y) => { return (x & y) % 2 == 1; },
    "line":   (x, y) => { return (x & y) % 2 == 0; },
    "corner": (x, y) => { return (x | y) % 2 == 0; },
    "edge":   (x, y) => { return (x ^ y) % 2 == 1; }
};
function intersect(a, b) { return a.filter(k => b.includes(k)); } // intersection of two arrays
function intersects(a, b) { // check for intersection
    if (a.length == 0 && b.length == 0) return false;
    if (a.length == 1) return b.includes(a[0]); if (b.length == 1) return a.includes(b[0]);
    return a.reduce((k, p) => { return k || b.includes(p);}, false);
}
function contains(a, b) {
    let max = (a.length > b.length) ? a : b;
    let min = (a.length > b.length) ? b : a;
    for (e of min) if (!max.includes(e)) return false;
    return true;        
}
function isBounded(puzzle, x, y) { return ((puzzle.pillar || (0 <= x && x < puzzle.width)) && 0 <= y && y < puzzle.height); }
function matrix(puzzle, global, x, y) { return global.regionMatrix[y]?.[puzzle.pillar ? rdiv(x, puzzle.width) : x]; }
function safepush(obj, k, v, makeset=false) { obj[k] ??= (makeset ? new Set() : []); makeset ? obj[k].add(v) : obj[k].push(v); }
function getPortalCoords(c, data) { // from: <real>, to: PortalCoords(portalOffset-Adjusted)<virtual>
    for (const i in data.originalRegions.all) {
        if (data.originalRegions.all[i].includes(c)) {
            let [x, y] = xy(c);
            x += data.offset[i][0]; y += data.offset[i][1];
            return ret(rdiv(x - data.totalSpan[0], data.width), y - data.totalSpan[1], data.width);
        }
    }
    return undefined;
}

// Determines if the current grid state is solvable. Modifies the puzzle element with:
// valid: Boolean (true/false)
// invalidElements: Array[Object{'x':int, 'y':int}]
// negations: Array[Object{'source':{'x':int, 'y':int}, 'target':{'x':int, 'y':int}}]
window.validate = function(puzzle, quick) {
    puzzle.invalidElements = []; // once elements go in this list, nothing is removed
    puzzle.copierResults = {};
    puzzle.negatorResults = {};
    puzzle.valid = true; // puzzle true until proven false
    width = puzzle.width;
    height = puzzle.height;
    for (let x = 0; x < puzzle.width; x++) for (let y = 0; y < puzzle.height; y++) {
        if (puzzle.grid[x][y]?.line === 0) delete puzzle.grid[x][y].line;
        if (puzzle.grid[x][y]?.dir === null) delete puzzle.grid[x][y].dir;
    }
    window.savedGrid = JSON.parse(JSON.stringify(puzzle.grid));
    let global;
    [puzzle, global] = init(puzzle); // prime puzzle for the ready
    console.warn(puzzle, global);
    if (puzzle.grid[puzzle.startPoint.x][puzzle.startPoint.y].start === 2
        || puzzle.statuscoloring
        || global.shapes.includes('nega')) quick = false;
    let res = validatePuzzleForBridges(puzzle, global, global.thingsToCopy, quick);
    puzzle.invalidElements = res.invalid;
    puzzle.copierResults = res.copier;
    puzzle.negatorResults = res.negator;
    puzzle.grid = window.savedGrid;
    delete window.savedGrid;
    puzzle.valid = !puzzle.invalidElements.length;
}

function validatePuzzleForBridges(puzzle, global, copy, quick) {
    let inv = new Set();
    let getEnd = function(br) {
        if (br.pos.x % 2) return br.type === 4 ? 'right' : 'left';
        else return br.type === 4 ? 'bottom' : 'top';
    }
    
    let res;
    if (global.shapes.includes('bridgeButActually')) {
        let puzzle3 = clonePuzzle(puzzle)
        let global3;
        [puzzle3, global3] = init(puzzle3);
        let ccopy = {};
        for (let k in copy) ccopy[k] = {...copy[k]};
        res = validatePuzzleForStatusColoring(puzzle3, global3, ccopy, quick);
        puzzle.statusRight = puzzle3.statusRight;
        puzzle.statusWrong = puzzle3.statusWrong;
        if (global.bridgeBranches?.length) for (let br of global.bridgeBranches) {
            let global2;
            if (quick && inv.length) return;
            let puzzle2 = clonePuzzle(puzzle); 
            puzzle2.endPoint = {...puzzle.endPoint}; // break reference
            let [x, y] = [puzzle2.endPoint.x, puzzle2.endPoint.y];
            for (let k of puzzle.path.slice(br.path + 1).reverse()) {
                [x, y] = [[x, y], [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]][k];
                if (puzzle2.pillar) x = rdiv(x, puzzle.width);
                puzzle2.grid[x][y].line = 0;
                if (puzzle2.symmetry) {
                    let sym = puzzle2.getSymmetricalPos(x, y);
                    puzzle2.grid[sym.x][sym.y].line = 0;
                }
            }
            puzzle2.endPoint = br.pos;
            puzzle2.path = [...puzzle.path.slice(0, br.path), 0];
            puzzle2.grid[br.pos.x][br.pos.y].end = getEnd(br);
            for (let br2 of global.bridgeBranches) puzzle2.grid[br2.pos.x][br2.pos.y].gap = 0; // no brig
            [puzzle2, global2] = init(puzzle2);
            let ccopy = {};
            for (let k in copy) ccopy[k] = {...copy[k]};
            res.invalid.push(...validatePuzzleForStatusColoring(puzzle2, global2, ccopy, quick).invalid);
        }
    }
    else res = validatePuzzleForStatusColoring(puzzle, global, copy, quick);
    res.invalid = Array.from(new Set(res.invalid.map(x => ret(x.x, x.y)))).map(x => {return {'x': xy(x)[0], 'y': xy(x)[1]}});
    return res;
}

function validatePuzzleForStatusColoring(puzzle, global, copy, quick) {
    let res;
    if (puzzle.statuscoloring) {
        let puzzle3 = clonePuzzle(puzzle)
        let global3;
        let ccopy = {};
        for (let k in copy) ccopy[k] = {...copy[k]};
        [puzzle3, global3] = init(puzzle3);
        res = validatePuzzleForCopiers(puzzle3, global3, ccopy, quick);
        puzzle.statusRight = [];
        puzzle.statusWrong = res.invalid.filter(q => puzzle.grid?.[q.x]?.[q.y]?.color !== undefined);
        for (let x = 0; x < puzzle.width; x++) for (let y = 0; y < puzzle.height; y++) {
            if (isNaN(puzzle.getCell(x, y)?.color)) continue;
            if (puzzle.statusWrong.findIndex(q => q.x === x && q.y === y) !== -1) continue;
            if (puzzle.grid?.[x]?.[y]?.color !== undefined) puzzle.statusRight.push({'x': x, 'y': y});
        }
        for (let q of puzzle.statusRight) puzzle.grid[q.x][q.y].color = 0;
        for (let q of puzzle.statusWrong) puzzle.grid[q.x][q.y].color = 1;
        [puzzle, global] = init(puzzle);
        return validatePuzzleForCopiers(puzzle, global, copy, quick);
    }
    else res = validatePuzzleForCopiers(puzzle, global, copy, quick);
    return res;
}

function validatePuzzleForCopiers(puzzle, global, copy, quick) {
    if (!global.shapes.includes('copier')) {
        let newCopy = {};
        let inv = validatePuzzle(puzzle, global, false).map(x => ret(x.x, x.y));
        for (let q of Object.keys(copy).filter(x => copy[x].type === 'nega' || inv.includes(Number(x)))) newCopy[q] = {...copy[q]};
	return validatePuzzleForNegators(puzzle, global, newCopy, quick);
    }
    let c = Number(Object.keys(copy).find(x => copy[x].type === 'copier'));
    if (isNaN(c)) {
        let global2;
        [puzzle, global2] = init(puzzle);
        let inv = validatePuzzle(puzzle, global2, false).map(x => ret(x.x, x.y));
        let newCopy = {};
        for (let q of Object.keys(copy).filter(x => copy[x].type === 'nega' || inv.includes(Number(x)))) newCopy[q] = {...copy[q]};
        return validatePuzzleForNegators(puzzle, global2, newCopy, quick);
    }
    delete copy[c];
    let regionNum = global.regionCells.cell.findIndex(x => x.includes(c));
    if (regionNum === -1) return validatePuzzleForCopiers(puzzle, global, copy, quick);
    let transformed = [];
    let [x, y] = xy(c);
    let inv;
    let found = false;
    for (let k in copy) {
        k = Number(k);
        if (copy[k].type === 'copier'
        || copy[k].type === 'x'
        || !global.regionCells.cell[regionNum]?.includes(k)
        || transformed.includes([c, copy[k].type, copy[k].count, copy[k].flip, copy[k].rot, copy[k].polyshape].join('-'))) continue;
        transformed.push([c, copy[k].type, copy[k].count, copy[k].flip, copy[k].rot, copy[k].polyshape].join('-'));
        let puzzle2 = clonePuzzle(puzzle);
        Object.assign(cel(puzzle2, c), copy[k]);
        copy[c] = {...copy[k]};
        puzzle2.copierResults[c] = k;
        inv = validatePuzzleForCopiers(puzzle2, global, {...copy}, quick);
        found = true;
        if (!inv.invalid.length) return inv;
    }
    if (found) return inv;
    else {
        let res = validatePuzzleForCopiers(puzzle, global, copy, quick);
        res.invalid.push({'x': x, 'y': y});
        return res;
    }
}

function validatePuzzleForNegators(puzzle, global, copy, quick) {
    if (global.shapes.includes('nega')) [puzzle, global] = init(puzzle);
    let c = Number(Object.keys(copy).find(x => copy[x].type === 'nega'));
    if (isNaN(c)) return {
        'negator': puzzle.negatorResults,
        'copier': puzzle.copierResults,
        'invalid': validatePuzzle(puzzle, global, quick)
    };
    delete copy[c];
    let regionNum = global.regionCells.cell.findIndex(x => x.includes(c));
    if (regionNum === -1) return validatePuzzleForNegators(puzzle, global, copy, quick);
    let [x, y] = xy(c);
    let inv;
    let found = false;
    for (let k in copy) {
        k = Number(k);
        if (!global.regionCells.all[regionNum].includes(k)
        && !(copy[k].dot <= window.CUSTOM_X && (
               (((dotToSpokes(copy[k].dot) - 1) & 0x1) && global.regions.cell[regionNum].includes(k - 1 - puzzle.width))
            || (((dotToSpokes(copy[k].dot) - 1) & 0x2) && global.regions.cell[regionNum].includes(k + 1 - puzzle.width))
            || (((dotToSpokes(copy[k].dot) - 1) & 0x4) && global.regions.cell[regionNum].includes(k - 1 + puzzle.width))
            || (((dotToSpokes(copy[k].dot) - 1) & 0x8) && global.regions.cell[regionNum].includes(k + 1 + puzzle.width))
        ))) continue;
        let puzzle2 = clonePuzzle(puzzle);
        let [x1, y1] = xy(c);
        let [x2, y2] = xy(k);
        if ((x2 % 2 !== 1 || y2 % 2 !== 1) && !puzzle.grid[x2][y2].dot) continue;
        puzzle2.grid[x1][y1] = null;
        if (x2 % 2 !== 1 || y2 % 2 !== 1) delete puzzle2.grid[x2][y2].dot
        else puzzle2.grid[x2][y2] = null;
        puzzle2.negatorResults[c] = k;
        let ccopy = {...copy};
        delete ccopy[k];
        inv = validatePuzzleForNegators(puzzle2, global, ccopy, quick);
        found = true;
        if (!inv.invalid.length) return inv;
    }
    if (found) return inv;
    else {
        let res = validatePuzzleForNegators(puzzle, global, copy, quick);
        res.invalid.push({'x': x, 'y': y});
        return res;
    }
}

function clonePuzzle(puzzle, grid = puzzle.grid) {
    let puzzle2 = new Puzzle(1, 1) // default puzzle gen
    for (let k in puzzle) puzzle2[k] = puzzle[k];
    puzzle2.grid = JSON.parse(JSON.stringify(grid));
    puzzle2.negatorResults = {...puzzle.negatorResults};
    puzzle2.copierResults = {...puzzle.copierResults};
    return puzzle2;
}

function validatePuzzle(puzzle, global, quick) {
    puzzle.invalidElements = [];
    puzzle.failmandering = false;
    if (puzzle.valid) {
        for (fn of preValidate) {
            if (fn.or ? intersects(fn.or, global.shapes) : (fn.orNot ? !intersects(fn.orNot, global.shapes) : fn.orCustom(puzzle, global))) { // prereq for exec
                if (!puzzle.valid && quick) break; fn.exec(puzzle, global, quick);
            }
        }
        for (fn of lineValidate) { // zeroth region (on-the-line) detection
            if (fn.or ? intersects(fn.or, global.regionShapes[0]) : (fn.orNot ? !intersects(fn.orNot, global.regionShapes[0]) : fn.orCustom(puzzle, global))) { 
                if (!puzzle.valid && quick) break; fn.exec(puzzle, global, quick);
            }
        }
        for (let i = 1; i < global.regions.all.length; i++) { // there is at least 1 region (i think)
            for (fn of validate) {
                if (fn.or ? intersects(fn.or, global.regionShapes[i]) : (fn.orNot ? !intersects(fn.orNot, global.regionShapes[i]) : fn.orCustom(puzzle, global))) { 
                    if (!puzzle.valid && quick) break; fn.exec(puzzle, i, global, quick);
                }
            }
        }
    }
    for (r of global.regionData) puzzle.invalidElements = puzzle.invalidElements.concat(r);
    if (global.invalidXs) puzzle.invalidElements = puzzle.invalidElements.concat(global.invalidXs);
    if (global.invalidEyes) puzzle.invalidElements.push(...global.invalidEyes)
    puzzle.invalidElements = Array.from(new Set(puzzle.invalidElements));
    if (puzzle.grid[puzzle.startPoint.x][puzzle.startPoint.y].start === 2) {
        let rc = Array.from(new Set(global.regionCells.all.flat()));
        for (let c of rc) {
            if (cel(puzzle, c)?.type == "null") continue;
            if (puzzle.invalidElements.includes(c)) puzzle.invalidElements.splice(puzzle.invalidElements.indexOf(c), 1);
            else puzzle.invalidElements.push(c);
        }
    }
    for (let i = 0; i < puzzle.invalidElements.length; i++) {
        let c = puzzle.invalidElements[i];
        let [x, y] = xy(c);
        puzzle.invalidElements[i] = {'x': x, 'y': y};
    }
    if (puzzle.failmandering) puzzle.invalidElements.push({'x': -1, 'y': -1})
    return puzzle.invalidElements;
}

function init(puzzle) { // initialize globals
    let units = [], names = [];
    units.push(performance.now());
    names.push('init');
    let global = {
        'valid': true,
        'shapes': new Set(),
        'regionData': [],
        'regionNum': 0,
        'regionMatrix': Array.from({ length: puzzle.height }, () => Array.from({ length: puzzle.width }, () => -1)),
        'regions': {
            all: [[]],
            cell: [],
            line: [],
            corner: [],
            edge: [],
        },
        'thingsToCopy': {}
    };
    global.path = [];
    units.push(performance.now());
    names.push('deep copying grid');
    const _dir = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
    const pk = [null, 'left', 'right', 'top', 'bottom'];
    for (let o of puzzle.path) {
        let k, x, y;
        if (typeof(o) == 'object') global.path.push([ret(o.x, o.y)]);
        else {
            k = global.path.length - 1;
            [x, y] = xy(global.path[k]);
            if (!o) break;
            global.path[k].push(endEnum.indexOf(pk[o]));
            [_x, _y] = [rdiv(x + _dir[o][0], puzzle.width), y + _dir[o][1]];
            global.path.push([ret(_x, _y)]);
            let cell = cel(puzzle, ret(_x, _y));
            if (window.bridges.includes(cell?.gap)) {
                global.bridgeBranches ??= [];
                global.bridgeBranches.push({
                    'type': cell.gap,
                    'pos': {'x': _x, 'y': _y},
                    'path': k + 1
                });
            }
            if (puzzle.symmetry != null) {
                let sym = puzzle.getSymmetricalPos(_x, _y);
                let symCell = puzzle.getCell(sym.x, sym.y);
                if (window.bridges.includes(symCell?.gap)) {
                    global.bridgeBranches ??= [];
                    global.bridgeBranches.push({
                        'type': symCell.gap,
                        'pos': {'x': sym.x, 'y': sym.y},
                        'path': k + 1
                    });
                }
            }
        }
    }
    global.pathSym = [];
    global.pathAll = [...global.path];
    units.push(performance.now());
    names.push('transcribing path to global');
    let _OPPOSITE = [1, 0, 3, 2];
    if (puzzle.symmetry != null) {
        for (let c of global.path) {
            let o = puzzle.getSymmetricalPos(...xy(c[0]));
            if (c[1] === undefined) global.pathSym.push([ret(o.x, o.y)]);
            else global.pathSym.push([ret(o.x, o.y), _OPPOSITE[c[1]]]);
        }
        global.pathAll = [];
        for (let i = 0; i < global.path.length; i++) {
            global.pathAll.push(global.path[i]);
            global.pathAll.push(global.pathSym[i]);
        }
    }
    units.push(performance.now());
    names.push('symmetry handling');
    let i = 0;
    let portalColorPos = {};
    let portalRegionPos = {};
    let portalRegionColor = {};
    let portalColorRegion = {};
    let portalPosColor = {};
    let portalPosRegion = {};
    let eyes = [];
    for (let x = 0; x < puzzle.width; x++) {
        for (let y = 0; y < puzzle.height; y++) {
            let cell = puzzle.grid[x][y];
            if (cell == null) continue;
            if (cell.type !== 'line' || cell.dot) {
                global.thingsToCopy[ret(x, y)] = {...cell};
                delete global.thingsToCopy[ret(x, y)].color;
                delete global.thingsToCopy[ret(x, y)].line;
                delete global.thingsToCopy[ret(x, y)].dir;
            }
            if ((x % 2) == 1 && (y % 2) == 1) {
                if (cell.type == 'portal') {
                    global.shapes.add('portal');
                    safepush(portalColorPos, cell.color, ret(x, y));
                    portalPosColor[ret(x, y)] = cell.color;
                }
                else if (cell.type == 'eye') {
                    global.shapes.add('eye');
                    eyes.push([x, y, puzzle.getCell(x, y).count]);
                }
            }
            else if ((x % 2) != (y % 2)) {
                if (cell.gap === window.CUSTOM_LINE) {
                    global.shapes.add('line');
                    for (let o of (x % 2 ? [ret(x, y), retPillar(puzzle, x-1, y), retPillar(puzzle, x+1, y)] : [ret(x, y), retPillar(puzzle, x, y+1), retPillar(puzzle, x, y-1)])) {
                        if (!(global.pathAll.findIndex(z => z[0] == o) + 1)) {
                            global.pathSym.push([o]);
                            global.pathAll.push([o]);
                            puzzle.getCell(...xy(o)).line = LINE_BLACK;
                        }
                    }
                }
                else if (window.bridges.includes(cell.gap)) global.shapes.add('bridgeButActually');
            }
        }
    }
    units.push(performance.now());
    names.push('init symboltypes handling');
    const _EYEDIR = [[1234, 5678], [0, -1], [1, 0], [0, 1], [-1, 0]];
    const find = (x, c) => x[0] === c;
    // const verts = (x, y, invert=false) => {
    //     let res = ((x % 2) == invert) ? [[x, y], [x, y+1], [x, y-1]] : [[x, y], [x+1, y], [x-1, y]];
    //     let ret = [];
    //     if (puzzle.pillar) for (z of res) z[0] = rdiv(z[0], puzzle.width);
    //     for (o of res) if (isBounded(puzzle, ...o)) ret.push(o);
    //     return ret;
    // }
    for (let o of eyes) {
        let found = false;
        for (
            let [x, y] = [o[0] + _EYEDIR[o[2]][0], o[1] + _EYEDIR[o[2]][1]]; 
            isBounded(puzzle, x, y) && (x != o[0] || y != o[1]); 
            [x, y] = [puzzle.pillar ? (rdiv(x + _EYEDIR[o[2]][0], puzzle.width)) : (x + _EYEDIR[o[2]][0]), y + _EYEDIR[o[2]][1]]
        ) {
            let k = global.pathAll.findIndex(z => find(z, ret(x, y)));
            if (k !== -1) {
                found = true;
                let [x, y] = xy(global.pathAll[k][0]);
                const c = ret(x, y);
                global.pathAll.splice(global.pathAll.findIndex(x => find(x, c)), 1);
                const pi = global.path.findIndex(x => find(x, c));
                const psi = global.path.findIndex(x => find(x, c));
                if (pi !== -1) global.path.splice(pi, 1);
                if (psi !== -1) global.pathSym.splice(psi, 1);
                puzzle.getCell(x, y).line = LINE_NONE;
                break;
            }
        }
        if (!found) {
            console.info('[!] Eye Fault: no line seen at', o[0], o[1]);   
            global.invalidEyes ??= [];
            global.invalidEyes.push(ret(o[0], o[1]));
        }
    }
    units.push(performance.now());
    names.push('eye handling');
    for (region of puzzle.getRegions()) {
        i++;
        global.regions.all.push([])
        for (const pos of region.cells) {
            global.regionMatrix[pos.y][pos.x] = i;
        }
        global.regionNum = i + 1;
    }
    for (let x = 1; x < puzzle.width; x+=2) for (let y = 1; y < puzzle.height; y+=2) {
        for (let [xx, yy] of [[x-1, y-1], [x-1, y+1], [x+1, y-1], [x+1, y+1]]) 
            if (global.regionMatrix[y][x] > 0) global.regionMatrix[yy][xx] = global.regionMatrix[y][x];
    }
    for (let x = 1; x < puzzle.width; x+=2) for (let y = 1; y < puzzle.height; y+=2) {
        for (let [xx, yy] of [[x, y-1], [x, y+1], [x-1, y], [x+1, y]]) 
            if (global.regionMatrix[y][x] > 0) global.regionMatrix[yy][xx] = global.regionMatrix[y][x];
    }
    for (let o of global.pathAll) {
        let [x, y] = xy(o[0]);
        global.regionMatrix[y][x] = 0;
    }
    for (let x = 0; x < puzzle.width; x++) for (let y = 0; y < puzzle.height; y++) if (global.regionMatrix[y][x] != -1)
        global.regions.all[global.regionMatrix[y][x]].push(ret(x, y));
    units.push(performance.now());
    names.push('region handling');
    if (global.shapes.has('portal')) { // certified portal business
        for (const color in portalColorPos) for (const c of portalColorPos[color]) {
            const region = matrix(puzzle, global, ...xy(c));
            safepush(portalRegionPos, region, c);
            portalPosRegion[c] = region;
            safepush(portalRegionColor, region, color);
            safepush(portalColorRegion, color, region);
        }
        // step 1: find two in same region
        for (const region in portalRegionColor) {
            if ((new Set(portalRegionColor[region])).size !== portalRegionColor[region].length) { // check duppes
                console.info('[!] Portal Fault: dupe portal at region', region);
                puzzle.invalidElements.push(...(portalRegionPos[region]));
            }
        }
        if (puzzle.valid) {
            // step 2: link together
            let portalRegionLinks = [];
            let temp = null;
            for (const group of Object.values(portalColorRegion)) {
                temp = group;
                for (let i = 0; i < portalRegionLinks.length; i++) {
                    if (temp.length == 1) {
                        temp = null;
                        break;
                    } else if (contains(portalRegionLinks[i], temp)) {
                        console.info('[!] Portal Fault: portal loop detected');
                        puzzle.valid = false;
                        for (let region of Array.from(new Set([...group, ...portalRegionLinks[i]])))
                            puzzle.invalidElements.push(...(portalRegionPos[region]));
                        return [puzzle, global];
                    } else if (intersects(portalRegionLinks[i], temp)) {
                        portalRegionLinks[i].push(...temp);
                        temp = null;
                        break;
                    }
                }
                if (temp) {
                    portalRegionLinks.push(temp);
                }
            }
            portalRegionLinks = portalRegionLinks.map(arr => [...new Set(arr)]);
            // step 3: merge the regions
            function calcSpan(arr, span=[null, null, null, null], offset=[0, 0]) {
                let [x1, y1, x2, y2] = span;
                for (const c of arr) {
                    let [x, y] = xy(c);
                    x += offset[0]; y += offset[1];
                    if (x1 === null) [x1, y1, x2, y2] = [x, y, x, y];
                    else {
                        if (x < x1) x1 = x;
                        if (x > x2) x2 = x;
                        if (y < y1) y1 = y;
                        if (y > y2) y2 = y;
                    }
                }
                return [x1, y1, x2, y2];
            }

            function loop(data, sourceRegion, sourceOffset) {
                for (const source of portalRegionPos[sourceRegion]) {
                    data.originalRegions.all[data.originalRegionNums.indexOf(portalPosRegion[source])] = global.regions.all[portalPosRegion[source]].slice();
                    const color = portalPosColor[source];
                    const destList = portalColorPos[color].filter(e => e != source);
                    for (const dest of destList) {
                        if (dest === undefined) continue;
                        const region = portalPosRegion[dest];
                        if (data.originalRegionNums.includes(region)) continue;
                        data.originalRegionNums.push(region);
                        let [x1, y1, x2, y2] = [...xy(source), ...xy(dest)];
                        const offset = [x1 - x2 + sourceOffset[0], y1 - y2 + sourceOffset[1]];
                        data.offset.push(offset);
                        data.totalSpan = calcSpan(global.regions.all[region], data.totalSpan, offset);
                        loop(data, region, offset);
                    }
                }
            }
            
            if (portalRegionLinks.reduce((prv, cur) => { return Math.max(cur.length, prv) }, 0) > 1) { // single portal (trol)
                global.portalData = {};
                portalRegionLinks = portalRegionLinks.map(arr => { return arr.sort((a, b) => a - b) }); // sort
                for (const group of portalRegionLinks) { // actual start of step 3 (pane)
                    global.portalData[group[0]] = {
                        'originalRegionNums': [group[0]],
                        'originalRegions': {
                            all: [],
                            cell: [],
                            line: [], 
                            corner: [],
                            edge: [],
                        },
                        'regions': {
                            all: [],
                            cell: [],
                            line: [],
                            corner: [],
                            edge: [],
                        },
                        'regionPosCell': {},
                        'totalSpan': calcSpan(global.regions.all[group[0]]), // x1, y1, x2, y2
                        'offset': [[0, 0]], // x, y
                    };
                    let data = global.portalData[group[0]];
                    loop(data, group[0], data.offset[0]);
                    if (data.totalSpan[0] > data.totalSpan[2]) { let temp = data.totalSpan[0]; data.totalSpan[0] = data.totalSpan[2]; data.totalSpan[2] = temp; }
                    if (data.totalSpan[1] > data.totalSpan[3]) { let temp = data.totalSpan[1]; data.totalSpan[1] = data.totalSpan[3]; data.totalSpan[3] = temp; }
                    data.totalSpan[2] += 1; data.totalSpan[3] += 1;
                    if ((data.totalSpan[0] % 2) != 0) data.totalSpan[0] -= 1;
                    if ((data.totalSpan[1] % 2) != 0) data.totalSpan[1] -= 1;
                    if ((data.totalSpan[2] % 2) != 0) data.totalSpan[2] += 1;
                    if ((data.totalSpan[3] % 2) != 0) data.totalSpan[3] += 1;
                    data.width = data.totalSpan[2] - data.totalSpan[0] + 1;
                    data.height = data.totalSpan[3] - data.totalSpan[1] + 1;
                    if (puzzle.pillar && data.width > puzzle.width) {
                        data.width = puzzle.width;
                        data.totalSpan[2] = data.totalSpan[0] + puzzle.width;
                        data.isPillar = true;
                    }
                    for (let i = 0; i < data.offset.length; i++) {
                        const list = data.originalRegions.all[i];
                        for (const c of list) {
                            let [x, y] = xy(c);
                            let cell = puzzle.getCell(x, y);
                            const newc = getPortalCoords(c, data);
                            data.regions.all.push(newc);
                            if (!cell || (cell.type == 'line' && !cell.dot)) continue;
                            safepush(data.regionPosCell, newc, cell);
                        }
                        data.regions.all = [...new Set(data.regions.all)];
                    }
                }
                // step 4: actually merge regions
                let conversionTable = Array.from({length: global.regionNum}, (_, i) => i);
                for (const data of Object.values(global.portalData)) {
                    for (let i = 1; i < data.originalRegionNums.length; i++) {
                        const num = conversionTable.indexOf(data.originalRegionNums[i]);
                        if (num < 0) continue; // sanity check
                        conversionTable.splice(num, 1, data.originalRegionNums[0]);
                    }
                }
                let numLookup = [...new Set(conversionTable)].sort((a, b) => a - b);
                conversionTable = conversionTable.map(a => numLookup.indexOf(a));
                for (const num in global.portalData) {
                    global.regions.all[num] = global.portalData[num].originalRegions.all.flat();
                }
                global.regions.all = global.regions.all.filter((_, i) => numLookup.includes(i));
                global.regionMatrix = global.regionMatrix.map(row => row.map(i => conversionTable[i]))
                global.regionNum = numLookup.length;
                // step 4.5: rename
                global.portalRegion = [];
                global.portalData = Object.values(global.portalData);
                for (const i in global.portalData) for (const k of global.portalData[i].originalRegionNums) {
                    global.portalRegion[i] = conversionTable[k]
                }
            }
        }
    }
    units.push(performance.now());
    names.push('portal handling');
    for (let i = 0; i < global.regionNum; i++) {
        global.regionData.push([])
    }
    for (let x = 0; x < puzzle.width; x++) {
        for (let y = 0; y < puzzle.height; y++) {
            let c = ret(x, y);
            if (global.regionMatrix[y][x] == 0) global.regions.all[0].push(c)
            let cell = puzzle.grid[x][y];
            if (cell == null) continue;
            // dots
            if (cell.dot >= window.CUSTOM_FISH_BLACK) global.shapes.add('fish')
            else if (cell.dot >= window.CUSTOM_COMPARATOR) global.shapes.add('comparator')
            else if (window.SOUND_DOT   <= cell.dot && cell.dot <  window.CUSTOM_COMPARATOR) global.shapes.add('soundDot')
            else if (window.CUSTOM_DOTS <= cell.dot && cell.dot <  window.SOUND_DOT   ) global.shapes.add('dots')
            else if (window.DOT_NONE     < cell.dot && cell.dot <  window.CUSTOM_DOTS ) global.shapes.add('dot')
            else if (window.CUSTOM_CURVE < cell.dot && cell.dot <= window.CUSTOM_CROSS) global.shapes.add('cross')
            else if (window.    CUSTOM_X < cell.dot && cell.dot <= window.CUSTOM_CURVE) global.shapes.add('curve')
            else if (                                  cell.dot <= window.CUSTOM_X    ) {
                global.shapes.add('x')
                global.thingsToCopy[ret(x, y)] = cell;
            }
            if (NONSYMBOLS.includes(cell.type)) continue;
            global.shapes.add(cell.type);
        }
    }
    units.push(performance.now());
    names.push('regiondata handling');
    // ACCESS POINTS FILTERING
    function filterRegionArr(data, source, dest, fn) {
        data[dest] = data[source].map(arr => arr.filter(c => fn(...xy(c))));
    }

    filterRegionArr(global.regions, 'all', 'cell',    detectionMode.cell);
    filterRegionArr(global.regions, 'all', 'line',    detectionMode.line);
    filterRegionArr(global.regions, 'line', 'corner', detectionMode.corner);
    filterRegionArr(global.regions, 'line', 'edge',   detectionMode.edge);

    global.regionCells = { all: [], cell: [], line: [], corner: [], edge: [] };
    for (const region of global.regions.all) {
        global.regionCells.all.push(region.filter(c => {
            let cell = cel(puzzle, c);
            if (!cell) return false;
            if (cell.type !== 'line') return true;
            if (cell.dot) return true;
            return (cell.gap && window.bridges.includes(cell.gap));
        }));
    }
    
    filterRegionArr(global.regionCells, 'all', 'cell',    detectionMode.cell);
    filterRegionArr(global.regionCells, 'all', 'line',    detectionMode.line);
    filterRegionArr(global.regionCells, 'line', 'corner', detectionMode.corner);
    filterRegionArr(global.regionCells, 'line', 'edge',   detectionMode.edge);

    if (global.portalData) for (const data of global.portalData) { 
        const w = data.width;
        filterRegionArr(data.originalRegions, 'all', 'cell',    detectionMode.cell);
        filterRegionArr(data.originalRegions, 'all', 'line',    detectionMode.line);
        filterRegionArr(data.originalRegions, 'line', 'corner', detectionMode.corner);
        filterRegionArr(data.originalRegions, 'line', 'edge',   detectionMode.edge);
        
        data.regions.cell   = data.regions.all .filter(c => detectionMode.cell  (...xy(c, w)));
        data.regions.line   = data.regions.all .filter(c => detectionMode.line  (...xy(c, w)));
        data.regions.corner = data.regions.line.filter(c => detectionMode.corner(...xy(c, w)));
        data.regions.edge   = data.regions.line.filter(c => detectionMode.edge  (...xy(c, w)));
    }
    units.push(performance.now());
    names.push('regiondata filtering');

    global.regionShapes = [];
    for (const region of global.regionCells.all) {
        let st = new Set();
        for (shape of region) {
            const cell = cel(puzzle, shape);
            if (cell?.type == 'line') {
                if (window.CUSTOM_BRIDGE <= cell?.gap && cell?.gap < window.CUSTOM_CROSSING) st.add('bridgeButActually');
                else if (!cell.dot) continue;
                if (cell.dot >= window.CUSTOM_FISH_BLACK) st.add('fish')
                else if (cell.dot >= window.CUSTOM_COMPARATOR) st.add('comparator')
                else if (window.SOUND_DOT    <= cell.dot && cell.dot < window.CUSTOM_COMPARATOR) st.add('soundDot')
                else if (window.CUSTOM_DOTS  <= cell.dot && cell.dot < window.SOUND_DOT   ) st.add('dots')
                else if (window.DOT_BLACK    <= cell.dot && cell.dot < window.CUSTOM_DOTS ) st.add('dot');
                else if (window.CUSTOM_CROSS >= cell.dot && cell.dot > window.CUSTOM_CURVE) st.add('cross');
                else if (window.CUSTOM_CURVE >= cell.dot && cell.dot > window.CUSTOM_X    ) st.add('curve');
                else if (window.CUSTOM_X >= cell.dot) st.add('x');
            } else st.add(cell?.type);
        }
        global.regionShapes.push([...st]);
    }
    global.shapes = Array.from(global.shapes); // array-ify shapes for streamline
    if (intersects(COLOR_DEPENDENT, global.shapes)) { // colorify
        global.regionColors = {
            all: [],
            cell: [],
            line: [],
            corner: [],
            edge: [],
        };
        for (const [k, regions] of Object.entries(global.regionCells)) {
            let i = 0;
            for (const region of regions) {
                global.regionColors[k].push({});
                for (const pos of region) { // triple loop! yeahhhh
                    const cell = cel(puzzle, pos);
                    if (cell?.color === null || cell?.color === undefined) continue;
                    global.regionColors[k][i][cell.color] ??= [];
                    global.regionColors[k][i][cell.color].push(pos);
                }
                i++;
            }
        }
    }
	for (let shape of ['bridge','drop']){
		if (global.shapes.includes(shape)){
			global.portalColorPos = portalColorPos;
			break;
		}
	}
    
    units.push(performance.now());
    names.push('other works');
    if (console.log !== function(){}) for (let i = 1; i < units.length; i++) console.log(names[i], ':', (units[i] - units[i-1]), 'ms')
    return [puzzle, global];
}

const preValidate = [
    {
        '_name': 'WRONG COLORED LINE DETECTION',
        'or': ['dot', 'cross', 'curve', 'dots'], // this should trigger on all poly
        'exec': function(puzzle, global, quick) {
            const DOT_BLUE   = [window.DOT_BLUE, window.CUSTOM_CROSS_BLUE, window.CUSTOM_CROSS_BLUE_FILLED, window.CUSTOM_CURVE_BLUE, window.CUSTOM_CURVE_BLUE_FILLED, 14, 15, 21, 22, 28, 29, 35, 36];
            const DOT_YELLOW = [window.DOT_YELLOW, window.CUSTOM_CROSS_YELLOW, window.CUSTOM_CROSS_YELLOW_FILLED, window.CUSTOM_CURVE_YELLOW, window.CUSTOM_CURVE_YELLOW_FILLED, 16, 17, 23, 24, 30, 31, 37, 38];
            for (let c of global.regionCells.all[0]) { // cell on line rn
                let [x, y] = xy(c);
                let cell = puzzle.grid[x][y];
                if ((DOT_BLUE.includes(cell.dot) && cell.line !== window.LINE_BLUE)
                || (DOT_YELLOW.includes(cell.dot) && cell.line !== window.LINE_YELLOW)) {
                    console.info('[pre][!] Wrong Colored Dots: ', x, ',', y)
                    global.regionData[0].push(c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'INIT POLYOMINO VALIDATION',
        'or': ['poly', 'ylop', 'polynt', 'xvmino', 'scaler'],
        'exec': function(puzzle, global, quick) {
            global.polyntCorrect = []; global.polyIncorrect = [];
        }
    }, {
        '_name': 'TENUOUS TRIANGLE VALUE DETERMINATION',
        'or': ['vtriangle'],
        'exec': function(puzzle, global, quick) {
            global.vtriangleColors = {};
            for (const region of global.regionCells.cell) for (const c of region) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                let color = cell.color;
                if (quick && global.vtriangleColors[color] == -1) continue;
                let count = 0;
                if (matrix(puzzle, global, x+1, y) === 0) count++;
                if (matrix(puzzle, global, x-1, y) === 0) count++;
                if (matrix(puzzle, global, x, y-1) === 0) count++;
                if (matrix(puzzle, global, x, y+1) === 0) count++;
                if (count == 0) count = -1;
                global.vtriangleColors[color] ??= count;
                for (const [k, v] of Object.entries(global.vtriangleColors)) {
                    if (k == color) { if (v != count)   global.vtriangleColors[k] = -1; }
                    else              if (v == count) { global.vtriangleColors[k] = -1; global.vtriangleColors[color] = -1; }
                }
            }
            puzzle.vtriangleResult = [];
            for (let i = 1; i <= 3; i++) puzzle.vtriangleResult.push(Number((Object.entries(global.vtriangleColors).find(x => x[1] == i)?.[0]) ?? -1));
        }
    }, {
        '_name': 'SIZER VALUE DETERMINATION',
        'or': ['sizer'],
        'exec': function(puzzle, global, quick) {
            let globalSizerInfo = [];
            for (let i = 1; i < global.regionNum; i++) { 
                const region = global.regionCells.cell[i];
                let sizerInfo = {size: 0, weight: {}, pos: {}};
                sizerInfo.size = global.regions.cell[i].length;
                for (const c of region) {
                    let [x, y] = xy(c);
                    let cell = puzzle.getCell(x, y);
                    if (!this.or.includes(cell.type)) continue;
                    let color = cell.color;
                    if (!sizerInfo.pos[color]) sizerInfo.pos[color] = [];
                    sizerInfo.pos[color].push(c);
                }
                if (Object.keys(sizerInfo.pos).length === 0) continue; // no sizer in the region
                for (const k in sizerInfo.pos) {
                    sizerInfo.weight[k] = sizerInfo.size / sizerInfo.pos[k].length;
                    if (sizerInfo.size % sizerInfo.pos[k].length != 0) sizerInfo.weight[k] = -1;
                }
                globalSizerInfo.push(sizerInfo);
            }
            global.sizerWeights = {}
            for (const i in globalSizerInfo) {
                for (const [k, v] of Object.entries(globalSizerInfo[i].weight)) {
                    if (global.sizerWeights[k] == -1) continue;
                    global.sizerWeights[k] ??= v;
                    if (global.sizerWeights[k] != v) global.sizerWeights[k] = -1;
                }
            }
        }
    }, {
        '_name': 'BLACK HOLES CHECK',
        'or': ['blackhole', 'whitehole'],
        'exec': function(puzzle, global, quick) {
            let count = {};
            let pos = {};
            global.invalidHoles = [];
            for (const region of global.regionCells.cell) for (const c of region) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                let color = cell.type + cell.color;
                if (!pos[color]) {
                    count[color] = [0, 0, 0, 0];
                    pos[color] = [];
                }
                pos[color].push(c);
                if (cell.type == 'blackhole') {
                    if (matrix(puzzle, global, x+1, y) === 0) count[color][0]++;
                    if (matrix(puzzle, global, x-1, y) === 0) count[color][1]++;
                    if (matrix(puzzle, global, x, y-1) === 0) count[color][2]++;
                    if (matrix(puzzle, global, x, y+1) === 0) count[color][3]++;
                } else {
                    if (matrix(puzzle, global, x+1, y+1) === 0) count[color][0]++;
                    if (matrix(puzzle, global, x-1, y-1) === 0) count[color][1]++;
                    if (matrix(puzzle, global, x+1, y-1) === 0) count[color][2]++;
                    if (matrix(puzzle, global, x-1, y+1) === 0) count[color][3]++;
                }
            }
            for (color in pos) {
                if (!(count[color][0] == 1 && count[color][1] == 1 && count[color][2] == 1 && count[color][3] == 1)) {
                    global.invalidHoles.push(...pos[color]);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'BRIDGE CROSS-REGION CHECK',
        'or': ['bridge'],
        'exec': function(puzzle, global, quick) {
            global.bridges = {};
            global.invalidBridges = {};
            global.bridgeRegions = {};
            for (const region of global.regionCells.cell) {
                let bridges = {};
                for (const c of region) {
                    let [x, y] = xy(c);
                    let cell = puzzle.getCell(x, y);
                    if (!this.or.includes(cell.type)) continue;
                    let color = cell.color;
                    global.bridgeRegions[color] ??= new Set([matrix(puzzle, global, x, y)]);
                    global.bridgeRegions[color].add(matrix(puzzle, global, x, y));
                    if (global.bridges[color]) { // already existing
                        global.invalidBridges[color] ??= global.bridges[color];
                        delete global.bridges[color];
                        global.invalidBridges[color].push(c);
                    } else {
                        if (!bridges[color]) bridges[color] = [];
                        bridges[color].push(c);
                    }
                }
                Object.assign(global.bridges, bridges);
            }
            for (const k in global.bridgeRegions) global.bridgeRegions[k] = Array.from(global.bridgeRegions[k]);
            // TODO: change this with better negation handling after ur done negating
            Object.assign(global.bridges, global.invalidBridges);
            let bridgeRegions = Array.from({length: global.regionNum}, () => []);
            for (const [color, regions] of Object.entries(global.bridgeRegions)) {
                for (const region of regions) bridgeRegions[region].push(color);
            }
            global.bridgeRegions = bridgeRegions;
        }
    }, {
        '_name': 'BELL CHECK',
        'or': ['bell'],
        'exec': function (puzzle, global, quick) {
            const keyValues = [[1, 2, 4, 8], [4, 1, 8, 2], [8, 4, 2, 1], [2, 8, 1, 4], [1, 4, 2, 8], [4, 8, 1, 2], [8, 2, 4, 1], [2, 1, 8, 4]];
            const dirs = [[0, -1], [1, 0], [-1, 0], [0, 1]];
            let sides = {};
            let bells = {};

            for (let region of global.regionCells.cell) for (let c of region) {
                let cell = cel(puzzle, c);
                if (!this.or.includes(cell?.type)) continue;
                bells[cell.color] ??= []; 
                bells[cell.color].push(c);
                if (sides[cell.color] === -1) continue;
                let side = 0;
                // detect lines
                for (let i in endEnum) {
                    let [x, y] = xy(c);
                    if (matrix(puzzle, global, x + dirs[i][0], y + dirs[i][1]) === 0)
                        side |= keyValues[/* (cell.flip << 2) + */ cell.count - 1][i]
                }
                if (sides[cell.color] === undefined) sides[cell.color] = side;
                else if (sides[cell.color] !== side) {
                    sides[cell.color] = -1;
                    if (quick) {
                        puzzle.invalidElements.push(c);
                        return;
                    }
                }
            }
            for (color in sides) if (sides[color] === -1) for (c of bells[color]) puzzle.invalidElements.push(c);
        }
    }, {
        '_name': 'JERRYMANDERING CHECK',
        'orCustom': (puzzle, global) => puzzle.jerrymandering,
        'exec': function (puzzle, global, quick) {
            const LINECOLOR = 36;
            let regions = {};
            for (let region of global.regionCells.cell) {
                let colors = {};
                for (let c of region) {
                    let color = cel(puzzle, c)?.color;
                    colors[color] ??= 0;
                    colors[color]++;
                }
                let mx = Math.max(...Object.values(colors));
                let winners = [];
                for (let k in colors) if (colors[k] === mx) winners.push(k);
                if (winners.length === 1) {
                    regions[winners[0]] ??= 0;
                    regions[winners[0]]++;
                }
            }
            let k = Object.keys(regions);
            if (!(k.length && k.reduce((prev, cur) => prev && ((cur == LINECOLOR) || regions[cur] < regions[LINECOLOR]), true))) {
                console.info('[!] Jerrymandering Failed');
                puzzle.failmandering = true;
                if (quick) return;
            }
        }
    }, {
        '_name': "FISH CHECK",
        'or': ['fish'],
        'exec': function(puzzle, global, quick) {
            let collected_fish = new Set();
            let uncollected_fish = new Set();

            // find all fish
            for (let regionNum = 0; regionNum < global.regions.line.length; regionNum++) for (let c of global.regions.line[regionNum]) {
                let cell = cel(puzzle, c);

                switch (cell?.dot) {
                    case CUSTOM_FISH_BLACK:
                        if (regionNum === 0) collected_fish.add(c);
                        else uncollected_fish.add(c);
                        break;
                    case CUSTOM_FISH_BLUE:
                    case CUSTOM_FISH_YELLOW:
                        uncollected_fish.add(c)
                        break;
                }
            }

            // Mop up colourful fish (better performance than doing this in prev loop, right?)
            if (puzzle.symmetry != null) {
                for (let [c] of global.path) {
                    let cell = cel(puzzle, c);
                    if (cell?.dot === CUSTOM_FISH_BLUE) {
                        uncollected_fish.delete(c)
                        collected_fish.add(c)
                    }
                }
                for (let [c] of global.pathSym) {
                    let cell = cel(puzzle, c);
                    if (cell?.dot === CUSTOM_FISH_YELLOW) {
                        uncollected_fish.delete(c)
                        collected_fish.add(c)
                    }
                }
            }

            let fishDiff = collected_fish.size - uncollected_fish.size;
            if (fishDiff < -1) {
                // too few fish
                for (const c of uncollected_fish) {
                    let [x,y] = xy(c)
                    let regionNum = global.regionMatrix[y][x]
                    global.regionData[regionNum].push(c)
                    if (quick && !puzzle.valid) return;
                }
            }
            else if (fishDiff > 1) {
                // too many fish
                for (const c of collected_fish) global.regionData.push(c);
            }
        }
    }
];

const lineValidate = [
    {
        '_name': 'CROSS N CURVES',
        'or': ['cross', 'curve'],
        'exec': function(puzzle, global, quick) {
            const check = [[0, -1], [1, 0], [-1, 0], [0, 1]];
            const corner = [[6, 9], [3, 5, 10, 12]];
            for (let c of global.regionCells.corner[0]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (DOT_NONE <= cell.dot || cell.dot <= CUSTOM_X) continue;
                let coll = check.map(o => matrix(puzzle, global, x + o[0], y + o[1]) == 0);
                // endpoint detection
                let hasEnd = endEnum.indexOf(cell.end)
                if (hasEnd !== -1) coll[hasEnd] = true;
                coll = makeBitSwitch(...coll);
                let found = false;
                for (let o of (cell.dot > window.CUSTOM_CURVE ? corner[0] : corner[1])) if ((coll & o) === o) { found = true; break; }
                if (found) continue;
                console.info('[line][!] Wrongly Crossed... well, Cross: ', x, y);
                global.regionData[0].push(c);
                if (!puzzle.valid && quick) return;
            }
        }
    }, {
        '_name': 'X MARKINGS',
        'or': ['x'],
        'exec': function(puzzle, global, quick) {
            global.invalidXs = [];
            for (let c of global.regionCells.corner[0]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (cell.dot > window.CUSTOM_X) continue;
                let spokes = -cell.dot - 13
                let regions = new Set();
                if (spokes & 1) regions.add(matrix(puzzle, global, x-1, y-1));
                if (spokes & 2) regions.add(matrix(puzzle, global, x+1, y-1));
                if (spokes & 4) regions.add(matrix(puzzle, global, x-1, y+1));
                if (spokes & 8) regions.add(matrix(puzzle, global, x+1, y+1));
                for (const region of regions) global.regionShapes[region].push('x');
                global.invalidXs.push(c);
            }
        }
    }, {
        '_name': 'DOTS LINK',
        'or': ['dots'],
        'exec': function(puzzle, global, quick) {
            let x, y, cell, c;
            let q = -1;
            for (let o of global.path) {
                [x, y] = xy(o[0]);
                cell = cel(puzzle, o[0]);
                if (!cell?.dot) {
                    if (q > -1) q -= 0.5;
                    continue;
                } 
                if (q > -1) {
                    console.info('[line][!] dots length is smaller than necessary: ', xy(c), 'dot: ', Math.floor((cel(puzzle, c).dot - 4) / 7));
                    global.regionData[0].push(c);
                    if (!puzzle.valid && quick) return;
                }
                if (window.CUSTOM_DOTS <= cell.dot && cell.dot < window.SOUND_DOT) {
                    q = Math.floor((cell.dot - 4) / 7) - 0.5;
                    c = o[0];
                }
            }
            q = -1;
            for (let o of global.pathSym) {
                [x, y] = xy(o[0]);
                cell = cel(puzzle, o[0]);
                if (!cell?.dot) {
                    if (q > -1) q -= 0.5;
                    continue;
                } 
                if (q > -1) {
                    console.info('[line][!] dots length is smaller than necessary: ', xy(c), 'dot: ', Math.floor((cel(puzzle, c).dot - 4) / 7));
                    global.regionData[0].push(c);
                    if (!puzzle.valid && quick) return;
                }
                if (window.CUSTOM_DOTS <= cell.dot && cell.dot < window.SOUND_DOT) {
                    q = Math.floor((cell.dot - 4) / 7) - 0.5;
                    c = o[0];
                }
            }
        }
    }, {
        '_name': 'SOUND DOTS',
        'or': ['soundDot'],
        'exec': function(puzzle, global, quick) {
            let x, y, cell, i = 0;
            for (let o of global.path) {
                [x, y] = xy(o[0]);
                cell = puzzle.getCell(x, y);
                if (!cell.dot || cell.dot < window.SOUND_DOT || cell.dot >= window.CUSTOM_COMPARATOR) continue;
                if ((cell.dot - 39) != puzzle.soundDots[i]) {
                    console.info('[line][!] sound dots order wrong: ', x, y, puzzle.soundDots[i], cell.dot - 39);
                    global.regionData[0].push(o[0]);
                    if (!puzzle.valid && quick) return;
                }
                i++;
            }
        }
    }, {
        '_name': "COMPARATOR CHECK",
        'or': ['comparator'],
        'exec': function(puzzle, global, quick) {
            for (let o of global.regionCells.edge[0]) {
                let [x, y] = xy(o)
                let cell = puzzle.getCell(x, y)
                if (cell.dot !== window.CUSTOM_COMPARATOR && cell.dot !== window.CUSTOM_COMPARATOR_FLIPPED) continue;

                let dir = cell.dot === window.CUSTOM_COMPARATOR_FLIPPED ? 1 : -1
                let smallRegion = global.regions.cell.findIndex(r => r.includes(x%2 ? ret(x, y+dir) : ret(x+dir, y )))
                let largeRegion = global.regions.cell.findIndex(r => r.includes(x%2 ? ret(x, y-dir) : ret(x-dir, y )))
                if (smallRegion < 0 || largeRegion < 0 || global.regions.cell[smallRegion].length >= global.regions.cell[largeRegion].length) {
                    global.regionData[0].push(o)
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }
]

const validate = [
    {
        '_name': 'DOT CHECK',
        'or': ['dot', 'cross', 'curve', 'dots', 'soundDot', 'comparator'],
        'exec': function(puzzle, regionNum, global, quick) {
            const dots = [window.DOT_BLACK, window.DOT_BLUE, window.DOT_YELLOW, window.DOT_INVISIBLE, window.CUSTOM_CROSS_FILLED, window.CUSTOM_CROSS_BLUE_FILLED, window.CUSTOM_CROSS_YELLOW_FILLED, window.CUSTOM_CURVE_FILLED, window.CUSTOM_CURVE_BLUE_FILLED, window.CUSTOM_CURVE_YELLOW_FILLED, 13, 15, 17, 18, 20, 22, 24, 25, 27, 29, 31, 32, 34, 36, 38, 39, window.CUSTOM_COMPARATOR, window.CUSTOM_COMPARATOR_FLIPPED];
            for (let c of global.regionCells.line[regionNum]) {
                let cell = cel(puzzle, c);
                if (dots.includes(cell?.dot) || cell?.dot >= window.SOUND_DOT && cell?.dot <= window.CUSTOM_COMPARATOR || window.bridges.includes(cell?.gap)) { // bonk
                    global.regionData[regionNum].push(c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'BRIDGE CHECK',
        'or': ['bridgeButActually'],
        'exec': function(puzzle, regionNum, global, quick) {
            let br = global.bridgeBranches?.map(x => ret(x.pos.x, x.pos.y));
            for (let c of global.regionCells.edge[regionNum]) {
                let cell = cel(puzzle, c);
                if (window.bridges.includes(cell?.gap) && !br?.includes(c)) { // bonk
                    global.regionData[regionNum].push(c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'SQUARE & PENTAGON',
        'or': ['square', 'pentagon'],
        'exec': function(puzzle, regionNum, global, quick) {
            let pos = {};
            let color = {'square': null, 'pentagon': null};
            for (let c of global.regionCells.cell[regionNum]) {
                let cell = cel(puzzle, c);
                if (!this.or.includes(cell.type)) continue;
                pos[cell.color] ??= {'square': [], 'pentagon': []};		
                pos[cell.color][cell.type].push(c);
                if (!~color[cell.type]) continue; // no need to continue already bonked
                color[cell.type] ??= cell.color; // init
                if (color[cell.type] != cell.color || color.square == color.pentagon) { // bonk
                    console.info('[!] Segregation fault: ', cell.color, cell.type)
                    if (!puzzle.valid && quick) {
						global.regionData[regionNum].push(c);
						return;
					}
					color.square = -1; color.pentagon = -1;
                }
            }
            if (color.square == -1) {
				let maxMatch = {'square': [], 'pentagon': []}; // Both shapes are the same color, and most numerous
				let maxCount = 0;
				let maxSep   = {'square': [], 'pentagon': []}; // Max # of each seperate shape (excluding maxMatch)
				for (let color of Object.values(pos)) {
					let colCount = color['square'].length + color['pentagon'].length;
					if (colCount > maxCount) {
						maxCount = maxMatch;
						maxMatch = color;
						color    = maxCount;
						maxCount = colCount;
					}
					for (let shape of Object.keys(color)) {
						if (!color[shape].length) continue; //skip empty arrays
						if (maxSep[shape].length && ~maxSep[shape][0] && color[shape].length >= maxSep[shape].length) {
							global.regionData[regionNum].push(...maxSep[shape]);
							maxSep[shape][0] = -1; //label as 'already failed'
						}
						if (color[shape].length > maxSep[shape].length) maxSep[shape] = color[shape];
						else global.regionData[regionNum].push(...color[shape]);
					}
				}
				let sepCount = maxSep['square'].length + maxMatch['pentagon'].length; 
				maxCount = maxMatch['square'].length + maxSep['pentagon'].length;
				if ( //cited source for this if logic: Incomprehensible whiteboard scrawls.
					sepCount >= maxCount 
					|| maxMatch['square'].length <= maxSep['square'].length
				) global.regionData[regionNum].push(...maxMatch['square']);
				if (
					sepCount <= maxCount
					|| maxMatch['pentagon'].length <= maxSep['pentagon'].length
				) global.regionData[regionNum].push(...maxMatch['pentagon']);
				if (
					~maxSep['square'][0] 
					&& maxCount >= sepCount 
					&& maxMatch['square'].length >= maxSep['square'].length
				) global.regionData[regionNum].push(...maxSep['square']);
				if (
					~maxSep['pentagon'][0] 
					&& maxCount <= sepCount 
					&& maxMatch['pentagon'].length >= maxSep['pentagon'].length
				) global.regionData[regionNum].push(...maxSep['pentagon']);
            }
        }
    }, {
        '_name': 'STAR',
        'or': ['star'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                if (global.regionColors.cell[regionNum][cell.color]?.length != 2) {
                    console.info('[!] Star fault: ', cell.color);
                    global.regionData[regionNum].push(c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'TRIANGLE CHECK',
        'or': ['triangle'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                let count = 0 // count !!
                if (matrix(puzzle, global, x+1, y) === 0) count++;
                if (matrix(puzzle, global, x-1, y) === 0) count++;
                if (matrix(puzzle, global, x, y-1) === 0) count++;
                if (matrix(puzzle, global, x, y+1) === 0) count++;
                if (count != cell.count) {
                    console.info('[!] Triangle fault at', x, y, 'needs', cell.count, 'sides - actually has', count);
                    global.regionData[regionNum].push(c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'ANTITRIANGLE CHECK',
        'or': ['atriangle'],
        'exec': function(puzzle, regionNum, global, quick) {
            const check = [
                          [-1, -2],          [1, -2],          //  0 1
                [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], // 23456
                          [-1,  0],          [1,  0],          //  7 8
                [-2,  1], [-1,  1], [0,  1], [1,  1], [2,  1], // 9ABCD
                          [-1,  2],          [1,  2]           //  E F
            ];
            const endOffset = [[0, -1], [1, 0], [-1, 0], [0, 1]];
            const corners = [
                0x032, 0x034, 0x237, 0x437,
                0x154, 0x156, 0x458, 0x658,
                0x7A9, 0x7AB, 0xEA9, 0xEAB,
                0x8CB, 0x8CD, 0xFCB, 0xFCD
            ];
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                let count = 0 // undefined + undefined = NaN !== 0
                let coll = check.map(o => matrix(puzzle, global, x + o[0], y + o[1]) == 0);
                // endpoint detection
                let hasEnd = check.findIndex(o => o[0] === (puzzle.endPoint.x - x) && o[1] ===  (puzzle.endPoint.y - y));
                if (hasEnd !== -1) {
                    let offset = endOffset[endEnum.indexOf(puzzle.getCell(puzzle.endPoint.x, puzzle.endPoint.y).end)];
                    let index = check.findIndex(o => o[0] === (check[hasEnd][0] + offset[0]) && o[1] === (check[hasEnd][1] + offset[1]));
                    if (index !== -1) coll[index] = true;
                    else if ([4, 7, 8, 11].includes(hasEnd) && (puzzle.endPoint.x !== puzzle.startPoint.x || puzzle.endPoint.y !== puzzle.startPoint.y)) count = 1;
                }
                for (let r of [...corners]) {
                    found = true;
                    for (let _ = 0; _ < 3; _++) {
                        let k = r & 0xF;
                        if (!coll[k]) {
                            found = false;
                            break;
                        }
                        r >>= 4;
                    }
                    if (found) count++
                }
                // let hasStart = check.findIndex(o => o[0] === (puzzle.startPoint.x - x) && o[1] ===  (puzzle.startPoint.y - y));
                // if (hasStart !== -1) {
                    
                // }
                if (count != cell.count) {
                    console.info('[!] Anti-Triangle fault at', x, y, 'needs', cell.count, 'turns - actually has', count);
                    global.regionData[regionNum].push(c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'TENUOUS TRIANGLE CHECK',
        'or': ['vtriangle'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                if (global.vtriangleColors[cell.color] == -1) global.regionData[regionNum].push(c);
            }
        }
    }, {
        '_name': 'SIZER CHECK',
        'or': ['sizer'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                if (global.sizerWeights[cell.color] == -1) global.regionData[regionNum].push(c);
            }
        }
    }, {
        '_name': 'CHIPS CHECK',
        'or': ['pokerchip'],
        'exec': function(puzzle, regionNum, global, quick) {
            const isPortaled = global.portalRegion && (global.portalRegion.indexOf(regionNum) + 1);
            const data = isPortaled ? global.portalData[isPortaled-1] : null;
            const w = data ? data.width : puzzle.width;
            let mode = {};
            let pos = {};
            let chippos = {};
            for (const c of global.regionCells.cell[regionNum]) { // here we go
                const [x, y] = data ? xy(getPortalCoords(c, data), w) : xy(c);
                let cell = cel(puzzle, c);
                let color = cell.color;
                if (this.or.includes(cell.type)) {
                    if (!chippos[color]) chippos[color] = [];
                    chippos[color].push(c);
                }
                if (mode[color] == -1) continue; // bonked
                if (mode[color] === undefined) { // detected 1
                    mode[color] = null;
                    pos[color] = [x, y];
                } else if (mode[color] === null) { // detected 2
                    if (x == pos[color][0]) {
                        mode[color] = 0;
                        pos[color] = x;
                    } else if (y == pos[color][1]) {
                        mode[color] = 1;
                        pos[color] = y;
                    } else mode[color] = -1;
                } else {
                    if (mode[color] == 0) { if (x != pos[color]) mode[color] = -1; }
                    else { if (y != pos[color]) mode[color] = -1; }
                }
            }
            for (color in chippos) {
                if (mode[color] == -1 || mode[color] == undefined) global.regionData[regionNum].push(...chippos[color]);
            }
        }
    }, {
        '_name': 'SWIRL CHECK',
        'or': ['swirl'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                let dir = cell.flip ? ['right', 'bottom', 'top', 'left'] : ['left', 'top', 'bottom', 'right'];
                let r = [ret(x, y-1), retPillar(puzzle, x+1, y), ret(x-1, y), ret(x, y+1)];
                let count = 0;
                for (let i = 0; i < 4; i++) {
                    let path = global.pathAll.find(x => x[0] == r[i]);
                    if (path?.[1] === undefined) continue;
                    count++;
                    if (path[1] != endEnum.indexOf(dir[i])) {
                        console.info('[!] Swirl fault at', x, y, 'goes', endEnum[path[1]], 'supposed to go', dir[i]);
                        global.regionData[regionNum].push(c);
                        if (!puzzle.valid && quick) return;
                        break;
                    }
                }
                if (count === 0) {
                    console.info('[!] Swirl fault at', x, y, 'no sides touching');
                    global.regionData[regionNum].push(c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'ARROW CHECK',
        'or': ['arrow'],
        'exec': function(puzzle, regionNum, global, quick) {     
            for (let c of global.regionCells.cell[regionNum]) {
                let [sourcex, sourcey] = xy(c);
                let cell = puzzle.getCell(sourcex, sourcey);
                if (!this.or.includes(cell.type)) continue;
                let count = 0; let [dx, dy] = dr(cell.rot);
                let x = sourcex; let y = sourcey;
                x -= dx; y -= dy;
                dx *= 2; dy *= 2; x += dx; y += dy;
                for (let _ = 1; _ < puzzle.width * puzzle.height; _++) { // every square must be traveled if the loop gets to this point
                    if (puzzle.pillar) x = (x + puzzle.width) % puzzle.width;
                    if (!isBounded(puzzle, x, y)) break; 
                    if (x == sourcex && y == sourcey) break; 
                    if (matrix(puzzle, global, x, y) === 0) {
                        count++;
                        if (count > cell.count) break;
                    }
                    x += dx; y += dy // increment
                }
                if (cell.count != count) {
                    console.info('[!] Arrow fault at', sourcex, sourcey, 'needs', cell.count, 'instances - actually has', count);
                    global.regionData[regionNum].push(c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'DART CHECK',
        'or': ['dart'],
        'exec': function(puzzle, regionNum, global, quick) {
            let hasPortal = global.portalRegion?.includes(regionNum);
            let darts = [];

            for (const c of global.regionCells.cell[regionNum]) {
                let cell = cel(puzzle, c);
                if (this.or.includes(cell.type)) darts.push(c);
            }
            if (hasPortal) {
                let data = global.portalData[global.portalRegion.indexOf(regionNum)];
                for (const c of darts) {
                    const ctarget = getPortalCoords(c, data);
                    const cell = cel(puzzle, c);
                    const dir = dr(cell.rot).map(a => a * 2);
                    let res = new Set();
                    for (let i = 0; i < data.offset.length; i++) {
                        let [x, y] = xy(ctarget, data.width);
                        x += data.totalSpan[0] - data.offset[i][0];
                        y += data.totalSpan[1] - data.offset[i][1];
                        let [sx, sy] = [...[x, y]];
                        while (true) {
                            x += dir[0]; y += dir[1];
                            if (puzzle.pillar) x = rdiv(x, puzzle.width);
                            else if (!isBounded(puzzle, x, y)) break;
                            if ((sx == x && sy == y) || !isBounded(puzzle, 0, y)) break;
                            if (matrix(puzzle, global, x, y) == regionNum) {
                                res.add(getPortalCoords(ret(x, y), data));
                                if (quick && (res.size > cell.count)) break;
                            }
                        }
                        if (cell.count != res.size) {
                            console.info('[!] Dart fault at', xy(c), 'needs', cell.count, 'instances - actually has', res.size, res);
                            global.regionData[regionNum].push(c);
                            if (!puzzle.valid && quick) return;
                            break;
                        }
                    }
                }
            } else {
                for (const c of darts) {
                    let [sx, sy] = xy(c), [x, y] = xy(c);
                    const cell = cel(puzzle, c);
                    const dir = dr(cell.rot).map(a => a * 2);
                    let temp = 0;
                    while (true) {
                        x += dir[0]; y += dir[1];
                        if (puzzle.pillar) x = rdiv(x, puzzle.width);
                        else if (!isBounded(puzzle, x, y)) break;
                        if ((sx == x && sy == y) || !isBounded(puzzle, 0, y)) break;
                        if (matrix(puzzle, global, x, y) == regionNum) {
                            temp++;
                            if (quick && temp > cell.count) break;
                        }
                    }
                    if (cell.count != temp) {
                        console.info('[!] Dart fault at', xy(c), 'needs', cell.count, 'instances - actually has', temp);
                        global.regionData[regionNum].push(c);
                        if (!puzzle.valid && quick) return;
                    }
                }
            }
        }
    }, {
        '_name': 'DIVIDED DIAMOND CHECK',
        'or': ['divdiamond'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (this.or.includes(cell.type)) {
                    if (cell.count != global.regionCells.all[regionNum].length) {
                        console.info('[!] Divided Diamond fault at', x, y, 'needs', cell.count, 'instances - actually has', global.regionCells.all[regionNum].length);
                        global.regionData[regionNum].push(c);
                        if (!puzzle.valid && quick) return;
                    }
                }
            }
        }
    }, {
        '_name': 'DICE CHECK',
        'or': ['dice'],
        'exec': function(puzzle, regionNum, global, quick) {
            let cell = global.portalRegion?.includes(regionNum) ? global.portalData[global.portalRegion.indexOf(regionNum)].regions.cell.length : global.regions.cell[regionNum].length;
            let cs = [], pip = 0;
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                cs.push(c);
                pip += cell.count;
            }
            if (cell != pip) {
                console.info('[!] Dice fault at region', regionNum, 'needs', pip, 'pips, actually has', cell);
                global.regionData[regionNum].push(...cs);
                if (!puzzle.valid && quick) return;
            }
        }
    }, {
        '_name': 'TWO BY TWO CHECK',
        'or': ['twobytwo'],
        'exec': function(puzzle, regionNum, global, quick) {
            const isPortaled = (global.portalRegion != undefined) && (global.portalRegion.indexOf(regionNum) + 1);
            let twobytwos = [];
            for (const c of global.regionCells.cell[regionNum]) if (this.or.includes(cel(puzzle, c).type)) twobytwos.push(c);
            const data = isPortaled ? global.portalData[isPortaled-1] : null;
            const w = data ? data.width : puzzle.width;
            let isReg = function(x, y) { 
                if (data) return data.regions.cell.includes(ret(x, y, w, data.totalSpan[0], data.totalSpan[1]));
                else return matrix(puzzle, global, x, y) == regionNum;
            };
            for (const c of twobytwos) {
                const [x, y] = data ? xy(getPortalCoords(c, data), w) : xy(c);
                if ( isReg(x+2, y-2) && isReg(x+2, y) && isReg(x, y-2) 
                    || isReg(x-2, y-2) && isReg(x-2, y) && isReg(x, y-2) 
                    || isReg(x+2, y+2) && isReg(x+2, y) && isReg(x, y+2) 
                    || isReg(x-2, y+2) && isReg(x-2, y) && isReg(x, y+2)) { // thats a long if statement 
                    console.info('[!] Two-by-two fault at', x, y);
                    global.regionData[regionNum].push(c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'CELLED HEX CHECK',
        'or': ['celledhex'],
        'exec': function(puzzle, regionNum, global, quick) {
            let hexes = [];
            let colors = [];
            let darts = [];
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                switch (cell.type) {
                    case 'divdiamond':
                    case 'poly':
                        return; // true immediately
                    case 'celledhex':
                        hexes.push({'pos': c, 'cell': cell});
                        break;
                    case 'dart':
                        const [dxtemp, dytemp] = dr(cell.rot);
                        darts.push({'pos': c, 'dx': dxtemp*2, 'dy': dytemp*2});
                        break;
                    case 'star':
                    case 'pokerchip':
                        colors.push(cell.color);
                        break;
                }
            }
            if (!hexes.length) return; // true epic
            for (const color of colors) {
                hexes = hexes.filter(c => { return c.cell.color != color; });
                if (!hexes.length) return; // true epic
            }
            for (const dart of darts) {
                let [sourcex, sourcey] = xy(dart.pos);
                let x = sourcex + dart.dx;
                let y = sourcey + dart.dy;
                for (let _ = 1; _ < puzzle.width * puzzle.height; _++) { // every square must be traveled if the loop gets to this point
                    if (!isBounded(puzzle, x, y)) break; 
                    if (x == sourcex && y == sourcey) break; 
                    hexes = hexes.filter(c => { return c.pos != ret(x, y); });
                    if (!hexes.length) return; // true epic
                    x += dart.dx; y += dart.dy // increment
                    if (puzzle.pillar) x = (x + puzzle.width) % puzzle.width;
                }
            }
            console.info('[!] Celled Hex Fault');
            for (const hex of hexes) { // hexes also interact with negators, to be always wrong
                puzzle.valid = false;
                puzzle.invalidElements.push(hex.pos);
            }
        }
    }, {
        '_name': 'POLYOMINO CHECK',
        'or': ['poly', 'ylop', 'polynt', 'xvmino', 'scaler'],
        'exec': function(puzzle, regionNum, global, quick) { 
            let polys = []; let scalers = [0, 0];
            let pos = { poly: [], ylop: [], polynt: [], xvmino: [], scaler: [] };
            for (const c of global.regionCells.cell[regionNum]) {
                let cell = cel(puzzle, c);
                if (!this.or.includes(cell.type)) continue;
                pos[cell.type].push(c);
                if (cell.type == 'scaler') {
                    if (cell.flip) scalers[1]++;
                    else scalers[0]++;
                }
                else polys.push(new Polyomino(puzzle, c));
            }
            let downscalable = [];          
            for (let i = 0; i < polys.length; i++) if (polys[i].downscalable()) downscalable.push(i); // every polys are upscalable rn
            if (global.regionShapes[regionNum].includes('xvmino') && !global.regionShapes[regionNum].includes('poly'))
                global.regionData[regionNum].push(...pos['xvmino']);
            global.polyntCorrect[regionNum] = true; global.polyIncorrect[regionNum] = true;
            let ret = window.polyFitMaster(puzzle, regionNum, global, polys, scalers, downscalable, Array.from({length: polys.length}, (_, i) => i));
            for (poly of polys) {
                poly.cell.polyshape = poly.shape;
            }
            for (mistake of ret)
                global.regionData[regionNum].push(...pos[mistake]);
        }
    }, {
        '_name': 'BLACK HOLE CHECK',
        'or': ['blackhole', 'whitehole'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum])  
            if (global.invalidHoles.includes(c)) global.regionData[regionNum].push(c);
        }
    }, {
        '_name': 'CRYSTAL CHECK',
        'or': ['crystal'],
        'exec': function(puzzle, regionNum, global, quick) {
            let hasPortal = global.portalRegion?.includes(regionNum);
            let cells = hasPortal ? global.portalData[global.portalRegion.indexOf(regionNum)].regions.cell : global.regions.cell[regionNum];
            let w = hasPortal ? global.portalData[global.portalRegion.indexOf(regionNum)].width : puzzle.width;
            let cs = [null, [], [], [], [], []];
            const fn = [(x, y) => [x, y], (x, y) => [-y, -x], (x, y) => [x, -y], (x, y) => [y, x], (x, y) => [-x, y], (x, y) => [-x, -y]];
            if (hasPortal) {
                for (const o of Object.entries(global.portalData[global.portalRegion.indexOf(regionNum)].regionPosCell)) {
                    let cell = o[1].find(x => this.or.includes(x.type));
                    if (cell) cs[cell.count].push(o[0]);
                }
            } else {
                for (const c of global.regionCells.cell[regionNum]) {
                    let cell = cel(puzzle, c, w);
                    if (this.or.includes(cell.type)) cs[cell.count].push(c);
                }
            }
            for (const c of cells) {
                let [x, y] = xy(c, w);
                for (let q = 1; q <= 5; q++) for (let cc of cs[q]) {
                    let [cx, cy] = xy(cc, w);
                    let [xx, yy] = fn[q](x - cx, y - cy);
                    xx += cx; yy += cy;
                    if (!cells.find(x => x == ret(xx, yy))) {
                        console.info('[!] Crystal fault at', x, y);
                        global.regionData[regionNum].push(cc);
                        if (quick) return;
                        cs[q].splice(cs[q].indexOf(cc), 1);
                    }
                }
            }
        }
    }, {
        '_name': 'BRIDGE CHECK',
        'or': ['bridge'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (const color of global.bridgeRegions[regionNum]) {
                if (global.invalidBridges[color]) { // invalid
                    for (c of global.bridges[color]) {
                        let [x, y] = xy(c);
                        if (matrix(puzzle, global, x, y) == regionNum) global.regionData[regionNum].push(c);
                    }
                } else { // valid, start logic
                    if (global.bridges[color].length === 1) {
                        global.regionData[regionNum].push(global.bridges[color][0]);
                        continue;
                    }
                    let res = false;
                    //* make adjacency graph
                    let adj = {};
                    function isCellBridgePathFriendly(x, y, color) { 
                        if (puzzle.pillar) x = rdiv(x, puzzle.width);
                        if ((x % 2 === 0) && (y % 2 === 0)) return false;
                        if (matrix(puzzle, global, x, y) !== regionNum) return false;
                        let cell = puzzle.getCell(x, y);
                        return cell?.color == undefined || cell.color == color; 
                    }
                    for (c of global.regions.all[regionNum]) {
                        adj[c] = [];
                        let [x, y] = xy(c);
                        if (!isCellBridgePathFriendly(x, y, color)) continue;
                        if (isCellBridgePathFriendly(x-1, y, color)) adj[c].push(ret(x-1, y));
                        if (isCellBridgePathFriendly(x+1, y, color)) adj[c].push(ret(x+1, y));
                        if (isCellBridgePathFriendly(x, y-1, color)) adj[c].push(ret(x, y-1));
                        if (isCellBridgePathFriendly(x, y+1, color)) adj[c].push(ret(x, y+1));
                    }
                    for (const color of Object.values(global.portalColorPos)) for (let i = 0; i < color.length; i++) for (let j = i+1; j < color.length; j++) {
                        if (adj[color[i]] && adj[color[j]]) { adj[color[i]].push(color[j]); adj[color[j]].push(color[i]); }
                    }
                    // for (a of Object.entries(adj).sort((a, b) => a[0] - b[0])) for (b of a[1].sort((a, b) => a - b)) console.info(xy(a[0]), '=>', xy(b));
                    //* make tree
                    let seen = new Set();
                    let tree = new Set([global.bridges[color][0]]);
                    function treeloop(fromparam) {
                        const from = fromparam;
                        if (global.bridges[color].includes(from)) tree.add(from);
                        seen.add(from);
                        if (adj[from]) for (const child of adj[from]) if (!seen.has(child)) {
                            treeloop(child);
                            if (tree.has(child)) tree.add(from);
                        }
                    }
                    treeloop(global.bridges[color][0]);
                    seen = new Set(tree);
                    //* check if tree is unique
                    function uniqueloop(from) {
                        seen.add(from);
                        let reachableTreeNode = null;
                        if (adj[from]) for (const child of adj[from]) {
                            const candidate = tree.has(child) ? child : (seen.has(child) ? null : uniqueloop(child));
                            if (candidate !== null && candidate !== reachableTreeNode) {
                                if (reachableTreeNode === null) reachableTreeNode = candidate;
                                else return -1;
                            }
                        }
                        return reachableTreeNode;
                    }
                    for (const bridge of global.bridges[color]) if (!tree.has(bridge)) res = true;
                    for (c of global.regions.all[regionNum]) {
                      if (isCellBridgePathFriendly(...xy(c), color) && !seen.has(c) && (uniqueloop(c) === -1)) res = true;
                    }
                    if (res) {
                        console.info('[!] Bridge fault on region', regionNum, 'color', color, global.bridges[color]);
                        global.regionData[regionNum].push(...global.bridges[color]);
                    }
                }
            }
        }
    }, {
        '_name': 'DROP CHECK',
        'or': ['drop'],
        'exec': function(puzzle, regionNum, global, quick) {
            function eval(x, y, dir) { return matrix(puzzle, global, x + dir.x, y + dir.y) !== 0; } // true if no line in indicated direction
            function cloneAt(filled, i, dir) { // floodfill. Probably optimizable.
                let [newx, newy] = xy(filled[i]);
                newx += (dir.x << 1); newy += (dir.y << 1);
                let newc = retPillar(puzzle, newx, newy);
                if (!isBounded(puzzle, newx, newy)) { filled[0] = [newx, newy]; return true; }
                for (let j = filled.length - 1; j >= 0; j--) // items close together in the puzzle tend to be close in the list, so searching back to front is more efficient.
                    if (filled[j] === newc) return false;
                if (!(hasPortal && cel(puzzle, newc)?.type === "portal")) filled.push(newc);
                else for (let pos of global.portalColorPos[cel(puzzle, newc)?.color]) filled.push(pos);
                return false;
            }

			let hasPortal = global.portalRegion?.includes(regionNum);
			for (let c of global.regionCells.cell[regionNum]) {
                let cell = cel(puzzle, c);
                if (!this.or.includes(cell.type)) continue;

				// let up = DIR[ (cell.count - 1) << 1 & 6]; may come in handy later
				let rt = DIR[(cell.count    ) << 1 & 6];
				let dn = DIR[(cell.count + 1) << 1 & 6];
				let lf = DIR[(cell.count + 2) << 1 & 6];

				let filled = [c];
				for (let i = 0; i < filled.length; i++) { //flood fill loop
					if (eval(...xy(filled[i]), dn) && cloneAt(filled, i, dn)) break; //make clone if direction is open, end loop if clone is out-of-bounds.
					if (eval(...xy(filled[i]), lf) && cloneAt(filled, i, lf)) break; // && shorts if eval is false, so clones are only made if eval passes.
					if (eval(...xy(filled[i]), rt) && cloneAt(filled, i, rt)) break;
				}
				
                if (Array.isArray(filled[0])) {
                    console.info('[!] drop fault at', ...xy(c), 'leaking at', ...filled[0]);
                    global.regionData[regionNum].push(c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'FULCRUM CHECK',
        'or': ['fulcrum'],
        'exec': function(puzzle, regionNum, global, quick) {
            // no portal support, not sure if there even is any possible portal interaction that makes physical sense
            // also how tf should it work with pillars?
            let h_fulcra = []
            let v_fulcra = []
            let xmin = 2**16
            let xmax = -(2**16)
            let ymin =  2**16
            let ymax = -(2**16)
            let xmoment = 0
            let ymoment = 0
            let w = puzzle.width
            let n = global.regions.cell[regionNum].length // region mass

            for (const c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c, w);
                let cell = cel(puzzle, c, w);
                if (!this.or.includes(cell.type)) continue;
                if (!cell.flip) {
                    h_fulcra.push(c)
                    xmin = Math.min(xmin, x)
                    xmax = Math.max(xmin, x)
                } else {
                    v_fulcra.push(c)
                    ymin = Math.min(ymin, y)
                    ymax = Math.max(ymax, y)
                }
            }

            for (const c of global.regions.cell[regionNum]) {
                let [x, y] = xy(c, w);
                xmoment += x
                ymoment += y
            }

            // avoid potential floating point issues by checking m < x*n instead of m/n < x
            if (h_fulcra.length && (xmoment < xmin*n || xmoment > xmax*n)) {
                console.info('[!] h-fulcrum fault in region', regionNum + ':', xmoment/n, 'not in', [xmin, xmax]);
                global.regionData[regionNum] = global.regionData[regionNum].concat(h_fulcra)
                if (quick) return
            }
            if (v_fulcra.length && (ymoment < ymin*n || ymoment > ymax*n)) {
                console.info('[!] v-fulcrum fault in region', regionNum + ':', ymoment/n, 'not in', [ymin, ymax]);
                global.regionData[regionNum] = global.regionData[regionNum].concat(v_fulcra)
            }
        }
    }
];

})

// TODO: INTERACTION WITH: POLYOMINO, BRIDGE FINALIZE
