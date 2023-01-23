namespace(function() {

// @Volatile -- must match order of MOVE_* in trace2
var PATH_NONE   = 0
var PATH_LEFT   = 1
var PATH_RIGHT  = 2
var PATH_TOP    = 3
var PATH_BOTTOM = 4

window.MAX_SOLUTIONS = 0
var solutionPaths = []
var asyncTimer = 0
var task = null
var puzzle = null
var path = []
var SOLVE_SYNC = false
var SYNC_THRESHOLD = 9 // Depth at which we switch to a synchronous solver (for perf)

var percentages = []
var NODE_DEPTH = 9
var nodes = 0

var count = 0

// Generates a solution via DFS recursive backtracking
window.solve = function(p, partialCallback, finalCallback) {
  var start = (new Date()).getTime()
  count = 0;

  puzzle = p
  var startPoints = []
  var numEndpoints = 0
  puzzle.hasNegations = false
  puzzle.hasPolyominos = false
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == null) continue;
      if (cell.start > 0) {
        startPoints.push({'x': x, 'y': y})
      }
      if (cell.end != null) numEndpoints++
      if (cell.type == 'nega') puzzle.hasNegations = true
      if (window.polyominoes.includes(cell.type)) puzzle.hasPolyominos = true
    }
  }

  //// Puzzles which are small enough should be solved synchronously, since the cost of asynchronizing
  //// is greater than the cost of the puzzle.
  //* cancel solving does not seem to work so why not sync for now
  SOLVE_SYNC = true
  // if (puzzle.symmetry != null) { // 5x5 is the max for symmetry puzzles
  //   if (puzzle.width * puzzle.height <= 121) SOLVE_SYNC = true
  // } else if (puzzle.pillar === true) { // 4x5 is the max for non-symmetry, pillar puzzles
  //   if (puzzle.width * puzzle.height <= 108) SOLVE_SYNC = true
  // } else { // 5x5 is the max for non-symmetry, non-pillar puzzles
  //   if (puzzle.width * puzzle.height <= 121) SOLVE_SYNC = true
  // }
  // console.log('Puzzle is a', puzzle.width, 'by', puzzle.height, 'solving ' + (SOLVE_SYNC ? 'sync' : 'async'))

  // We pre-traverse the grid (only considering obvious failure states like going out of bounds),
  // and compute a total number of nodes that are reachable within some NODE_DEPTH steps.
  // Then, during actual traversal, we can compare the number of nodes reached to the precomputed count
  // to get a (fairly accurate) progress bar.
  // for (var pos of startPoints) {
  //   countNodes(pos.x, pos.y, 0)
  // }
  // console.log('Pretraversal found', nodes, 'nodes')
  // percentages = []
  // for (var i=0; i<100; i++) {
  //   percentages.push(Math.floor(i * nodes / 100))
  // }
  nodes = 0

  solutionPaths = []
  if (window.MAX_SOLUTIONS === 0) window.MAX_SOLUTIONS = 1000

  task = {
    'code': function() {
      var newTasks = []

      for (var pos of startPoints) {
        // ;(function(a){}(a))
        // This syntax is used to forcibly copy all of the arguments
        ;(function(pos) {
          newTasks.push(function() {
            path = [pos]
            puzzle.startPoint = pos
            return solveLoop(pos.x, pos.y, numEndpoints, 0)
          })
        }(pos))
      }
      return newTasks
    }
  }

  taskLoop(partialCallback, function() {
    var end = (new Date()).getTime()
    console.error('Solved', puzzle, 'in', (end-start)/1000, 'seconds, ', count, 'loops done')
    if (finalCallback) finalCallback(solutionPaths)
  })
  return solutionPaths
}

function taskLoop(partialCallback, finalCallback) {
  if (task == null) {
    finalCallback()
    return
  }

  var newTasks = task.code()
  task = task.nextTask
  if (newTasks != null && newTasks.length > 0) {
    // Tasks are pushed in order. To do DFS, we need to enqueue them in reverse order.
    for (var i=newTasks.length - 1; i >= 0; i--) {
      task = {
        'code': newTasks[i],
        'nextTask': task,
      }
    }
  }

  // Asynchronizing is expensive. As such, we don't want to do it too often.
  // However, we would like 'cancel solving' to be responsive. So, we call setTimeout every so often.
  var doAsync = false
  if (!SOLVE_SYNC) {
    doAsync = (asyncTimer++ % 100 === 0)
    while (nodes >= percentages[0]) {
      if (partialCallback) partialCallback(100 - percentages.length)
      percentages.shift()
      doAsync = true
    }
  }

  if (doAsync) {
    setTimeout(function() {
      taskLoop(partialCallback, finalCallback)
    }, 0)
  } else {
    taskLoop(partialCallback, finalCallback)
  }
}

function tailRecurse(x, y) {
  // Tail recursion: Back out of this cell
  puzzle.updateCell2(x, y, 'line', window.LINE_NONE)
  if (puzzle.symmetry != null) {
    var sym = puzzle.getSymmetricalPos(x, y)
    puzzle.updateCell2(sym.x, sym.y, 'line', window.LINE_NONE)
  }
}

