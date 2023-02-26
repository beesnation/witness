namespace(function() {

let audioPlaying = false;
var onkeydown;

window.draw = function(puzzle, target='puzzle') {
  if (puzzle == null) return
  var svg = document.getElementById(target)
  console.log('Drawing', puzzle, 'into', svg)
  while (svg.firstChild) svg.removeChild(svg.firstChild)

  // Prevent context menu popups within the puzzle
  svg.oncontextmenu = function(event) {
    event.preventDefault()
  }

  if (puzzle.pillar === true) {
    // 41*width + 30*2 (padding) + 10*2 (border)
    var pixelWidth = 41 * puzzle.width + 80
  } else {
    // 41*(width-1) + 24 (extra edge) + 30*2 (padding) + 10*2 (border)
    var pixelWidth = 41 * puzzle.width + 63
  }
  var pixelHeight = 41 * puzzle.height + 63
  svg.setAttribute('viewbox', '0 0 ' + pixelWidth + ' ' + pixelHeight)
  svg.style.width = pixelWidth + 'px'
  svg.style.height = pixelHeight + 'px'
  svg.style.transition = 'all 0s';
  svg.style.transform = `perspective(${puzzle.transform.translate[2]}px) rotateX(${puzzle.transform.rotate[0]}deg) rotateY(${puzzle.transform.rotate[1]}deg) skew(${puzzle.transform.skew[0]}deg, ${puzzle.transform.skew[1]}deg) rotateZ(${puzzle.transform.rotate[2]}deg) scale(${Number(puzzle.transform.scale[0]) / 100}, ${Number(puzzle.transform.scale[1]) / 100}) translate(${puzzle.transform.translate[0]}px, ${puzzle.transform.translate[1]}px)`

  var rect = createElement('rect')
  svg.appendChild(rect)
  rect.setAttribute('stroke-width', 10)
  rect.setAttribute('stroke', 'var(--border)')
  rect.setAttribute('fill', 'var(--outer)')
  // Accounting for the border thickness
  rect.setAttribute('x', 5)
  rect.setAttribute('y', 5)
  rect.setAttribute('width', pixelWidth - 10) // Removing border
  rect.setAttribute('height', pixelHeight - 10) // Removing border

  drawCenters(puzzle, svg)
  drawGrid(puzzle, svg, target)
  drawStartAndEnd(puzzle, svg)
  // Draw cell symbols after so they overlap the lines, if necessary
  drawSymbols(puzzle, svg, target)
  addPuzzleStartListener(puzzle, svg)

  if (puzzle.moongate) {
    let defs = window.createElement('defs')
    defs.id = 'cursorGlow'
    defs.innerHTML = '' +
    '<filter id="lineBlur" x="-2.5" y="-2.5" width="600%" height="600%">\n' +
    '  <feDropShadow result="shadowOut1" in="SourceGraphic" dx="0" dy="0" stdDeviation="10" flood-color="white"/>\n' + 
    '  <feDropShadow result="shadowOut2" in="SourceGraphic" dx="0" dy="0" stdDeviation="20" flood-color="white"/>\n' + 
    '  <feDropShadow result="shadowOut3" in="SourceGraphic" dx="0" dy="0" stdDeviation="30" flood-color="white"/>\n' + 
    '  <feBlend in="SourceGraphic" in2="shadowOut1" result="resIn1" mode="normal" />\n' +
    '  <feBlend in="resIn1" in2="shadowOut2" result="resIn2" mode="normal" />\n' +
    '  <feBlend in="resIn2" in2="shadowOut3" mode="normal" />\n' +
    '</filter>\n'
    svg.appendChild(defs)
  }

  // For pillar puzzles, add faders for the left and right sides
  if (puzzle.pillar === true) {
    var defs = window.createElement('defs')
    defs.id = 'cursorPos'
    defs.innerHTML = '' +
    '<linearGradient id="fadeInLeft">\n' +
    '  <stop offset="0%"   stop-opacity="1.0" stop-color="var(--outer)"></stop>\n' +
    '  <stop offset="25%"  stop-opacity="1.0" stop-color="var(--outer)"></stop>\n' +
    '  <stop offset="100%" stop-opacity="0.0" stop-color="var(--outer)"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeOutRight">\n' +
    '  <stop offset="0%"   stop-opacity="0.0" stop-color="var(--outer)"></stop>\n' +
    '  <stop offset="100%" stop-opacity="1.0" stop-color="var(--outer)"></stop>\n' +
    '</linearGradient>\n'
    svg.appendChild(defs)

    var leftBox = window.createElement('rect')
    leftBox.setAttribute('x', 16)
    leftBox.setAttribute('y', 10)
    leftBox.setAttribute('width', 48)
    leftBox.setAttribute('height', 41 * puzzle.height + 43)
    leftBox.setAttribute('fill', 'url(#fadeInLeft)')
    leftBox.setAttribute('style', 'pointer-events: none')
    svg.appendChild(leftBox)

    var rightBox = window.createElement('rect')
    rightBox.setAttribute('x', 41 * puzzle.width + 22)
    rightBox.setAttribute('y', 10)
    rightBox.setAttribute('width', 30)
    rightBox.setAttribute('height', 41 * puzzle.height + 43)
    rightBox.setAttribute('fill', 'url(#fadeOutRight)')
    rightBox.setAttribute('style', 'pointer-events: none')
    svg.appendChild(rightBox)
  }
  
  if (puzzle.image['veil-image']) {
    let veil = createElement('image')
    veil.setAttribute('x', 0);
    veil.setAttribute('y', 0);
    veil.setAttribute('width', pixelWidth);
    veil.setAttribute('height', pixelHeight);
    veil.setAttribute('href', puzzle.image['veil-image'].replace(/\\/g, ''));
    veil.setAttribute('pointer-events', 'none');
    veil.setAttribute('preserveAspectRatio', 'none');
    veil.setAttribute('class', 'veil-image');
    svg.appendChild(veil);
  }
  
  if (puzzle.image['foreground-image']) {
    let foreground = createElement('image')
    foreground.setAttribute('x', 0);
    foreground.setAttribute('y', 0);
    foreground.setAttribute('width', pixelWidth);
    foreground.setAttribute('height', pixelHeight);
    foreground.setAttribute('href', puzzle.image['foreground-image'].replace(/\\/g, ''));
    foreground.setAttribute('pointer-events', 'none');
    foreground.setAttribute('preserveAspectRatio', 'none');
    svg.appendChild(foreground);
  }

  if (!audioPlaying && puzzle.image['background-music']) {
    var audio = new Audio(puzzle.image['background-music'].replace(/\\/g, ''));  
    audio.autoplay = true;
    audio.loop = true;
    audio.volume = localStorage.volume;
    audio.addEventListener('play', () => { audioPlaying = true; });
  }
}

function drawCenters(puzzle, svg) {
  // @Hack that I am not fixing. This switches the puzzle's grid to a floodfilled grid
  // where null represents cells which are part of the outside
  var savedGrid = puzzle.switchToMaskedGrid()
  if (puzzle.pillar === true) {
    for (var y=1; y<puzzle.height; y += 2) {
      if (puzzle.getCell(-1, y) == null) continue; // Cell borders the outside
      var rect = createElement('rect')
      rect.setAttribute('x', 28)
      rect.setAttribute('y', 41 * y + 11)
      rect.setAttribute('width', 24)
      rect.setAttribute('height', 82)
      rect.setAttribute('fill', 'var(--inner)')
      svg.appendChild(rect)
    }
  }

  for (var x=1; x<puzzle.width; x += 2) {
    for (var y=1; y<puzzle.height; y += 2) {
      if (puzzle.grid[x][y] == null) continue; // Cell borders the outside
      var rect = createElement('rect')
      rect.setAttribute('x', 41 * x + 11)
      rect.setAttribute('y', 41 * y + 11)
      rect.setAttribute('width', 82)
      rect.setAttribute('height', 82)
      rect.setAttribute('fill', 'var(--inner)')
      rect.setAttribute('shape-rendering', 'crispedges') // Otherwise they don't meet behind gaps
      svg.appendChild(rect)
    }
  }
  puzzle.grid = savedGrid
}

function drawGrid(puzzle, svg, target) {
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell?.gap === window.GAP_FULL) continue;
      if (cell?.gap === window.GAP_BREAK) {
        var params = {
          'width':58,
          'height':58,
          'x': x*41 + 23,
          'y': y*41 + 23,
          'class': target + '_' + x + '_' + y,
          'type': 'gap',
        }
        if (x%2 === 0 && y%2 === 1) params.rot = 1
        drawSymbolWithSvg(svg, params)
        continue;
      }
      if (cell?.gap >= window.CUSTOM_CROSSING) {
        var params = {
          'width':58,
          'height':58,
          'x': x*41 + 23,
          'y': y*41 + 23,
          'class': target + '_' + x + '_' + y,
          'type': 'crossing',
          'color': 'var(--line-default)'
        }
        drawSymbolWithSvg(svg, params)
        continue;
      }
      if (cell?.gap >= window.CUSTOM_BRIDGE) {
        var params = {
          'width':58,
          'height':58,
          'x': x*41 + 23,
          'y': y*41 + 23,
          'class': target + '_' + x + '_' + y,
          'type': 'bridgeButActually',
          'flip': (cell?.gap - window.CUSTOM_BRIDGE) + (0.5 * (y % 2)),
          'color': 'var(--line-default)'
        }
        drawSymbolWithSvg(svg, params)
        continue;
      }

      var line = createElement('line')
      line.setAttribute('stroke-width', 24)
      line.setAttribute('stroke-linecap', 'round')
      line.setAttribute('stroke', 'var(--line-undone)')
      if (x%2 === 1 && y%2 === 0) { // Horizontal
        if (cell?.gap === window.GAP_BREAK) continue;
        line.setAttribute('x1', (x-1)*41 + 52)
        // Adjust the length if it's a pillar -- the grid is not as wide!
        if (puzzle.pillar === true && x === puzzle.width - 1) {
          line.setAttribute('x2', (x+1)*41 + 40)
        } else {
          line.setAttribute('x2', (x+1)*41 + 52)
        }
        line.setAttribute('y1', y*41 + 52)
        line.setAttribute('y2', y*41 + 52)
        svg.appendChild(line)
      } else if (x%2 === 0 && y%2 === 1) { // Vertical
        if (cell?.gap === window.GAP_BREAK) continue;
        line.setAttribute('x1', x*41 + 52)
        line.setAttribute('x2', x*41 + 52)
        line.setAttribute('y1', (y-1)*41 + 52)
        line.setAttribute('y2', (y+1)*41 + 52)
        svg.appendChild(line)
      } else if (x%2 === 0 && y%2 === 0) { // Intersection
        var surroundingLines = 0
        if (cell?.end != null) surroundingLines++
        var leftCell = puzzle.getCell(x - 1, y)
        if (leftCell != null && leftCell.gap !== window.GAP_FULL) surroundingLines++
        var rightCell = puzzle.getCell(x + 1, y)
        if (rightCell != null && rightCell.gap !== window.GAP_FULL) surroundingLines++
        var topCell = puzzle.getCell(x, y - 1)
        if (topCell != null && topCell.gap !== window.GAP_FULL) surroundingLines++
        var bottomCell = puzzle.getCell(x, y + 1)
        if (bottomCell != null && bottomCell.gap !== window.GAP_FULL) surroundingLines++

        if (surroundingLines === 1) {
          // Add square caps for dead ends which are non-endpoints
          var rect = createElement('rect')
          rect.setAttribute('x', x*41 + 40)
          rect.setAttribute('y', y*41 + 40)
          rect.setAttribute('width', 24)
          rect.setAttribute('height', 24)
          rect.setAttribute('fill', 'var(--line-undone)')
          svg.appendChild(rect)
        } else if (surroundingLines > 1) {
          // Add rounding for other intersections (handling gap-only corners)
          var circ = createElement('circle')
          circ.setAttribute('cx', x*41 + 52)
          circ.setAttribute('cy', y*41 + 52)
          circ.setAttribute('r', 12)
          circ.setAttribute('fill', 'var(--line-undone)')
          svg.appendChild(circ)
        }
      }

      if (cell?.gap === window.CUSTOM_LINE) {
        var params = {
          'width':58,
          'height':58,
          'x': x*41 + 23,
          'y': y*41 + 23,
          'class': target + '_' + x + '_' + y,
          'type': 'line',
          'color': 'var(--line-default)'
        }
        if (x%2 === 0 && y%2 === 1) params.rot = 1
        drawSymbolWithSvg(svg, params)
      }
    }
  }
  // Determine if left-side needs a 'wrap indicator'
  if (puzzle.pillar === true) {
    var x = 0;
    for (var y=0; y<puzzle.height; y+=2) {
      var cell = puzzle.getCell(x-1, y)
      if (cell == null || cell.gap === window.GAP_FULL) continue;
      var line = createElement('line')
      line.setAttribute('stroke-width', 24)
      line.setAttribute('stroke-linecap', 'round')
      line.setAttribute('stroke', 'var(--line-undone)')
      line.setAttribute('x1', x*41 + 40)
      line.setAttribute('x2', x*41 + 52)
      line.setAttribute('y1', y*41 + 52)
      line.setAttribute('y2', y*41 + 52)
      svg.appendChild(line)
    }
  }
}

