window.NAME = "https://beesnation.github.io/witness"

function namespace(code) {
  code()
}

// ---------------------------------------------------------------------------------------------------- //
//* data stuff
// ---------------------------------------------------------------------------------------------------- //

namespace(function () {

  /*** Start cross-compatibility ***/
  // Used to detect if IDs include a direction, e.g. resize-top-left
  if (!String.prototype.includes) {
    String.prototype.includes = function () {
      return String.prototype.indexOf.apply(this, arguments) !== -1
    }
  }
  Event.prototype.movementX = Event.prototype.movementX || Event.prototype.mozMovementX
  Event.prototype.movementY = Event.prototype.movementY || Event.prototype.mozMovementY
  Event.prototype.isRightClick = function () {
    return this.which === 3 || (this.touches && this.touches.length > 1)
  }
  /*** End cross-compatibility ***/

  // https://stackoverflow.com/q/12571650
  window_onerror = window.onerror
  window.onerror = function (message, url, line) {
    console.error(message, url, line)
  }

  var tracks = {
    'start': './data/panel_start_tracing.ogg',
    'success': './data/panel_success.ogg',
    'fail': './data/panel_failure.ogg',
    'abort': './data/panel_abort_tracing.ogg',
    'startCRT': './data/crt_panel_start_tracing.ogg',
    'successCRT': './data/crt_panel_success.ogg',
    'failCRT': './data/crt_panel_failure.ogg',
    'abortCRT': './data/crt_panel_abort_tracing.ogg',
    'startPillar': './data/endpillars_panel_start_tracing.ogg',
    'successPillar': './data/endpillars_panel_success.ogg',
    'failPillar': './data/endpillars_panel_failure.ogg',
    'abortPillar': './data/endpillars_panel_abort_tracing.ogg',
    'startFloor': './data/floor_panel_start_tracing.ogg',
    'successFloor': './data/floor_panel_success.ogg',
    'failFloor': './data/floor_panel_failure.ogg',
    'abortFloor': './data/floor_panel_abort_tracing.ogg',
    'startGlass': './data/glass_panel_start_tracing.ogg',
    'successGlass': './data/glass_panel_success.ogg',
    'failGlass': './data/glass_panel_failure.ogg',
    'abortGlass': './data/glass_panel_abort_tracing.ogg',
    'endB': './data/bridge_panel_fold_even.ogg',
    'endC': './data/bridge_panel_fold_odd.ogg',
    'beam': './data/laser_fire.ogg',
    'click': './data/pointless_click.ogg',
    'negator': './data/eraser_apply.ogg',
  }

  window.PLAY_SOUND = function (name) {
    var audio = new Audio(src = './data/panel_start_tracing.ogg')
    audio.src = tracks[name]
    audio.volume = localStorage.volume
    audio.play()
  }

  // ---------------------------------------------------------------------------------------------------- //
  //* enum stuff
  // ---------------------------------------------------------------------------------------------------- //

  window.LINE_NONE = 0
  window.LINE_BLACK = 1
  window.LINE_BLUE = 2
  window.LINE_YELLOW = 3
  window.DOT_NONE = 0
  window.DOT_BLACK = 1
  window.DOT_BLUE = 2
  window.DOT_YELLOW = 3
  window.DOT_INVISIBLE = 4
  window.CUSTOM_DOTS = 5
  window.CUSTOM_CROSS = -1
  window.CUSTOM_CROSS_FILLED = -2
  window.CUSTOM_CROSS_BLUE = -3
  window.CUSTOM_CROSS_BLUE_FILLED = -4
  window.CUSTOM_CROSS_YELLOW = -5
  window.CUSTOM_CROSS_YELLOW_FILLED = -6
  window.CUSTOM_CURVE = -7
  window.CUSTOM_CURVE_FILLED = -8
  window.CUSTOM_CURVE_BLUE = -9
  window.CUSTOM_CURVE_BLUE_FILLED = -10
  window.CUSTOM_CURVE_YELLOW = -11
  window.CUSTOM_CURVE_YELLOW_FILLED = -12
  window.SOUND_DOT = 40
  window.CUSTOM_COMPARATOR = 48
  window.CUSTOM_COMPARATOR_FLIPPED = 49
  window.CUSTOM_X = -13
  window.GAP_NONE = 0
  window.GAP_BREAK = 1
  window.GAP_FULL = 2
  window.CUSTOM_LINE = 3
  window.CUSTOM_BRIDGE = 4
  window.CUSTOM_BRIDGE_FLIPPED = 5

  window.symbols = ['square', 'star', 'pentagon', 'triangle', 'arrow', 'dart', 'atriangle', 'vtriangle', 'blackhole', 'whitehole', 'divdiamond', 'pokerchip', 'bridge', 'scaler', 'sizer', 'twobytwo', 'poly', 'ylop', 'polynt', 'nega', 'copier', 'portal', 'celledhex', 'dice', 'xvmino', 'crystal', '!poly', '!ylop', '!polynt', '!xvmino', 'swirl', 'eye', 'bell', 'drop', 'null', 'fulcrum'];
  window.polyominoes = ['poly', 'ylop', 'polynt', 'xvmino'];
  window.endEnum = ['top', 'right', 'left', 'bottom'];
  window.themeArgs = ['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary'];
  window.imageArgs = ['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'];
  window.symbolColors = ["#000000ff", "#00000080", "#00000000", "#ffffffff", "#ffffff80", "#ccccccff", "#ff0000ff", "#ff66b3ff", "#800000ff", "#ffa500ff", "#fa8f04ff", "#ff6666ff", "#ffff00ff", "#ffff80ff", "#cccc44ff", "#008000ff", "#b0ffb0ff", "#3cd4d9ff", "#0000ffff", "#6867fdff", "#80ffffff", "#800080ff", "#8101ffff", "#ff07ffff", "#55556cff", "#b4b4c4ff", "#aa0000ff", "#ff4000ff", "#ffc900ff", "#00ff00ff", "#76a856ff", "#aa00aaff", "var(--background)", "var(--outer)", "var(--line-undone)", "var(--text)", "var(--line-default)", "var(--line-primary)", "var(--line-secondary)", "var(--line-success)"];
  window.symmetryModes = function (symmetry, pillar) {
    if (pillar) {
      if (!symmetry) return 'Pillar';
      else switch (symmetry.y * 2 + symmetry.x) {
        case 0:
          return 'Pillar (Two Lines)';
        case 1:
          return 'Pillar (H Symmetry)';
        case 2:
          return 'Pillar (V Symmetry)';
        case 3:
          return 'Pillar (R Symmetry)';
      }
    } else {
      if (!symmetry) return 'Default';
      else switch (symmetry.y * 2 + symmetry.x) {
        case 1:
          return 'Horizontal Symmetry';
        case 2:
          return 'Vertical Symmetry';
        case 3:
          return 'Rotational Symmetry';
      }
    }
  }

  // ---------------------------------------------------------------------------------------------------- //
  //* animation stuff
  // ---------------------------------------------------------------------------------------------------- //

  var animations = ''
  var l = function (line) { animations += line + '\n' }
  // pointer-events: none; allows for events to bubble up (so that editor hooks still work)
  l('.line-1 {')
  l('  fill: var(--line-default);')
  l('  pointer-events: none;')
  l('}')
  l('.line-2 {')
  l('  fill: var(--line-primary);')
  l('  pointer-events: none;')
  l('}')
  l('.line-3 {')
  l('  fill: var(--line-secondary);')
  l('  pointer-events: none;')
  l('}')
  l('.line-moon {')
  l('  filter: url(#lineBlur);')
  l('}')
  l('@keyframes line-success {to {fill: var(--line-success);}}')
  l('@keyframes line-fail {to {fill: var(--line-failure);}}')
  l('@keyframes error {to {fill: red;}}')
  l('@keyframes status-right {to {fill: #99ff99;}}')
  l('@keyframes status-wrong {to {fill: #ff9999;}}')
  l('@keyframes fade {to {opacity: 0.35;}}')
  l('@keyframes start-grow { 0% {r: 12;} 100% {r: 24;} }')
  // Neutral button style
  l('#symboltheme, .loadButtonWrapper, button {')
  l('  background-color: var(--outer);')
  l('  border: 1px solid var(--border);')
  l('  color: var(--text);')
  l('  display: inline-block;')
  l('  margin: 0px;')
  l('  outline: none;')
  l('  opacity: 1.0;')
  l('  padding: 1px 6px;')
  l('  -moz-appearance: none;')
  l('  -webkit-appearance: none;')
  l('}')
  // Active (while held down) button style
  l('#symboltheme:active, .loadButtonWrapper:active, button:active {filter: brightness(0.8);}')
  // Disabled button style
  l('#symboltheme:disabled, .loadButtonWrapper:disabled, button:disabled {opacity: 0.5;}')
  // Selected button style (see https://stackoverflow.com/a/63108630)
  l('#symboltheme:focus, .loadButtonWrapper:focus, button:focus {outline: none;}')
  l = null

  var style = document.createElement('style')
  style.type = 'text/css'
  style.title = 'animations'
  style.appendChild(document.createTextNode(animations))
  document.head.appendChild(style)

  // ---------------------------------------------------------------------------------------------------- //
  //* log stuff
  // ---------------------------------------------------------------------------------------------------- //

  // Custom logging to allow leveling
  var consoleError = console.error
  var consoleWarn = console.warn
  var consoleInfo = console.log
  var consoleLog = console.log
  var consoleDebug = console.log
  var consoleSpam = console.log
  var consoleGroup = console.group
  var consoleGroupEnd = console.groupEnd

  window.setLogLevel = function (level) {
    console.error = function () { }
    console.warn = function () { }
    console.info = function () { }
    console.log = function () { }
    console.debug = function () { }
    console.spam = function () { }
    console.group = function () { }
    console.groupEnd = function () { }

    if (level === 'none') return

    // Instead of throw, but still red flags and is easy to find
    console.error = consoleError
    if (level === 'error') return

    // Less serious than error, but flagged nonetheless (Default for auto solves)
    console.warn = consoleWarn
    if (level === 'warn') return

    // Only shows validation data, useful for manual solves
    console.info = consoleInfo
    if (level === 'info') return

    // Useful for debugging (mainly validation)
    console.log = consoleLog
    if (level === 'log') return

    // Useful for serious debugging (mainly graphics/misc)
    console.debug = consoleDebug
    if (level === 'debug') return

    // Useful for insane debugging (mainly tracing/recursion)
    console.spam = consoleSpam
    console.group = consoleGroup
    console.groupEnd = consoleGroupEnd
    if (level === 'spam') return
  }
  setLogLevel('error') //! CHANGE THIS IN DEV

  window.deleteElementsByClassName = function (rootElem, className) {
    var elems = []
    while (true) {
      elems = rootElem.getElementsByClassName(className)
      if (elems.length === 0) break;
      elems[0].remove()
    }
  }

  window.pathsToDir = function (rawPath) {
    let res = "", path = [...rawPath];
    res += String.fromCharCode(path[0].x, path[0].y);
    path[path.length - 1] = ['', 'left', 'right', 'top', 'bottom'].indexOf(puzzle.getCell(puzzle.endPoint.x, puzzle.endPoint.y).end);
    for (let i = 1; i < path.length; i += 4) {
      res += String.fromCharCode(
        ((Math.max(1, path[i]) - 1)) |
        ((Math.max(1, path[i + 1]) - 1) << 2) |
        ((Math.max(1, path[i + 2]) - 1) << 4) |
        ((Math.max(1, path[i + 3]) - 1) << 6)
      );
    }
    return res;
  }

  // ---------------------------------------------------------------------------------------------------- //
  //* util stuff
  // ---------------------------------------------------------------------------------------------------- //

  window.hexToInt = function (hex) {
    return parseInt(hex.slice(1), 16) >>> 0;
  }

  window.intToHex = function (int) {
    return '#' + Number(int).toString(16).padStart(8, '0');
  }

  window.makeBitSwitch = function (...bits) {
    let cur = 1;
    let res = 0;
    for (const b of bits) {
      if (b) res += cur;
      cur <<= 1;
    }
    res += cur;
    return res;
  }

  window.readBitSwitch = function (bs) {
    let cur = 0;
    let res = [];
    while ((bs >> cur) > 1) {
      if ((bs >> cur) % 2) res.push(true);
      else res.push(false);
      cur++;
    }
    return res;
  }

  window.intToByte = function (n) {
    return String.fromCharCode(((n & 0xff000000) >>> 24), ((n & 0x00ff0000) >>> 16), ((n & 0x0000ff00) >>> 8), n & 0x000000ff);
  }

  window.intToShort = function (n) {
    return String.fromCharCode(((n & 0xFF00) >>> 8), n & 0xFF);
  }

  window.byteToInt = function (b, signed) {
    let i = (b.charCodeAt(0) << 24 >>> 0) + (b.charCodeAt(1) << 16 >>> 0) + (b.charCodeAt(2) << 8 >>> 0) + (b.charCodeAt(3) >>> 0);
    if ((i & 0x80000000) && signed) return i - 0x100000000;
    else return i;
  }

  window.shortToInt = function (b, signed) {
    let i = (b.charCodeAt(0) << 8 >>> 0) + (b.charCodeAt(1) >>> 0);
    if ((i & 0x8000) && signed) return i - 0x10000;
    else return i;
  }

  window.div = function (n, a) {
    return ((n - (n % a)) / a);
  }

  window.rdiv = function (n, a) {
    return ((n % a) + a) % a;
  }

  window.mdiv = function (n, a) {
    return n - (n % a);
  }
  const _keyStr = " 123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.-0"

  window.runLength = function (str) {
    let res = "";
    let cur = '';
    let rep = 0;
    str += '!'; // terminate
    for (let i = 0; i < str.length; i++) {
      if (rep == 64) {
        res += '~0' + cur;
        rep = 0;
      }
      if (cur != str[i]) {
        if (rep > 3) {
          res += '~' + _keyStr[rep] + cur;
        }
        else res += cur.repeat(rep);
        cur = str[i]; rep = 1;
      } else rep++;
    }
    return res;
  }

  window.runLengthV2 = function (str) {
    let res = "";
    let cur = '';
    let rep = 0;
    str += '!'; // terminate
    //* STAGE 1: SINGLE LETTER RLE
    for (let i = 0; i < str.length; i++) {
      if (rep == 64) {
        res += '~~0' + cur;
        rep = 0;
      }
      if (cur != str[i]) {
        if (rep > 4) {
          res += '~~' + _keyStr[rep] + cur;
        }
        else res += cur.repeat(rep);
        cur = str[i]; rep = 1;
      } else rep++;
    }
    //* STAGE 2: 4 LETTER RLE
    str = res;
    res = "";
    cur = '';
    rep = 0;
    str += '!!!!'; // terminate
    for (let i = 0; i < str.length - 3;) {
      if (rep == 64) {
        res += '~0' + cur;
        rep = 0;
      }
      if (rep) {
        if (cur == str.slice(i, i + 4)) {
          rep++;
          i += 4;
        } else {
          res += '~' + _keyStr[rep] + cur
          cur = '';
          rep = 0;
        }
      } else {
        if (str.slice(i, i + 4) == str.slice(i + 4, i + 8)) {
          cur = str.slice(i, i + 4)
          rep = 1;
          i += 4;
        }
        else {
          res += str[i];
          i++;
        }
      }
    }
    res = res.replace(/\!+/g, '');
    return res;
  }

  window.derunLength = function (str) {
    let res = ""
    for (let i = 0; i < str.length; i++) {
      if (str[i] == '~') {
        res += str[i + 2].repeat(_keyStr.indexOf(str[i + 1]));
        i += 2;
      }
      else res += str[i];
    }
    return res;
  }

  window.derunLengthV2 = function (str) {
    let res = ""
    for (let i = 0; i < str.length; i++) {
      if (str.slice(i, i + 2) == '~~') {
        res += '~~';
        i++;
      } else if (str[i] == '~') {
        res += str.slice(i + 2, i + 6).repeat(_keyStr.indexOf(str[i + 1]));
        i += 5;
      }
      else res += str[i];
    }
    str = res;
    res = "";
    for (let i = 0; i < str.length; i++) {
      if (str.slice(i, i + 2) == '~~') {
        res += str[i + 3].repeat(_keyStr.indexOf(str[i + 2]));
        i += 3;
      }
      else res += str[i];
    }
    return res;
  }

  // ---------------------------------------------------------------------------------------------------- //
  //* puzzle stuff
  // ---------------------------------------------------------------------------------------------------- //

  window.dotToSpokes = function (dot) {
    if (dot >= -12) return 0;
    else return (dot * -1) - 12
  }

  // Automatically solve the puzzle
  window.solvePuzzle = function () {
    if (window.setSolveMode) window.setSolveMode(false)
    document.getElementById('solutionViewer').style.display = 'none'
    document.getElementById('progressBox').style.display = null
    document.getElementById('solveAuto').innerText = 'Cancel Solving'
    document.getElementById('solveAuto').onpointerdown = function () {
      this.innerText = 'Cancelling...'
      this.onpointerdown = null
      window.setTimeout(window.cancelSolving, 0)
    }

    window.solve(window.puzzle, function (percent) {
      document.getElementById('progressPercent').innerText = percent + '%'
      document.getElementById('progress').style.width = percent + '%'
    }, function (paths) {
      document.getElementById('progressBox').style.display = 'none'
      document.getElementById('solutionViewer').style.display = null
      document.getElementById('progressPercent').innerText = '0%'
      document.getElementById('progress').style.width = '0%'
      document.getElementById('solveAuto').innerText = 'Solve (automatically)'
      document.getElementById('solveAuto').onpointerdown = solvePuzzle

      window.puzzle.autoSolved = true
      paths = window.onSolvedPuzzle(paths)
      showSolution(window.puzzle, paths, 0)
    })
  }

  function showSolution(puzzle, paths, num) {
    var previousSolution = document.getElementById('previousSolution')
    var solutionCount = document.getElementById('solutionCount')
    var nextSolution = document.getElementById('nextSolution')

    if (paths.length === 0) { // 0 paths, arrows are useless
      solutionCount.innerText = '0 of 0'
      previousSolution.disabled = true
      nextSolution.disabled = true
      return
    }

    while (num < 0) num = paths.length + num
    while (num >= paths.length) num = num - paths.length

    if (paths.length === 1) { // 1 path, arrows are useless
      solutionCount.innerText = '1 of 1'
      if (paths.length >= window.MAX_SOLUTIONS) solutionCount.innerText += '+'
      previousSolution.disabled = true
      nextSolution.disabled = true
    } else {
      solutionCount.innerText = (num + 1) + ' of ' + paths.length
      if (paths.length >= window.MAX_SOLUTIONS) solutionCount.innerText += '+'
      previousSolution.disabled = false
      nextSolution.disabled = false
      previousSolution.onpointerdown = function (event) {
        if (event.shiftKey) {
          showSolution(puzzle, paths, num - 10)
        } else {
          showSolution(puzzle, paths, num - 1)
        }
      }
      nextSolution.onpointerdown = function (event) {
        if (event.shiftKey) {
          showSolution(puzzle, paths, num + 10)
        } else {
          showSolution(puzzle, paths, num + 1)
        }
      }

      // Keyboard navigation between solutions
      document.onkeydown = keyNav;
      function keyNav(event) {
        event = event || window.event;

        // Left keypress, move to previous solution
        if (event.keyCode == '37' && previousSolution.disabled == false) {
          showSolution(puzzle, paths, num - 1);
        }
        // Right keypress, move to next solution
        else if (event.keyCode == '39' && nextSolution.disabled == false) {
          showSolution(puzzle, paths, num + 1);
        }
      }

    }

    if (paths[num] != null) {
      // Save the current path on the puzzle object (so that we can pass it along with publishing)
      puzzle.path = paths[num]
      // Draws the given path, and also updates the puzzle to have path annotations on it.
      window.drawPath(puzzle, paths[num])
    }
  }

  window.copyTheme = function (puzzle) {
    for (entry of themeArgs) {
      puzzle.theme[entry] = hexToInt(getComputedStyle(document.documentElement).getPropertyValue('--' + entry));
    }
  }

  window.applyTheme = function (puzzle) {
    for (entry of Object.entries(puzzle.theme)) {
      document.documentElement.style.setProperty('--' + entry[0], intToHex(entry[1]));
    }
  }

  window.copyImage = function (puzzle) {
    puzzle.image = {};
    for (entry of imageArgs) {
      let res = getComputedStyle(document.documentElement).getPropertyValue('--' + entry);
      if (res == 'none') puzzle.image[entry] = null;
      else puzzle.image[entry] = res.slice(4, -1);
    }
  }

  window.applyImage = function (puzzle) {
    for (entry of Object.entries(puzzle.image)) {
      if (entry[1] == null) document.documentElement.style.setProperty('--' + entry[0], 'none');
      else document.documentElement.style.setProperty('--' + entry[0], `url(${entry[1]})`);
    }
  }

  window.serializeTheme = function (puzzle) {
    let ints = [];
    for (const entry of ['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary']) ints.push(puzzle.theme[entry]);
    return 'vt1_' + runLength(btoa(['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary'].map(x => intToByte(puzzle.theme[x])).join('') + imageArgs.map(x => (puzzle.image[x] ?? '')).join('\u0000')).replace(/\+/g, '.').replace(/\//g, '-').replace(/=/g, '_'));
  }

  window.deserializeTheme = function (puzzle, string) {
    let veri = string.indexOf('_');
    let version = string.slice(0, veri);
    string = string.slice(veri + 1);
    if (version == 'vt1') deserializeThemeV1(puzzle, string);
    else throw Error('unknown theme format');
  }

  function deserializeThemeV1(puzzle, string) {
    let raw = atob(derunLength(string).replace(/\./g, '+').replace(/-/g, '/').replace(/_/g, '='));
    let i = 0;
    for (const entry of ['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary']) {
      puzzle.theme[entry] = byteToInt(raw.slice(i, i + 4));
      i += 4;
    }
    let entry = raw.slice(i).split('\u0000');
    for (let i = 0; i < imageArgs.length; i++) puzzle.image[imageArgs[i]] = (entry[i]?.length ? entry[i] : undefined);
    window.puzzle = puzzle;
    applyTheme(puzzle);
    applyImage(puzzle);
  }

  const SCHEMA = new Map([
    ['width', 'byte'],
    ['height', 'byte'],
    ['flags', 'byte'], //* pillar.x, pillar.y, disableFlash, optional, jerrymandering, statuscoloring
    ['sols', 'byte'], //* if sols=0, perfect=true
    ['translateX', 'int'], //* in pixel
    ['translateY', 'int'], //* in pixel
    ['rotateX', 'byte'], //* -45 to 45, in degree
    ['rotateY', 'byte'], //* -45 to 45, in degree
    ['rotateZ', 'int'], //* in pixel
    ['scaleX', 'int'], //* in %
    ['scaleY', 'int'], //* in %
    ['skewX', 'byte'], //* -90 to 90, in degree
    ['skewY', 'byte'], //* -90 to 90, in degree
    ['endA', 'byte'], //* if 0, next puzzle
    ['endB', 'byte'], //* if 0, next puzzle
    ['endC', 'byte'], //* if 0, next puzzle
    ['theme.background', 'int'],
    ['theme.inner', 'int'],
    ['theme.outer', 'int'],
    ['theme.line-default', 'int'],
    ['theme.line-primary', 'int'],
    ['theme.line-secondary', 'int'],
    ['theme.line-success', 'int'],
    ['theme.line-undone', 'int'],
    ['theme.text', 'int'],
    ['defaultCorner', 'corner'], //* only if majority of corner is same dot/gap/start, else null
    ['defaultCell', 'cell'],
    ['corners', 'sparse[]<corner>'],
    ['soundDots', '[]<byte>'],
    ['cells', 'sparse[]<cell>'],
    ['image.background-image', 'string'],
    ['image.foreground-image', 'string'],
    ['image.background-music', 'string'],
    ['image.cursor-image', 'string'],
    ['image.veil-image', 'string'],
  ]);

  /**
   *! Cell data structure
   ** type: type,
   ** color: byte,
    // optional - count
   ** ['triangle', 'arrow', 'dart', 'atriangle', 'divdiamond', 'dice', 'crystal', 'eye']: count: byte
   ** ['arrow', 'dart']:: count += (4 * dir)
    // optional - flip
   ** ['scaler', 'swirl']: flip: byte
    // optional - poly
   ** ['poly', 'ylop', 'polynt', 'xvmino']: polyshape: int (canRotate built into cell type)!!
   */

  /**
   *! Corner data structure
   ** dot: byte (dot info)
   ** start: byte (startx3, endx3 (direction + null), gap, endType<A, B, C>);
   */

  window.serializePuzzle = function (puzzle, asObject = false) {
    let raw = {
      'size': '',
      'header': '',
      'theme': '',
      'defaultCorner': '',
      'defaultCell': '',
      'corner': '',
      'soundData': '',
      'cell': '',
      'image': [],
    };

    //* header
    raw.size += String.fromCharCode(Math.floor(puzzle.width / 2));
    raw.size += String.fromCharCode(Math.floor(puzzle.height / 2));
    raw.size += String.fromCharCode(makeBitSwitch(puzzle.disableFlash, puzzle.optional, puzzle.symmetry, puzzle.symmetry?.x, puzzle.symmetry?.y, puzzle.pillar, puzzle.jerrymandering, puzzle.statuscoloring) - 0x100);
    raw.header += String.fromCharCode(Math.min(0xff, puzzle.sols ?? 1));
    for (let k of ['translate', 'rotate', 'scale', 'skew']) {
      raw.header += puzzle.transform[k].map(x => intToByte(x)).join('');
    }
    raw.header += puzzle.endDest.map(x => String.fromCharCode(x)).join('');
    //* theme
    raw.theme += ['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary'].map(x => intToByte(puzzle.theme[x])).join('');
    //* defaultCorner
    let med = {};
    for (let i = 0; i < puzzle.width / 2; i++) for (let j = 0; j < puzzle.height / 2; j++) {
      if (puzzle.grid[i * 2]?.[j * 2] === undefined) continue;
      let dot = getCornerData(puzzle.grid[i * 2][j * 2]);
      if (dot[1] != '\0') continue;
      med[dot] ??= 0; med[dot]++;
    }
    let defCorner = "\0\0";
    for (let k in med) if (med[k] >= (puzzle.width * puzzle.height / 8)) defCorner = k;
    raw.defaultCorner += defCorner[0];
    //* defaultCell
    med = {};
    for (let i = 0; i < puzzle.width / 2; i++) for (let j = 0; j < puzzle.height / 2; j++) {
      if (puzzle.grid[i * 2 + 1]?.[j * 2 + 1] === undefined) continue;
      let data = getCellData(puzzle.grid[i * 2 + 1][j * 2 + 1]);
      med[data] ??= 0; med[data]++;
    }
    let defCell = "\0";
    for (let k in med) if (med[k] >= (puzzle.height * puzzle.width / 8)) defCell = k;
    raw.defaultCell += defCell;
    //* corners
    let corner = ["", "", ""];
    for (let i = 0; i < puzzle.width; i++) for (let j = 0; j < puzzle.height; j++) {
      if ((i % 2) && (j % 2) || !puzzle.grid[i]?.[j]) continue;
      let data = getCornerData(puzzle.grid[i][j]);
      if (!((i % 2) || (j % 2))) { if (data == defCorner) continue; }
      else if (data == '\0\0') continue;
      corner[0] += String.fromCharCode(i);
      corner[1] += String.fromCharCode(j);
      corner[2] += data;
    }
    raw.corner += intToShort(corner[0].length);
    raw.corner += corner[0];
    raw.corner += corner[1];
    raw.corner += corner[2];
    //* soundData
    raw.soundData += String.fromCharCode(puzzle.soundDots.length);
    for (let i = 0; i < puzzle.soundDots.length; i++) raw.soundData += String.fromCharCode(puzzle.soundDots[i]);
    //* cells
    let cell = ["", "", ""];
    for (let i = 0; i < puzzle.width / 2; i++) for (let j = 0; j < puzzle.height / 2; j++) {
      if (puzzle.grid[i * 2 + 1]?.[j * 2 + 1] === undefined) continue;
      let data = getCellData(puzzle.grid[i * 2 + 1][j * 2 + 1]);
      if (defCell == data) continue;
      cell[0] += String.fromCharCode(i);
      cell[1] += String.fromCharCode(j);
      cell[2] += data;
    }
    raw.cell += intToShort(cell[0].length);
    raw.cell += cell[0];
    raw.cell += cell[1];
    raw.cell += cell[2];
    //* image
    let zeroes = 0;
    for (let i = 0; i < ['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'].length; i++) if (puzzle.image[['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'][i]]) {
      while (zeroes < i) { if (!raw.image[zeroes]) raw.image.push(''); zeroes++; }
      raw.image.push(puzzle.image[['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'][i]]);
    }
    if (asObject) return raw;
    return serializePuzzlePost(raw, 'vA');
  }

  function serializePuzzlePost(raw, version) {
    return version + '_' + runLength(btoa(raw.size + raw.header + raw.theme + raw.defaultCorner + raw.defaultCell + raw.corner + raw.soundData + raw.cell + raw.image.join('\0')).replace(/\+/g, '.').replace(/\//g, '-').replace(/\=/g, '_'));
  }

  function getCellData(cell) {
    let raw = "";
    if (!cell) return "\0";
    if (polyominoes.includes(cell.type) && (cell.polyshape & 1048576)) cell.type = '!' + cell.type;
    let type = window.symbols.indexOf(cell.type) + 2;
    if (cell.type[0] == '!') cell.type = cell.type.slice(1);
    raw += String.fromCharCode(type);
    raw += String.fromCharCode(cell.color);
    let count = 0;
    if (['triangle', 'arrow', 'dart', 'atriangle', 'divdiamond', 'dice', 'crystal', 'eye', 'bell', 'drop'].includes(cell.type)) count += cell.count;
    if (['arrow', 'dart'].includes(cell.type)) count = count * 8 + cell.rot;
    //   if (['bell'].includes(cell.type)) count += cell.flip << 2;
    if (['scaler', 'swirl', 'fulcrum'].includes(cell.type)) raw += String.fromCharCode(!!cell.flip);
    if (count) raw += String.fromCharCode(count);
    if (polyominoes.includes(cell.type)) raw += intToShort(cell.polyshape);
    return raw;
  }

  function getCornerData(cell) {
    if (cell == null) return "\0\0";
    let dot = (cell.dot ? cell.dot + 29 : 0) + (86 * (cell.start ?? 0));
    let start = (endEnum.indexOf(cell.end) + 1) + ((cell.endType ?? 0) << 3) + ((cell.gap ?? 0) << 5);
    return String.fromCharCode(dot, start);
  }

  window.readRawArray = function (str) {
    return str.split('').map(x => x.charCodeAt(0));
  }

  window.deserializePuzzle = function (string) {
    let veri = string.indexOf('_');
    let version = string.slice(0, veri);
    string = string.slice(veri + 1);
    if (version == 'v2') return deserializePuzzleV2(deserializePuzzlePre(string));
    else if (version == 'v3') return deserializePuzzleV3(deserializePuzzlePre(string));
    else if (version == 'v4') return deserializePuzzleV4(deserializePuzzlePre(string));
    else if (version == 'v5') return deserializePuzzleV5(deserializePuzzlePre(string));
    else if (version == 'v6') return deserializePuzzleV6(deserializePuzzlePre(string));
    else if (version == 'v7') return deserializePuzzleV7(deserializePuzzlePre(string));
    else if (version == 'v8') return deserializePuzzleV8(deserializePuzzlePre(string));
    else if (version == 'v9') return deserializePuzzleV9(deserializePuzzlePre(string));
    else if (version == 'vA') return deserializePuzzleV10(deserializePuzzlePre(string));
    else throw Error('unknown puzzle format');
  }

  function deserializePuzzlePre(string) {
    return atob(derunLength(string).replace(/\./g, '+').replace(/\-/g, '/').replace(/\_/g, '='));
  }

  function deserializePuzzleV10(raw) {
    return deserializePuzzleV8(raw, 2);
  }

  function deserializePuzzleV9(raw) {
    return deserializePuzzleV8(raw, 1);
  }

  function deserializePuzzleV8(raw, plusVersion = 0) {
    let ptr = 0;
    //* header
    let char = readBitSwitch(raw.charCodeAt(ptr + 2) + ((plusVersion > 0) * 0x100));
    let puzzle = new Puzzle(raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), char[5]);
    ptr += 3;
    if (char[0]) puzzle.disableFlash = true;
    if (char[1]) puzzle.optional = true;
    if (char[2]) puzzle.symmetry = { 'x': char[3], 'y': char[4] };
    if (char[6]) puzzle.jerrymandering = true;
    if (plusVersion && char[7]) puzzle.statuscoloring = true;
    puzzle.sols = raw.charCodeAt(ptr);
    ptr++;
    puzzle.transform.translate = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true), byteToInt(raw.slice(ptr + 8, ptr + 12), true)];
    ptr += 12;
    puzzle.transform.rotate = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true), byteToInt(raw.slice(ptr + 8, ptr + 12), true)];
    ptr += 12;
    puzzle.transform.scale = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true)];
    ptr += 8;
    puzzle.transform.skew = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true)];
    ptr += 8;
    puzzle.endDest = [raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), raw.charCodeAt(ptr + 2)];
    ptr += 3;
    //* style
    for (const entry of ['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary']) {
      char = byteToInt(raw.slice(ptr, ptr + 4));
      puzzle.theme[entry] = char;
      ptr += 4;
    }
    [puzzle, ptr] = deserializePuzzleV4Core(raw, ptr, puzzle, 1 + plusVersion);
    //* image
    let urls = raw.slice(ptr).split('\0');
    for (let i = 0; i < ['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'].length; i++)
      if (urls[i]?.length) puzzle.image[['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'][i]] = urls[i];
    window.puzzle = puzzle;
    applyTheme(puzzle);
    applyImage(puzzle);
    return puzzle;
  }

  function deserializePuzzleV7(raw) {
    let ptr = 0;
    //* header
    let char = readBitSwitch(raw.charCodeAt(ptr + 2));
    let puzzle = new Puzzle(raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), char[5]);
    ptr += 3;
    if (char[0]) puzzle.disableFlash = true;
    if (char[1]) puzzle.optional = true;
    if (char[2]) puzzle.symmetry = { 'x': char[3], 'y': char[4] };
    puzzle.sols = raw.charCodeAt(ptr);
    ptr++;
    puzzle.transform.translate = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true), byteToInt(raw.slice(ptr + 8, ptr + 12), true)];
    ptr += 12;
    puzzle.transform.rotate = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true), byteToInt(raw.slice(ptr + 8, ptr + 12), true)];
    ptr += 12;
    puzzle.transform.scale = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true)];
    ptr += 8;
    puzzle.transform.skew = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true)];
    ptr += 8;
    puzzle.endDest = [raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), raw.charCodeAt(ptr + 2)];
    ptr += 3;
    //* style
    for (const entry of ['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary']) {
      char = byteToInt(raw.slice(ptr, ptr + 4));
      puzzle.theme[entry] = char;
      ptr += 4;
    }
    [puzzle, ptr] = deserializePuzzleV4Core(raw, ptr, puzzle);
    //* image
    let urls = raw.slice(ptr).split('\0');
    for (let i = 0; i < ['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'].length; i++)
      if (urls[i]?.length) puzzle.image[['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'][i]] = urls[i];
    window.puzzle = puzzle;
    applyTheme(puzzle);
    applyImage(puzzle);
    return puzzle;
  }

  function deserializePuzzleV6(raw) {
    let ptr = 0;
    //* header
    let char = readBitSwitch(raw.charCodeAt(ptr + 2));
    let puzzle = new Puzzle(raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), char[5]);
    ptr += 3;
    if (char[0]) puzzle.disableFlash = true;
    if (char[1]) puzzle.optional = true;
    if (char[2]) puzzle.symmetry = { 'x': char[3], 'y': char[4] };
    puzzle.sols = raw.charCodeAt(ptr);
    ptr++;
    puzzle.transform.translate = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true), byteToInt(raw.slice(ptr + 8, ptr + 12), true)];
    ptr += 12;
    puzzle.transform.rotate = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true), byteToInt(raw.slice(ptr + 8, ptr + 12), true)];
    ptr += 12;
    puzzle.transform.scale = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true)];
    ptr += 8;
    puzzle.transform.skew = [byteToInt(raw.slice(ptr, ptr + 4), true), byteToInt(raw.slice(ptr + 4, ptr + 8), true)];
    ptr += 8;
    puzzle.endDest = [raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), raw.charCodeAt(ptr + 2)];
    ptr += 3;
    //* style
    for (const entry of ['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary']) {
      char = byteToInt(raw.slice(ptr, ptr + 4));
      if ((char & 0xFF000000) === 0) char = ((char << 8 >>> 0) + 0xFF) >>> 0;
      puzzle.theme[entry] = char;
      ptr += 4;
    }
    [puzzle, ptr] = deserializePuzzleV4Core(raw, ptr, puzzle);
    //* image
    let urls = raw.slice(ptr).split('\0');
    for (let i = 0; i < ['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'].length; i++)
      if (urls[i]?.length) puzzle.image[['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'][i]] = urls[i];
    window.puzzle = puzzle;
    applyTheme(puzzle);
    applyImage(puzzle);
    return puzzle;
  }

  function deserializePuzzleV5(raw) {
    let ptr = 0;
    //* header
    let char = readBitSwitch(raw.charCodeAt(ptr + 1));
    let puzzle = new Puzzle(raw.charCodeAt(ptr + 2), raw.charCodeAt(ptr + 3), char[3]);
    puzzle.sols = raw.charCodeAt(ptr);
    ptr += 4;
    if (char[0]) puzzle.symmetry = { 'x': char[1], 'y': char[2] };
    if (char[4]) puzzle.sols = 0;
    if (char[5]) puzzle.disableFlash = true;
    if (char[6]) puzzle.optional = true;
    //* style
    for (const entry of ['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary']) {
      char = byteToInt(raw.slice(ptr, ptr + 4));
      if ((char & 0xFF000000) === 0) char = ((char << 8 >>> 0) + 0xFF) >>> 0;
      puzzle.theme[entry] = char;
      ptr += 4;
    }
    [puzzle, ptr] = deserializePuzzleV4Core(raw, ptr, puzzle);
    //* image
    let urls = raw.slice(ptr).split('\0');
    for (let i = 0; i < ['foreground-image', 'background-image', 'background-music', 'cursor-image', 'veil-image'].length; i++)
      if (urls[i]?.length) puzzle.image[['foreground-image', 'background-image', 'background-music', 'cursor-image', 'veil-image'][i]] = urls[i];
    window.puzzle = puzzle;
    applyTheme(puzzle);
    applyImage(puzzle);
    return puzzle;
  }

  function deserializePuzzleV4(raw) {
    //* header
    let char = readBitSwitch(raw.charCodeAt(1));
    let puzzle = new Puzzle(raw.charCodeAt(2), raw.charCodeAt(3), char[3]);
    puzzle.sols = raw.charCodeAt(0);
    if (char[0]) puzzle.symmetry = { 'x': char[1], 'y': char[2] };
    if (char[4]) puzzle.sols = 0;
    if (char[5]) puzzle.disableFlash = true;
    if (char[6]) puzzle.optional = true;
    let ptr = 4;
    [puzzle, ptr] = deserializePuzzleV4Core(raw, ptr, puzzle);
    //* style
    for (const entry of ['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary']) {
      char = byteToInt(raw.slice(ptr, ptr + 4));
      if ((char & 0xFF000000) === 0) char = ((char << 8 >>> 0) + 0xFF) >>> 0;
      puzzle.theme[entry] = char;
      ptr += 4;
    }
    //* image
    let urls = raw.slice(ptr).split('\0');
    for (let i = 0; i < ['foreground-image', 'background-image', 'background-music', 'cursor-image', 'veil-image'].length; i++)
      if (urls[i]?.length) puzzle.image[['foreground-image', 'background-image', 'background-music', 'cursor-image', 'veil-image'][i]] = urls[i];
    window.puzzle = puzzle;
    applyTheme(puzzle);
    applyImage(puzzle);
    return puzzle;
  }

  function deserializePuzzleV4Core(raw, ptr, puzzle, altStart = 0) {
    //* defaults
    let defCorner = raw.charCodeAt(ptr);
    if (defCorner) for (let i = 0; i < puzzle.width / 2; i++) for (let j = 0; j < puzzle.height / 2; j++) puzzle.grid[i * 2][j * 2] = cornerData(defCorner, 0, altStart);
    ptr++;
    let defCell = raw.charCodeAt(ptr);
    if (defCell) {
      ptr++;
      let temp = cellData(defCell, raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), raw.charCodeAt(ptr + 2));
      for (let i = 0; i < puzzle.width / 2; i++) for (let j = 0; j < puzzle.height / 2; j++) {
        if (puzzle.grid[i * 2 + 1]?.[j * 2 + 1] === undefined) continue;
        puzzle.grid[i * 2 + 1][j * 2 + 1] = temp[0];
      }
      ptr += temp[1];
    }
    ptr++;
    //* corners
    let x = [], y = [];
    let lenCorner = shortToInt(raw.slice(ptr, ptr + 2));
    ptr += 2;
    for (let i = 0; i < lenCorner; i++) { y.push(raw.charCodeAt(ptr)); ptr++; }
    for (let i = 0; i < lenCorner; i++) { x.push(raw.charCodeAt(ptr)); ptr++; }
    for (let i = 0; i < lenCorner; i++) {
      puzzle.grid[y[i]][x[i]] = cornerData(raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), altStart);
      ptr += 2;
    }
    //* soundData
    puzzle.soundDots = [];
    let lenSoundDots = raw.charCodeAt(ptr);
    ptr++;
    for (let i = 0; i < lenSoundDots; i++) {
      puzzle.soundDots.push(raw.charCodeAt(ptr));
      ptr++;
    }
    //* cells
    x = []; y = [];
    let lenCell = shortToInt(raw.slice(ptr, ptr + 2));
    ptr += 2;
    for (let i = 0; i < lenCell; i++) { y.push(raw.charCodeAt(ptr)); ptr++; }
    for (let i = 0; i < lenCell; i++) { x.push(raw.charCodeAt(ptr)); ptr++; }
    for (let i = 0; i < lenCell; i++) {
      let temp = cellData(raw.charCodeAt(ptr), raw.charCodeAt(ptr + 1), raw.charCodeAt(ptr + 2), raw.charCodeAt(ptr + 3));
      puzzle.grid[y[i] * 2 + 1][x[i] * 2 + 1] = temp[0];
      ptr += 2 + temp[1];
    }
    return [puzzle, ptr];
  }

  function cellData(type, color, data1, data2) {
    if (!type) return [null, -1];
    let ret = { 'type': symbols[type - 2], 'color': color };
    switch (ret.type) {
      case 'scaler':
      case 'swirl':
      case 'fulcrum':
        ret.flip = !!data1;
        return [ret, 1];
      case 'arrow':
      case 'dart':
        ret.rot = data1 & 0x7;
        data1 >>= 3;
      case 'triangle':
      case 'atriangle':
      case 'divdiamond':
      case 'dice':
      case 'crystal':
      case 'eye':
      case 'drop':
      case 'bell':
        ret.count = data1;
        return [ret, 1];
      //       ret.flip = !!((data1 - 1) >> 2);
      //       ret.count = data1 % 4;
      //       return [ret, 1];
      case 'poly':
      case 'ylop':
      case 'polynt':
      case 'xvmino':
      case '!poly':
      case '!ylop':
      case '!polynt':
      case '!xvmino':
        ret.polyshape = (data1 << 8 >>> 0) | data2;
        if (ret.type[0] == '!') {
          ret.type = ret.type.slice(1);
          ret.polyshape |= 1048576;
        }
        return [ret, 2];
      default:
        return [ret, 0];
    }
  }

  function cornerData(dot, start, altStart = 0) {
    let ret = { 'type': 'line' };
    switch (altStart) {
      case 3:
        ret.start = div(dot, 86);
        if (!ret.start) delete ret.start;
        ret.dot = dot % 86;
        if (ret.dot !== 0) ret.dot -= 29;
        else delete ret.dot;
        if (start & 0x7) ret.end = endEnum[(start & 0x7) - 1];
        if ((start & 0x1F) >> 3) ret.endType = ((start & 0x1F) >> 3);
        if (start >> 5) ret.gap = (start >> 5);
        break;
      default:
        if (dot) {
          if (altStart >= 2) {
            ret.endType = (dot >> 6);
            if (dot & 0x3F) ret.dot = (dot & 0x3F) - 29;
          }
          else ret.dot = dot - 29;
        }
        if (altStart) {
          if ((start & 0xF) % 5) ret.end = endEnum[((start & 0xF) % 5) - 1];
          if (div(start & 0xF, 5)) ret.start = div(start & 0xF, 5);
        } else {
          if (start & 0x7) ret.end = endEnum[(start & 0x7) - 1]
          if ((start & 0xF) >> 3) ret.start = true;
        }
        if (altStart >= 2 && (start >> 4)) ret.gap = (start >> 4);
        else if (altStart < 2 && ((start & 0x3F) >> 4)) ret.gap = ((start & 0x3F) >> 4);
        if (altStart < 2 && start >> 6) ret.endType = (start >> 6);
        break;
    }
    return ret;
  }

  function deserializePuzzleV3(raw) {
    return deserializePuzzleV2(raw.slice(1), raw.charCodeAt(0));
  }

  function deserializePuzzleV2(raw, sols = 1) {
    let i = 2;
    let char = readBitSwitch(raw.charCodeAt(i));
    let puzzle = new Puzzle(raw.charCodeAt(0), raw.charCodeAt(1), char[3]);
    puzzle.sols = sols;
    if (char[0]) puzzle.symmetry = { 'x': char[1], 'y': char[2] };
    let x = -1; y = 0;
    while (true) {
      x++;
      if (x == puzzle.width) {
        x = 0; y++;
      }
      i++; char = raw.charCodeAt(i);
      if (char == 0xff) break;
      let cell = {};
      if (x % 2 == 0 || y % 2 == 0) { // line
        cell.type = 'line';
        if (char == 0x00) continue;
        // read additional data
        let dot = 6 - char
        if (dot) cell.dot = dot;
        i++; char = raw.charCodeAt(i);
        if (char >= 10) cell.gap = Math.floor(char / 10); char %= 10;
        if (char >= 5) cell.start = !!(Math.floor(char / 5)); char %= 5;
        if (char) cell.end = endEnum[char - 1];
        puzzle.grid[x][y] = cell;
        continue;
      }
      if (char == 0x00) {
        puzzle.grid[x][y] = null;
        continue;
      }
      cell.type = symbols[char - 1];
      i++;
      cell.color = symbolColors.indexOf('#' + Number(byteToInt(raw.slice(i, i + 4))).toString(16).padStart(8, '0'));
      i += 4; char = raw.charCodeAt(i);
      switch (cell.type) {
        case 'arrow':
        case 'dart':
          cell.rot = char % 8; char = Math.floor(char / 8);
        case 'triangle':
        case 'atriangle':
        case 'divdiamond':
          cell.count = char;
          break;
        case 'scaler':
        case 'swirl':
        case 'fulcrum':
          cell.flip = !!char;
          break;
        case 'poly':
        case 'ylop':
        case 'polynt':
          cell.polyshape = byteToInt(raw.slice(i, i + 4));
          i += 3;
          break;
        default:
          i--;
          break;
      }
      puzzle.grid[x][y] = cell;
    }
    for (const entry of ['background', 'outer', 'inner', 'text', 'line-undone', 'line-default', 'line-success', 'line-primary', 'line-secondary']) {
      char = byteToInt(raw.slice(i + 1, i + 5));
      if ((char & 0xFF000000) === 0) char = (char << 8 >>> 0) + 0xFF;
      puzzle.theme[entry] = char;
      i += 4;
    }
    i++;
    let entry = raw.slice(i).split('\u00ff')
    puzzle.image = {};
    puzzle.image['background-image'] = (entry[0]?.length ? entry[0] : null);
    puzzle.image['foreground-image'] = (entry[1]?.length ? entry[1] : null);
    window.puzzle = puzzle;
    applyTheme(puzzle);
    applyImage(puzzle);
    return puzzle;
  }

  const base = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzゝぁあぃいぅうぇえぉおゕかきくゖけこさしすせそたちっつてとなにぬねのはひふへほまみむめもゃやゅゆょよらりるれろゎわゐゑをんヽァアィイゥウェエォオヵカキㇰクヶケコサㇱシㇲスセソタチッツテㇳトナニㇴヌネノㇵハㇶヒㇷフㇸヘㇹホマミㇺムメモャヤュユョヨㇻラㇼリㇽルㇾレㇿロヮワヰヱヲンㄅㆠㄆㆴㄇㄈㄪㄉㄊㆵㄋㄌㄍㆣㄎㆶㄫㆭㄏㆷㄐㆢㄑㄒㄬㄓㄔㄕㄖㄗㆡㄘㄙㄚㆩㄛㆧㆦㄜㄝㆤㆥㄞㆮㄟㄠㆯㄡㄢㄣㄤㆲㄥㆰㆱㆬㄦㄧㆪㆳㄨㆫㆨㄩæɓƃƈđɖɗƌðǝəɛƒǥɠɣƣƕħıɨɩƙłƚɲƞŋœøɔɵȣƥʀʃŧƭʈɯʊʋƴƶȥʒƹȝþƿƨƽƅʔɐɑɒʙƀɕʣʥʤɘɚɜɝɞʚɤʩɡɢʛʜɦɧɪʝɟʄʞʪʫʟɫɬɭɮƛʎɱɴɳɶɷɸʠĸɹɺɻɼɽɾɿʁʂƪʅʆʨƾʦʧƫʇʉɥɰʌʍʏƍʐʑƺʓƻʕʡʢʖǀǁǂǃʗʘʬʭαβγδεϝϛζηθικλμνξοπϟϙρστυφχψωϡϳϗаәӕбвгґғҕдԁђԃҙеєжҗзԅѕӡԇиҋіјкқӄҡҟҝлӆљԉмӎнӊңӈҥњԋоөпҧҁрҏсԍҫтԏҭћуүұѹфхҳһѡѿѽѻцҵчҷӌҹҽҿџшщъыьҍѣэюяѥѧѫѩѭѯѱѳѵҩӀ҃҄҅҆֊ᐁᐂᐃᐄᐅᐆᐇᐈᐉᐊᐋᐌᐍᐎᐏᐐᐑᐒᐓᐔᐕᐖᐗᐘᐙᐚᐛᐜᐝᐞᐟᐠᐡᐢᐣᐤᐥᐦᐧᐨᐩᐪᐫᐬᐭᐮᐯᐰᐱᐲᐳᐴᐵᐶᐷᐸᐹᐺᐻᐼᐽᐾᐿᑀᑁᑂᑃᑄᑅᑆᑇᑈᑉᑊᑋᑌᑍᑎᑏᑐᑑᑒᑓᑔᑕᑖᑗᑘᑙᑚᑛᑜᑝᑞᑟᑠᑡᑢᑣᑤᑥᑦᑧᑨᑩᑪᑫᑬᑭᑮᑯᑰᑱᑲᑳᑴᑵᑶᑷᑸᑹᑺᑻᑼᑽᑾᑿᒀᒁᒂᒃᒄᒅᒆᒇᒈᒉᒊᒋᒌᒍᒎᒏᒐᒑᒒᒓᒔᒕᒖᒗᒘᒙᒚᒛᒜᒝᒞᒟᒠᒡᒢᒣᒤᒥᒦᒧᒨᒩᒪᒫᒬᒭᒮᒯᒰᒱᒲᒳᒴᒵᒶᒷᒸᒹᒺᒻᒼᒽᒾᒿᓀᓁᓂᓃᓄᓅᓆᓇᓈᓉᓊᓋᓌᓍᓎᓏᓐᓑᓒᓓᓔᓕᓖᓗᓘᓙᓚᓛᓜᓝᓞᓟᓠᓡᓢᓣᓤᓥᓦᓧᓨᓩᓪᓫᓬᓭᓮᓯᓰᓱᓲᓳᓴᓵᓶᓷᓸᓹᓺᓻᓼᓽᓾᓿᔀᔁᔂᔃᔄᔅᔆᔇᔈᔉᔊᔋᔌᔍᔎᔏᔐᔑᔒᔓᔔᔕᔖᔗᔘᔙᔚᔛᔜᔝᔞᔟᔠᔡᔢᔣᔤᔥᔦᔧᔨᔩᔪᔫᔬᔭᔮᔯᔰᔱᔲᔳᔴᔵᔶᔷᔸᔹᔺᔻᔼᔽᔾᔿᕀᕁᕂᕃᕄᕅᕆᕇᕈᕉᕊᕋᕌᕍᕎᕏᕐᕑᕒᕓᕔᕕᕖᕗᕘᕙᕚᕛᕜᕝᕞᕟᕠᕡᕢᕣᕤᕥᕦᕧᕨᕩᕪᕫᕬᕭᕮᕯᕰᕱᕲᕳᕴᕵᕶᕷᕸᕹᕺᕻᕽᙯᕾᕿᖀᖁᖂᖃᖄᖅᖆᖇᖈᖉᖊᖋᖌᖍᙰᖎᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖗᖘᖙᖚᖛᖜᖝᖞᖟᖠᖡᖢᖣᖤᖥᖦᕼᖧᖨᖩᖪᖫᖬᖭᖮᖯᖰᖱᖲᖳᖴᖵᖶᖷᖸᖹᖺᖻᖼᖽᖾᖿᗀᗁᗂᗃᗄᗅᗆᗇᗈᗉᗊᗋᗌᗍᗎᗏᗐᗑᗒᗓᗔᗕᗖᗗᗘᗙᗚᗛᗜᗝᗞᗟᗠᗡᗢᗣᗤᗥᗦᗧᗨᗩᗪᗫᗬᗭᗮᗯᗰᗱᗲᗳᗴᗵᗶᗷᗸᗹᗺᗻᗼᗽᗾᗿᘀᘁᘂᘃᘄᘅᘆᘇᘈᘉᘊᘋᘌᘍᘎᘏᘐᘑᘒᘓᘔᘕᘖᘗᘘᘙᘚᘛᘜᘝᘞᘟᘠᘡᘢᘣᘤᘥᘦᘧᘨᘩᘪᘫᘬᘭᘮᘯᘰᘱᘲᘳᘴᘵᘶᘷᘸᘹᘺᘻᘼᘽᘾᘿᙀᙁᙂᙃᙄᙅᙆᙇᙈᙉᙊᙋᙌᙍᙎᙏᙐᙑᙒᙓᙔᙕᙖᙗᙘᙙᙚᙛᙜᙝᙞᙟᙠᙡᙢᙣᙤᙥᙦᙧᙨᙩᙪᙫᙬᚁᚂᚃᚄᚅᚆᚇᚈᚉᚊᚋᚌᚍᚎᚏᚐᚑᚒᚓᚔᚕᚖᚗᚘᚙᚚᚠᚡᚢᚤᚥᚦᚧᛰᚨᚩᚬᚭᚮᚯᚰᚱᚲᚳᚴᚵᚶᚷᚹᛩᚺᚻᚼᚽᚾᚿᛀᛁᛂᛃᛄᛅᛆᛮᛇᛈᛕᛉᛊᛋᛪᛌᛍᛎᛏᛐᛑᛒᛓᛔᛖᛗᛘᛙᛯᛚᛛᛜᛝᛞᛟᚪᚫᚣᛠᛣᚸᛤᛡᛢᛥᛦᛧᛨ᠐᠑᠒᠓᠔᠕᠖᠗᠘᠙ᢀᢁᢂᢃᢄᢅᢆᡃᠠᢇᠡᡄᡝᠢᡅᡞᡳᢈᡟᠣᡆᠤᡇᡡᠥᡈᠦᡉᡠᠧᠨᠩᡊᡢᢊᢛᠪᡋᠫᡌᡦᠬᡍᠭᡎᡤᢚᡥᠮᡏᠯᠰᠱᡧᢜᢝᢢᢤᢥᠲᡐᡨᠳᡑᡩᠴᡒᡱᡜᢋᠵᡓᡪᡷᠶᡕᡲᠷᡵᠸᡖᠹᡫᡶᠺᡗᡣᡴᢉᠻᠼᡔᡮᠽᡯᡘᡬᠾᡙᡭᠿᡀᡁᡂᡚᡛᡰᢌᢞᢍᢎᢟᢏᢐᢘᢠᢑᢡᢒᢓᢨᢔᢣᢕᢙᢖᢗᢦᢧᢩաբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆՙ፩፪፫፬፭፮፯፰፱ሀሁሂሃሄህሆለሉሊላሌልሎሏሐሑሒሓሔሕሖሗመሙሚማሜምሞሟሠሡሢሣሤሥሦሧረሩሪራሬርሮሯሰሱሲሳሴስሶሷሸሹሺሻሼሽሾሿቀቁቂቃቄቅቆቈቊቋቌቍቐቑቒቓቔቕቖቘቚቛቜቝበቡቢባቤብቦቧቨቩቪቫቬቭቮቯተቱቲታቴትቶቷቸቹቺቻቼችቾቿኀኁኂኃኄኅኆኈኊኋኌኍነኑኒናኔንኖኗኘኙኚኛኜኝኞኟአኡኢኣኤእኦኧከኩኪካኬክኮኰኲኳኴኵኸኹኺኻኼኽኾዀዂዃዄዅወዉዊዋዌውዎዐዑዒዓዔዕዖዘዙዚዛዜዝዞዟዠዡዢዣዤዥዦዧየዩዪያዬይዮደዱዲዳዴድዶዷዸዹዺዻዼዽዾዿጀጁጂጃጄጅጆጇገጉጊጋጌግጎጐጒጓጔጕጘጙጚጛጜጝጞጠጡጢጣጤጥጦጧጨጩጪጫጬጭጮጯጰጱጲጳጴጵጶጷጸጹጺጻጼጽጾጿፀፁፂፃፄፅፆፈፉፊፋፌፍፎፏፐፑፒፓፔፕፖፗፘፙፚᎠᎡᎢᎣᎤᎥᎦᎧᎨᎩᎪᎫᎬᎭᎮᎯᎰᎱᎲᎳᎴᎵᎶᎷᎸᎹᎺᎻᎼᎽᎾᎿᏀᏁᏂᏃᏄᏅᏆᏇᏈᏉᏊᏋᏌᏍᏎᏏᏐᏑᏒᏓᏔᏕᏖᏗᏘᏙᏚᏛᏜᏝᏞᏟᏠᏡᏢᏣᏤᏥᏦᏧᏨᏩᏪᏫᏬᏭᏮᏯᏰᏱᏲᏳᏴ𐌀𐌁𐌂𐌃𐌄𐌅𐌆𐌇𐌈𐌉𐌊𐌋𐌌𐌍𐌎𐌏𐌐𐌑𐌒𐌓𐌔𐌕𐌖𐌗𐌘𐌙𐌚𐌛𐌜𐌝𐌞𐌰𐌱𐌲𐌳𐌴𐌵𐌶𐌷𐌸𐌹𐌺𐌻𐌼𐌽𐌾𐌿𐍀𐍁𐍂𐍃𐍄𐍅𐍆𐍇𐍈𐍉𐍊";
  function idn(x) {
    if (x < base.length) return base[x];
    x -= base.length;
    if (x <= 0x2BA3) return String.fromCodePoint(0xAC00 + x); // Hangul Syllable
    x -= 0x2BA4;
    if (x <= 0x19B5) return String.fromCodePoint(0x3400 + x); // CJK Extension A
    x -= 0x19B6;
    if (x <= 0x5145) return String.fromCodePoint(0x4E00 + x); // CJK Ideograph
    x -= 0x5146;
    if (x <= 0x048C) return String.fromCodePoint(0xA000 + x); // Yi Letters
    x -= 0x048D;
    if (x <= 0xA6D6) return String.fromCodePoint(0x20000 + x); // CJK Extension B+
    throw Error('x is over 0xFFFF; WTF?');
  }
  function deidn(x, y) {
    let c = x.charCodeAt(0);
    let isSurrogate = (0xD800 <= c && c <= 0xDFFF);
    if (isSurrogate) c = 0x10000 + ((x.charCodeAt(0) - 0xD800) * 0x400) + (y.charCodeAt(0) - 0xDC00);
    let ret = base.length;
    if (0xAC00 <= c && c <= 0xD7A3) return [ret + c - 0xAC00, isSurrogate];
    ret += 0x2BA4;
    if (0x3400 <= c && c <= 0x4DB5) return [ret + c - 0x3400, isSurrogate];
    ret += 0x19B6;
    if (0x4E00 <= c && c <= 0x9F45) return [ret + c - 0x4E00, isSurrogate];
    ret += 0x5146;
    if (0xA000 <= c && c <= 0xA48C) return [ret + c - 0xA000, isSurrogate];
    ret += 0x048D;
    if (0x20000 <= c && c <= 0x2A6D6) return [ret + c - 0x20000, isSurrogate];
    return [base.indexOf(x), isSurrogate];
  }

  window.zip = function (str, varlen = false) {
    let len = Math.max(...str.map(x => x.length));
    let res = '';
    if (varlen) {
      res += String.fromCharCode(str.length);
      for (let o of str.map(x => x.length)) res += intToShort(o);
    }
    for (let i = 0; i < len; i++) for (let o of str) {
      if (o[i] === undefined) continue;
      res += o[i];
    }
    return res;
  }

  window.unzip = function (str, ptr = 0, zlen = null, len = null) {
    let list = [];
    let lens = [];
    if (zlen === null) {
      zlen = str.charCodeAt(ptr);
      ptr++;
    }
    for (let i = 0; i < zlen; i++) {
      list.push('');
      if (len !== null) lens.push(len);
    }
    if (len === null) {
      for (let i = 0; i < list.length; i++) {
        lens.push(shortToInt(str.slice(ptr, ptr + 2)));
        ptr += 2;
      }
    }
    let m = Math.max(...lens);
    for (let i = 0; i < m; i++) for (let k in list) {
      if (lens[k] > i) {
        list[k] += str[ptr];
        ptr++;
      }
    }
    return [list, ptr];
  }

  function listSparse(list, prop) {
    let total = 0;
    let res = '';
    for (let k in list) if (list[k][prop] !== undefined) {
      total++;
      res += String.fromCharCode(k);
    }
    return String.fromCharCode(total) + res;
  }

  function readSparse(str, ptr) {
    let total = str.charCodeAt(ptr);
    let list = [];
    for (let i = 1; i <= total; i++) list.push(str.charCodeAt(ptr + i));
    return [list, ptr + total + 1];
  }

  function listDense(list, prop) {
    let total = 0;
    let cur = list[0][prop];
    let res = String.fromCharCode(cur);
    for (let k in list) if (list[k][prop] !== cur) {
      cur = list[k][prop];
      res += String.fromCharCode(k, cur);
      total++;
    }
    return String.fromCharCode(total) + res;
  }

  function applyDense(str, ptr, list, prop = null, h = null) {
    if (h === null) {
      h = str.charCodeAt(ptr); ptr++;
    }
    let i = 0, c = str.charCodeAt(ptr);
    ptr++;
    while (h) {
      let newI = str.charCodeAt(ptr), newC = str.charCodeAt(ptr + 1);
      ptr += 2;
      for (; i < newI; i++) {
        if (prop === null) list[i] = c;
        else list[i][prop] = c;
      }
      i = newI; c = newC; h--;
    }
    for (; i < list.length; i++) {
      if (prop === null) list[i] = c;
      else list[i][prop] = c;
    }
    return [list, ptr];
  }

  window.exportSequence = function (rawList, useIDN = false) {
    let list = [...rawList].filter(x => x.length);
    if (!list.length) return '';
    let veri = list[0].indexOf('_');
    let version = list[0].slice(0, veri);
    list = list.map(x => serializePuzzle(deserializePuzzleV10(deserializePuzzlePre(x.slice(veri + 1))), true));
    let ret = (useIDN ? 'vs3i_' : 'vs3_') + version + '_';
    let res = String.fromCharCode(list.length);
    /**
     ** Size: dense
     ** Header: sparse with default ("\u0001\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000d\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000d\u0000\u0000\u0000d\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000")
     ** Theme: dense
     ** DefaultCorner: sparse with default ("\0")
     ** DefaultCell: sparse with default ("\0")
     ** SoundData: sparse with default ("\0")
     ** Corner: unique
     ** Cell: unique
     ** Image: sparse/dense with default (special mode, "")
     */
    let size = [], theme = [], image = [''];
    for (let o of list) {
      if (!size.includes(o.size)) size.push(o.size);
      o.size = size.indexOf(o.size);
      if (o.header === "\u0001\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000d\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000d\u0000\u0000\u0000d\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000") delete o.header;
      if (!theme.includes(o.theme)) theme.push(o.theme);
      o.theme = theme.indexOf(o.theme);
      if (o.defaultCorner === "\0") delete o.defaultCorner;
      if (o.defaultCell === "\0") delete o.defaultCell;
      if (o.soundData === "\0") delete o.soundData;
      for (let k in o.image) {
        if (!image.includes(o.image[k])) image.push(o.image[k]);
        o.image[k] = image.indexOf(o.image[k]);
      }
      if (!o.image.length) delete o.image;
    }
    //* encode
    res += listDense(list, 'size');
    res += listSparse(list, 'header') + zip(list.filter(x => x.header !== undefined).map(x => x.header));
    res += listDense(list, 'theme');
    res += listSparse(list, 'defaultCorner') + zip(list.filter(x => x.defaultCorner !== undefined).map(x => x.defaultCorner));
    res += listSparse(list, 'defaultCell') + zip(list.filter(x => x.defaultCell !== undefined).map(x => x.defaultCell), true).slice(1);
    res += listSparse(list, 'soundData') + zip(list.filter(x => x.soundData !== undefined).map(x => x.soundData), true).slice(1);
    res += zip(list.map(x => x.corner), true).slice(1);
    res += zip(list.map(x => x.cell), true).slice(1);
    for (let i = 0; i < ['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'].length; i++) {
      let temp = '';
      let total = 0;
      for (let k in list) if (list[k].image?.[i]) {
        total++;
        temp += String.fromCharCode(k, list[k].image[i]);
      }
      res += String.fromCharCode(total) + temp;
    }
    res += zip(size);
    res += zip(theme);
    res += zip(image.slice(1), true).slice(1);
    console.info('encoding', res.length, 'bytes of data...');
    // post
    if (useIDN) {
      for (let i = 0; i < res.length; i += 2) {
        ret += idn((isNaN(res.charCodeAt(i)) ? 0 : res.charCodeAt(i) << 8) + (isNaN(res.charCodeAt(i + 1)) ? 0 : res.charCodeAt(i + 1)));
      }
      ret = runLengthV2(ret);
    }
    else {
      ret += runLengthV2(btoa(res).replace(/\+/g, '.').replace(/\//g, '-').replace(/\=/g, '_'));
    }
    return ret;
  }

  window.importSequence = function (string) {
    if (!string.length) return [''];
    let veri = string.indexOf('_');
    let version = string.slice(0, veri);
    string = string.slice(veri + 1);
    if (version == 'vs1') return importSequenceV1(string);
    else if (version == 'vs2') return importSequenceV2(string);
    else if (version == 'vs2i') return importSequenceV2I(string);
    else if (version == 'vs3') return importSequenceV2(string, 3);
    else if (version == 'vs3i') return importSequenceV2I(string, 3);
    else throw Error('unknown puzzle format');
  }

  function importSequenceV1(string) {
    let res = string.split('~~');
    return res;
  }

  function importSequenceV2I(string, vs = 2) {
    let veri = string.indexOf('_');
    let version = string.slice(0, veri);
    let str = derunLengthV2(string.slice(veri + 1));
    string = "";
    for (let i = 0; i < str.length; i++) {
      let temp = deidn(str[i], str[i + 1]);
      if (temp[1]) i++;
      string += intToShort(temp[0]);
    }
    if (vs === 3) return importSequenceV3Core(version, string);
    return importSequenceV2Core(version, string);
  }

  function importSequenceV2(string, vs = 2) {
    let veri = string.indexOf('_');
    let version = string.slice(0, veri);
    string = atob(derunLengthV2(string.slice(veri + 1)).replace(/\./g, '+').replace(/\-/g, '/').replace(/\_/g, '='));
    if (vs === 3) return importSequenceV3Core(version, string);
    return importSequenceV2Core(version, string);
  }

  function importSequenceV3Core(version, string) {
    if (version !== 'v6' && version !== 'v7' && version !== 'v8' && version !== 'v9' && version !== 'vA') throw Error('Uh oh! tell prod to update the sequence importer');
    let ptr = 0;
    let puzzles = [];
    for (let i = 0; i < string.charCodeAt(ptr); i++) puzzles.push({});
    ptr++;
    [puzzles, ptr] = applyDense(string, ptr, puzzles, 'size'); puzzles; ptr;
    let headerI, headerC;
    [headerI, ptr] = readSparse(string, ptr); headerI; ptr;
    [headerC, ptr] = unzip(string, ptr, headerI.length, 44); headerC; ptr;
    for (let i = 0; i < headerI.length; i++) puzzles[headerI[i]].header = headerC[i];
    [puzzles, ptr] = applyDense(string, ptr, puzzles, 'theme'); puzzles; ptr;
    let defaultCornerI, defaultCornerC;
    [defaultCornerI, ptr] = readSparse(string, ptr); defaultCornerI; ptr;
    [defaultCornerC, ptr] = unzip(string, ptr, defaultCornerI.length, 1); defaultCornerC; ptr;
    for (let i = 0; i < defaultCornerI.length; i++) puzzles[defaultCornerI[i]].defaultCorner = defaultCornerC[i];
    let defaultCellI, defaultCellC;
    [defaultCellI, ptr] = readSparse(string, ptr); defaultCellI; ptr;
    [defaultCellC, ptr] = unzip(string, ptr, defaultCellI.length); defaultCellC; ptr;
    for (let i = 0; i < defaultCellI.length; i++) puzzles[defaultCellI[i]].defaultCell = defaultCellC[i];
    let soundDataI, soundDataC;
    [soundDataI, ptr] = readSparse(string, ptr); soundDataI; ptr;
    [soundDataC, ptr] = unzip(string, ptr, soundDataI.length); soundDataC; ptr;
    for (let i = 0; i < soundDataI.length; i++) puzzles[soundDataI[i]].soundData = soundDataC[i];
    let corner, cell;
    [corner, ptr] = unzip(string, ptr, puzzles.length); corner; ptr;
    [cell, ptr] = unzip(string, ptr, puzzles.length); cell; ptr;
    for (let i = 0; i < puzzles.length; i++) {
      puzzles[i].corner = corner[i];
      puzzles[i].cell = cell[i];
      puzzles[i].image = [];
    }
    let mimg = 0;
    for (let i = 0; i < ['background-image', 'foreground-image', 'background-music', 'cursor-image', 'veil-image'].length; i++) {
      let len = string.charCodeAt(ptr);
      ptr++
      for (let _ = 0; _ < len; _++) {
        let img = string.charCodeAt(ptr + 1); mimg = Math.max(mimg, img);
        puzzles[string.charCodeAt(ptr)].image[i] = img;
        ptr += 2;
      }
    }
    let size = [], theme = [], image = [];
    [size, ptr] = unzip(string, ptr, Math.max(...puzzles.map(x => x.size)) + 1, 3); size; ptr;
    [theme, ptr] = unzip(string, ptr, Math.max(...puzzles.map(x => x.theme)) + 1, 36); theme; ptr;
    [image, ptr] = unzip(string, ptr, mimg); image; ptr;
    image = ['', ...image];
    for (let i = 0; i < puzzles.length; i++) {
      puzzles[i].size = size[puzzles[i].size];
      if (puzzles[i].header === undefined) puzzles[i].header = "\u0001\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000d\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000d\u0000\u0000\u0000d\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000";
      puzzles[i].theme = theme[puzzles[i].theme];
      if (puzzles[i].defaultCorner === undefined) puzzles[i].defaultCorner = "\0";
      if (puzzles[i].defaultCell === undefined) puzzles[i].defaultCell = "\0";
      if (puzzles[i].soundData === undefined) puzzles[i].soundData = "\0";
      for (let k in puzzles[i].image) {
        puzzles[i].image[k] = image[puzzles[i].image[k] ?? 0];
      }
      puzzles[i] = serializePuzzlePost(puzzles[i], version);
    }
    if (ptr > string.length) throw Error('Invalid String');
    return puzzles
  }

  function importSequenceV2Core(version, string) {
    let ret = [];
    let res = [];
    let ptr = 0;
    let puzzleLen = shortToInt(string.slice(ptr, ptr + 2));
    ptr += 2;
    let lens = [];
    for (let i = 0; i < puzzleLen; i++) {
      ret.push(version + '_')
      res.push('');
      lens.push(shortToInt(string.slice(ptr, ptr + 2)));
      ptr += 2;
    }
    for (let i = 0; i < Math.max(...lens); i++) {
      for (let j = 0; j < puzzleLen; j++) {
        if (i < lens[j]) {
          res[j] += string[ptr];
          ptr++;
        }
      }
    }
    for (let i = 0; i < puzzleLen; i++) ret[i] += runLength(btoa(res[i]).replace(/\+/g, '.').replace(/\//g, '-').replace(/\=/g, '_'));
    return ret;
  }

})