// @Performance: This is the most central loop in this code.
// Any performance efforts should be focused here.
// Note: Most mechanics are NP (or harder), so don't feel bad about solving them by brute force.
// https://arxiv.org/pdf/1804.10193.pdf
function solveLoop(x, y, numEndpoints, depth) {
  // Stop trying to solve once we reach our goal
  if (solutionPaths.length >= window.MAX_SOLUTIONS) return
  count++;
  // Check for collisions (outside, gap, self, other)
  var cell = puzzle.getCell(x, y)
  // const _dir = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
  // let pathPrint = [];
  // const rdiv = (n, a) => ((n % a) + a) % a;
  // const transpose = m => m[0].map((x,i) => m.map(x => x[i]))
  // for (let i = 0; i < path.length; i++) pathPrint.push(typeof(path[i]) == 'object' ? [path[i].x, path[i].y] : [rdiv(pathPrint[i-1][0] + _dir[path[i]][0], puzzle.width), pathPrint[i-1][1] + _dir[path[i]][1]])
  // if (path.length > 50)
  //   console.warn(x, y, JSON.parse(JSON.stringify(transpose(puzzle.grid.map(x => x.map(y => y?.line ?? 9))))), pathPrint, cell, cell?.line, cell?.gap);
  if (cell == null) return
  if (window.CUSTOM_LINE > cell.gap && cell.gap > window.GAP_NONE) return
  if (cell.line !== window.LINE_NONE && cell.line !== undefined) return

  if (puzzle.symmetry == null) {
    puzzle.updateCell2(x, y, 'line', window.LINE_BLACK)
  } else {
    var sym = puzzle.getSymmetricalPos(x, y)
    if (puzzle.matchesSymmetricalPos(x, y, sym.x, sym.y)) return // Would collide with our reflection

    var symCell = puzzle.getCell(sym.x, sym.y)
    if (window.CUSTOM_LINE > symCell.gap && symCell.gap > window.GAP_NONE) return

    puzzle.updateCell2(x, y, 'line', window.LINE_BLUE)
    puzzle.updateCell2(sym.x, sym.y, 'line', window.LINE_YELLOW)
  }

  if (depth < NODE_DEPTH) nodes++

  if (cell.end != null) {
    path.push(PATH_NONE)
    puzzle.endPoint = {'x': x, 'y': y}
    puzzle.path = path;
    window.validate(puzzle, true)
    if (puzzle.valid) solutionPaths.push(path.slice())
    path.pop()

    // If there are no further endpoints, tail recurse.
    // Otherwise, keep going -- we might be able to reach another endpoint.
    numEndpoints--
    if (numEndpoints === 0) return tailRecurse(x, y)
  }

  path.push(PATH_NONE)

  // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
  if (y%2 === 0) {
    path[path.length-1] = PATH_LEFT
    if (cell.gap !== window.CUSTOM_BRIDGE && symCell?.gap !== window.CUSTOM_BRIDGE_FLIPPED) solveLoop(x - 1, y, numEndpoints, depth + 1)
    
    path[path.length-1] = PATH_RIGHT
    if (cell.gap !== window.CUSTOM_BRIDGE_FLIPPED && symCell?.gap !== window.CUSTOM_BRIDGE) solveLoop(x + 1, y, numEndpoints, depth + 1)
  }

  if (x%2 === 0) {
    path[path.length-1] = PATH_TOP
    if (cell.gap !== window.CUSTOM_BRIDGE && symCell?.gap !== window.CUSTOM_BRIDGE_FLIPPED) solveLoop(x, y - 1, numEndpoints, depth + 1)

    path[path.length-1] = PATH_BOTTOM
    if (cell.gap !== window.CUSTOM_BRIDGE_FLIPPED && symCell?.gap !== window.CUSTOM_BRIDGE) solveLoop(x, y + 1, numEndpoints, depth + 1)
  }

  path.pop()
  tailRecurse(x, y)
}

window.cancelSolving = function() {
  console.log('Cancelled solving')
  window.MAX_SOLUTIONS = 0 // Causes all new solveLoop calls to exit immediately.
  tasks = []
}

window.setPath = function(puzzle, raw) {
  let path = [];
  path.push({'x': raw.charCodeAt(0), 'y': raw.charCodeAt(1)});
  let [x, y] = [path[0].x, path[0].y];
  for (let ptr = 2; ptr < raw.length; ptr++) {
    let temp = raw.charCodeAt(ptr);
    let dir = [(temp & 3), (temp & 12) >> 2, (temp & 48) >> 4, (temp & 192) >> 6];
    const _DIR = ['left', 'right', 'top', 'bottom'];
    for (let o of dir) {
      if (puzzle.getCell(x, y)?.end == _DIR[o]) {
        path.push(0);
        break;
      }
      path.push(o + 1);
      switch (o) {
        case 0:
          x--; break;
        case 1:
          x++; break;
        case 2:
          y--; break;
        case 3:
          y++; break;
      }
    }
  }
  puzzle.path = path;
  drawPath(puzzle, path);
}