function drawSymbols(puzzle, svg, target) {
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == null) continue;
      var params = {
        'width':58,
        'height':58,
        'x': x*41 + 23,
        'y': y*41 + 23,
        'class': target + '_' + x + '_' + y,
      }
      if (cell.dot >= CUSTOM_FISH_BLACK) {
        params.type = 'fish';
        if (cell.dot === CUSTOM_FISH_BLACK) params.color = 'black';
        else if (cell.dot === CUSTOM_FISH_BLUE) params.color = '#' + puzzle.theme['line-primary'].toString(16).slice(0, 6);
        else if (cell.dot === CUSTOM_FISH_YELLOW) params.color = '#' + puzzle.theme['line-secondary'].toString(16).slice(0, 6);
        window.drawSymbolWithSvg(svg, params)
      } else if (cell.dot >= CUSTOM_COMPARATOR) {
        params.type = 'comparator';
        params.color = '#008060ff'
        params.flip = cell.dot - CUSTOM_COMPARATOR
        window.drawSymbolWithSvg(svg, params)
      } else if (cell.dot >= window.SOUND_DOT) {
        params.type = 'dot';
        params.color = '#ff6666ff';
        params.size = cell.dot - window.SOUND_DOT + 1;
        window.drawSymbolWithSvg(svg, params)
      } else if (cell.dot >= window.CUSTOM_DOTS) {
        params.type = 'dots'
        params.count = (cell.dot - 4);
        switch (params.count % 7) {
          case 1:
            params.color = '#' + puzzle.theme['line-default'].toString(16).slice(0, 6);
            params.type = 'dotsHollow';
            break;
          case 2:
            params.color = 'black';
            break;
          case 3:
            params.type = 'dotsHollow';
          case 4:
            params.color = '#' + puzzle.theme['line-primary'].toString(16).slice(0, 6);
            break;
          case 5:
            params.type = 'dotsHollow';
          case 6:
            params.color = '#' + puzzle.theme['line-secondary'].toString(16).slice(0, 6);
            break;
          case 0:
            params.color = 'var(--line-undone)';
            if (document.getElementById('metaButtons') != null) {
              params.stroke = 'black'
              params.strokeWidth = '2px'
            }
            break;
        }
        params.count = Math.floor((params.count - 1) / 7);
        window.drawSymbolWithSvg(svg, params);
      } else if (cell.dot > window.DOT_NONE) {
        params.type = 'dot';
        if (cell.dot === window.DOT_BLACK) params.color = 'black'
        else if (cell.dot === window.DOT_BLUE) {
          params.color = '#' + puzzle.theme['line-primary'].toString(16).slice(0, 6);
        }
        else if (cell.dot === window.DOT_YELLOW) {
          params.color = '#' + puzzle.theme['line-secondary'].toString(16).slice(0, 6);
        }
        else if (cell.dot === window.DOT_INVISIBLE) {
          params.color = 'var(--line-undone)'
          // This makes the invisible dots visible, but only while we're in the editor.
          if (document.getElementById('metaButtons') != null) {
            params.stroke = 'black'
            params.strokeWidth = '2px'
          }
        }
        window.drawSymbolWithSvg(svg, params)
      } else if (cell.dot < window.DOT_NONE) { // draw custom gimmicks
        if (cell.dot > window.CUSTOM_CURVE) {
          if (cell.dot % 2 == -1) params.type = 'cross';
          else params.type = 'crossFilled';
        }
        else { 
          if (cell.dot % 2 == -1) params.type = 'curve';
          else params.type = 'curveFilled';
        }
        switch (cell.dot % 6) {
          case -1:
            params.color = '#' + puzzle.theme['line-default'].toString(16).slice(0, 6);
            break;
          case -2:
            params.color = 'black';
            break;
          case -3:
          case -4:
            params.color = '#' + puzzle.theme['line-primary'].toString(16).slice(0, 6);
            break;
          case -5:
          case 0:
            params.color = '#' + puzzle.theme['line-secondary'].toString(16).slice(0, 6);
            break;
        }
        if (cell.dot <= window.CUSTOM_X) {
          params.type = 'x';
          params.spokes = window.dotToSpokes(cell.dot)
          params.color = '#f66';
        }
        window.drawSymbolWithSvg(svg, params)
      } else if (cell.gap === window.GAP_BREAK) {
        // Gaps were handled above, while drawing the grid.
      } else if (x%2 === 1 && y%2 === 1) {
        // Generic draw for all other elements
        Object.assign(params, cell)
        if (params.color == 2 && document.getElementById('metaButtons') != null) {
          params.stroke = 'black'
          params.strokeWidth = '2px'
        }
        window.drawSymbolWithSvg(svg, params)
      }
    }
  }
}

function drawStartAndEnd(puzzle, svg) {
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == null) continue;
      if (cell.end != null) {
        if (puzzle.symmetry != null) {
          var sym = puzzle.getSymmetricalPos(x, y)
          var symCell = puzzle.getCell(sym.x, sym.y)
          if (symCell.end == null) {
            console.warn('Found an endpoint at', x, y, 'but there was no symmetrical endpoint at', sym.x, sym.y)
          }
        }
        window.drawSymbolWithSvg(svg, {
          'type': 'end',
          'width': 58,
          'height': 58,
          'dir': cell.end,
          'endType': cell.endType,
          'x': x*41 + 23,
          'y': y*41 + 23,
        })
      }

      if (cell.start !== undefined) {
        var symStart = null
        if (puzzle.symmetry != null) {
          var sym = puzzle.getSymmetricalPos(x, y)
          var symCell = puzzle.getCell(sym.x, sym.y)
          if (symCell.start === undefined) {
            console.warn('Found a startpoint at', x, y, 'but there was no symmetrical startpoint at', sym.x, sym.y)
          }
          window.drawSymbolWithSvg(svg, {
            'type': 'start',
            'width': 58,
            'height': 58,
            'opposite': symCell.start === 2,
            'x': sym.x*41 + 23,
            'y': sym.y*41 + 23,
          })
          symStart = svg.lastChild
          symStart.style.display = 'none'
          if (symCell.start === 2) symStart = symStart.previousSibling;
          symStart.style.display = 'none'
          symStart.id = 'symStart_' + svg.id + '_' + x + '_' + y
        }

        window.drawSymbolWithSvg(svg, {
          'type': 'start',
          'width': 58,
          'height': 58,
          'opposite': cell.start === 2,
          'x': x*41 + 23,
          'y': y*41 + 23,
        })
        var start = svg.lastChild
        if (cell.start === 2) start = start.previousSibling;
        start.id = 'start_' + svg.id + '_' + x + '_' + y

        // ;(function(a){}(a))
        // This syntax is used to forcibly copy all of the arguments
        ;(function(puzzle, x, y, start, symStart) {
          start.onpointerdown = function(event) {
            window.onTraceClick(event, puzzle, {'x':x, 'y':y}, start, symStart)
            event.stopPropagation();
          }
        }(puzzle, x, y, start, symStart))
      }
    }
  }
}

function addPuzzleStartListener(puzzle, svg) {
  if (onkeydown)
    document.removeEventListener("keydown", onkeydown)
  onkeydown = function(event) {

    if ([" ", "Enter", "5"].includes(event.key)) {
      event.preventDefault()
      window.cycleStartPoint(0, puzzle, svg)
    }
  }
  document.addEventListener("keydown", onkeydown, {"passive":false})
}

})