// Uses trace2 to draw the path on the grid, logs a graphical representation of the solution,
// and also modifies the puzzle to contain the solution path.
window.drawPath = function(puzzle, path, target='puzzle') {
  // @Duplicated with trace2.clearGrid
  var puzzleElem = document.getElementById(target)
  window.deleteElementsByClassName(puzzleElem, 'cursor')
  window.deleteElementsByClassName(puzzleElem, 'cursor-image')
  for (let o of Array.from(document.getElementsByClassName('veil-image'))) o.style.opacity = 1;
  window.deleteElementsByClassName(puzzleElem, 'line-1')
  window.deleteElementsByClassName(puzzleElem, 'line-2')
  window.deleteElementsByClassName(puzzleElem, 'line-3')
  puzzle.clearLines()

  // Extract the start data from the first path element
  var x = path[0].x
  var y = path[0].y
  var cell = puzzle.getCell(x, y)
  if (cell == null || cell.start === undefined) throw Error('Path does not begin with a startpoint: ' + JSON.stringify(cell))

  var start = document.getElementById('start_' + target + '_' + x + '_' + y)
  var symStart = document.getElementById('symStart_' + target + '_' + x + '_' + y)
  window.initLineDrawing(puzzle, {'x':x, 'y':y}, document.getElementById(target), start, symStart)

  console.log('Drawing solution of length', path.length)
  for (var i=1; i<path.length; i++) {
    var cell = puzzle.getCell(x, y)

    var dx = 0
    var dy = 0
    if (path[i] === PATH_NONE) { // Reached an endpoint, move into it
      console.log('Reached endpoint')
      if (cell.end === 'left') {
        window.onMove(-24, 0)
      } else if (cell.end === 'right') {
        window.onMove(24, 0)
      } else if (cell.end === 'top') {
        window.onMove(0, -24)
      } else if (cell.end === 'bottom') {
        window.onMove(0, 24)
      }
      if (i != path.length-1) throw Error('Path contains ' + (path.length - 1 - i) + ' trailing directions')
      break
    } else if (path[i] === PATH_LEFT) {
      dx = -1
      cell.dir = 'left'
    } else if (path[i] === PATH_RIGHT) {
      dx = +1
      cell.dir = 'right'
    } else if (path[i] === PATH_TOP) {
      dy = -1
      cell.dir = 'top'
    } else if (path[i] === PATH_BOTTOM) {
      dy = +1
      cell.dir = 'down'
    } else {
      throw Error('Path element ' + (i-1) + ' was not a valid path direction: ' + path[i])
    }

    console.log('Currently at', x, y, cell, 'moving', dx, dy)

    x += dx
    y += dy
    // Unflag the cell, move into it, and reflag it
    cell.line = window.LINE_NONE
    window.onMove(41 * dx, 41 * dy)
    if (puzzle.symmetry == null) {
      cell.line = window.LINE_BLACK
    } else {
      cell.line = window.LINE_BLUE
      var sym = puzzle.getSymmetricalPos(x, y)
      puzzle.updateCell2(sym.x, sym.y, 'line', window.LINE_YELLOW)
    }
  }
  var cell = puzzle.getCell(x, y)
  if (cell == null || cell.end == null) throw Error('Path does not end at an endpoint: ' + JSON.stringify(cell))

  var rows = '   |'
  for (var x=0; x<puzzle.width; x++) {
    rows += ('' + x).padEnd(5, ' ') + '|'
  }
  console.log(rows)
  for (var y=0; y<puzzle.height; y++) {
    var output = ('' + y).padEnd(3, ' ') + '|'
    for (var x=0; x<puzzle.width; x++) {
      var cell = puzzle.grid[x][y]
      var dir = (cell != null && cell.dir != null ? cell.dir : '')
      output += dir.padEnd(5, ' ') + '|'
    }
    console.log(output)
  }
}

window.getSolutionIndex = function(pathList, solution) {
  for (var i=0; i<pathList.length; i++) {
    var path = pathList[i]
    var x = path[0].x
    var y = path[0].y
    if (solution.grid[path[0].x][path[0].y].line === 0) continue;

    var match = true
    for (var j=1; j<path.length; j++) {
      var cell = solution.grid[x][y]
      if (path[j] === PATH_NONE && cell.end != null) {
        match = false
        break;
      } else if (path[j] === PATH_LEFT) {
        if (cell.dir != 'left') {
          match = false
          break;
        }
        x--
      } else if (path[j] === PATH_RIGHT) {
        if (cell.dir != 'right') {
          match = false
          break;
        }
        x++
      } else if (path[j] === PATH_TOP) {
        if (cell.dir != 'top') {
          match = false
          break;
        }
        y--
      } else if (path[j] === PATH_BOTTOM) {
        if (cell.dir != 'bottom') {
          match = false
          break;
        }
        y++
      }
    }
    if (match) return i
  }
  return -1
}

})
