namespace(function () {

  String.prototype.hashCode = function () {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr = this.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  let puzzles;
  let code;
  let currentPanel, panelNo = 0;
  let solsWrapper, perfectWrapper;
  let sols;
  let perfectActivated = false;
  let solsPerfect;
  let open = [false, false, false];
  let ends;
  const challengeExits = [
    [[-1]], // ?
    [ // M ~ Z
      [ // P ~ S
        [[108], [109], [107]], // seren
        [[113], [120], [112]], // sus
        [[105], [106], [104]], // prod
      ],
      [ // T ~ Z
        [[131], [132], [130]], // Zimodo
        [[128], [129], [124]], // unsuspiciousperson
        [[122], [123], [121]], // TheFullestCircle
      ],
      [ // M ~ P
        [[99], [100], [98]], // Mak
        [[102], [103], [101]], // Prism Ghost
        [[93], [97], [89]], // Maildropfolder
      ],
    ], 
    [ // @ ~ L
      [ // C ~ J
        [[47], [50], [44]], // cheeky
        [[56], [57], [55]], // Just Kirb
        [[53], [54], [51]], // CubeObserver
      ],
      [ // K ~ L
        [[78], [79], [77]], // KF
        [[81], [84], [80]], // Kube
        [[59], [60], [58]], // Katelyn Delta
      ],
      [ // @ ~ A
        [[29], [30], [28]], // "DAVE"
        [[42], [43], [34]], // AnActualCat
        [[32], [33], [31]], // {anonymous}
      ],
    ],
  ];
  let currentChallenge = [];
  const challengeEndpoints = [{'x': 8, 'y': 5}, {'x': 5, 'y': 8}, {'x': 5, 'y': 2}];
  const challengeCode = 1629664635;
  const moonGateCode = 1121140746;
  const vanillaCode = [-1477696510, 969176300];
  function flower(x, y, i=0) {
    return {
      'type': 'flower',
      'width': 58,
      'height': 58,
      'x': x * 41 + 23,
      'y': y * 41 + 23,
      'class': 'flower_' + i,
      'color': HSVtoRGB(Math.random(), 0.2, 1)
    }
  }

  window.onload = loadPlay

  function loadPlay() {
    solsWrapper = document.getElementById('solsWrapper')
    perfectWrapper = document.getElementById('perfectWrapper')
    let toLoad = (new URL(window.location.href).hash);
    code = toLoad.hashCode();
    if (toLoad) {
      puzzles = importSequence(decodeURIComponent(toLoad.slice(1))).map(e => window.deserializePuzzle(e));
      if (!localStorage[code]?.length) localStorage[code] = '\0';
      currentPanel = localStorage[code].length - 1;
      if (code === challengeCode && localStorage['currentChallenge']) currentChallenge = localStorage['currentChallenge'].split('').map(x => Number(x));
      reloadPanel();
    } else window.location.replace(window.NAME + '/'); 
  }

  function sol(id) {
    return document.createRange().createContextualFragment(
      `<div class='sols${(!puzzle.optional && !isNewPanel()) ? ' active' : ''}${typeof (id) == 'string' ? ' perfect' : ''}' id='sols-${id}'></div>`);
  }

  function isNewPanel() {
    return currentPanel === (localStorage[code].length - 1);
  }

  window.isLastPanel = function(type = 0) {
    return puzzles.length <= endDest(type);
  }
  window.isMultiplePanels = function() {
    return puzzles.length > 1;
  }

  window.reloadSymbolTheme = function () {
    draw(window.puzzle)
  }

  function reloadPanel() {
    while (solsWrapper.firstChild) solsWrapper.removeChild(solsWrapper.firstChild);
    while (perfectWrapper.firstChild) perfectWrapper.removeChild(perfectWrapper.firstChild);
    panelNo = localStorage[code].charCodeAt(currentPanel);
    window.puzzle = puzzles[panelNo];
    if (code === moonGateCode) window.puzzle.moongate = true;
    if (puzzle.jerrymandering) solsWrapper.appendChild(document.createRange().createContextualFragment(`<svg id="jerrymandering" viewbox="0 0 15 15" style="width: 15px; height: 15px;"><path fill="var(--text)" d="M 0 4.2 L 12.2 4.2 L 1.6 12 L 6 -0.4 L 10.8 12.2z"></path></svg>`));
    if (puzzle.statuscoloring) solsWrapper.appendChild(document.createRange().createContextualFragment(`<svg id="statuscoloring" viewbox="0 0 15 15" style="width: 15px; height: 15px;"><path fill="var(--text)" d="M9 4A1 1 0 003 4L1 4A1 1 0 0111 4C11 7 7 8 7 10L5 10C5 7 9 7 9 4M6 11A1 1 0 006 13 1 1 0 006 11z"></path></svg>`));
    if (puzzle.sols > 1) {
      sols = new Set();
      for (let i = 0; i < puzzle.sols; i++) solsWrapper.appendChild(sol(i + 1));
    }
    perfectActivated = false;
    if (puzzle.sols == 0) {
      let kinds = Array.from(new Set(puzzle.grid.flat().filter(x => x?.type == 'vtriangle').map(x => x.color)));
      while (kinds.length < 3) kinds.push(-1);
      if (kinds.length == 3) {
        perfectActivated = true;
        solsPerfect = [[kinds[0], kinds[1], kinds[2]], [kinds[0], kinds[2], kinds[1]], [kinds[1], kinds[0], kinds[2]], [kinds[1], kinds[2], kinds[0]], [kinds[2], kinds[0], kinds[1]], [kinds[2], kinds[1], kinds[0]]];
        solsPerfect = Array.from(new Set(solsPerfect.map(x => x.join('-'))));
        for (let o of solsPerfect) document.getElementById('perfectWrapper').appendChild(sol(o));
      }
    }
    open = [false, false, false];
    ends = new Set();
    if (puzzle.optional) levelUp();
    for (let i = 0; i < 3; i++) if (endDest(i) === localStorage[code].charCodeAt(currentPanel + 1)) levelUp(i);
    // apply
    let svg = document.getElementById('puzzle')
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    draw(window.puzzle)
    window.clearAnimations();
    applyTheme(puzzle);
    applyImage(puzzle);
    if (puzzle.moongate) for (let q of [
      [0,0],[2,0],[4,0],
      [0,2],[2,2],[4,2],[6,2],
      [0,4],[2,4],[4,4],[6,4],[8,4],
            [2,6],[4,6],[6,6],[8,6],
                  [4,8],[6,8],[8,8],
    ]) if (Math.random() < 0.5) drawSymbolWithSvg(document.getElementById('puzzle'), flower(q[0]*2, q[1]*2));
    if (currentPanel <= 3 && code === challengeCode) { // challenge
      let _q = challengeExits;
      for (let q of currentChallenge) _q = _q[q];
      main: for (let i = 0; i < 3; i++) {
        for (let exit of _q[i].flat()) if (localStorage[code + '_' + exit] === undefined) continue main;
        drawSymbolWithSvg(document.getElementById('puzzle'), flower(challengeEndpoints[i].x, challengeEndpoints[i].y, i))
      }
    }
    else if (localStorage[`${code}_${panelNo}`])
      window.setPath(window.puzzle, localStorage[`${code}_${panelNo}`]);
    updateArrows();
  }

  window.onSolvedPuzzle = function (paths) {
    if (puzzle.moongate) {
      let pth = puzzle.path.slice(1).filter((_, index) => !(index % 4)).map(x => ['', 'l', 'r', 'u', 'd'][x]).join('')
      switch (pth) {
        case "rdrdldrrurdd":
        case "rddrurddldrr":
        case "drrdldrrurdd":
        case "drdrurddldrr":
          window.location.href = window.NAME + '/#vs3_vA_AQ~~BAN4ANw~~8A~2EBAQECAgICAwMEBAUFBgYHBwgI~2CQkJCQ~2oKCg~2sLCws~2MDAwBAwUHCQsAAgQGCAoMAQQGCwAMAQsADAELAAwBCwACBAYICgwBAwUHCQsAAgQGCAoMAQMFBwkLAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQFYAAAMAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAHgAHAQECAgMDAwEEAgMBAgQJAwkACQAJAwkACQMJAAABAAEAAAAGBgAgICD-P0BA-6Wqqf-Q39n-fYB--7a-vP~~6-iP~~6-Iv8AYmh0dHBzOi8vcHJvZHpwb2QuZ2l0aHViLmlvL3dpdG5lc3MvZGF0YS9kaXNjb3JkLzUxNTY3ODgyMTQwODU3MTM5Ml85OTgzMzk5MDUzNDIxNDg2NjhfaW1hZ2VfNjAucG5n'
          break;
        case "rdldrdruurdrdd":
          window.location.href = window.NAME + '/challenge.html'
          break;
      }
    }
    if (vanillaCode.includes(code) && puzzle.getCell(puzzle.endPoint.x, puzzle.endPoint.y).endType == 1) {
      localStorage[vanillaCode[0] + '_8'] = "\u0006\u0002Z\u0015";
      localStorage[vanillaCode[1] + '_3'] = "\u0002\u0002U\u001a";
      window.location.href = "https://store.steampowered.com/app/210970/The_Witness/";
    }
    let dir = pathsToDir(puzzle.path);
    if (puzzle.optional || isNewPanel()) {
      if (puzzle.sols > 1) {
        sols.add(dir);
        document.getElementById('sols-' + sols.size).classList.add('active');
      }
      let vr = puzzle.vtriangleResult?.join('-');
      if (perfectActivated && solsPerfect.includes(vr)) {
        solsPerfect.splice(solsPerfect.indexOf(vr), 1);
        document.getElementById('sols-' + vr).classList.add('active');
      }
      ends.add((puzzle.getCell(puzzle.endPoint.x, puzzle.endPoint.y).endType) ?? 0)
      if (((sols?.size ?? 1) >= puzzle.sols) && (!perfectActivated || !solsPerfect.length)) for (let o of Array.from(ends)) levelUp(o);
    } else levelUp(puzzle.getCell(puzzle.endPoint.x, puzzle.endPoint.y).endType ?? 0);
    localStorage[`${code}_${panelNo}`] = dir;
  }

  function levelUp(type = -1) {
    if (type === -1) { levelUp(0); levelUp(1); levelUp(2); return; }
    if (isNewPanel() && !isLastPanel(type) && (endDest(type) != panelNo)) {
      localStorage[code] += String.fromCharCode(endDest(type));
      if (code === challengeCode) localStorage['currentChallenge'] = currentChallenge.join('') + type;
    }
    if (!isLastPanel(type) && (endDest(type) != panelNo)) {
      open[type] = true;
      for (let i = 0; i < type; i++) if (endDest(type) === endDest(i)) {
        open[type] = false;
      }
    }
    updateArrows();
  }

  function endDest(type) {
    return (puzzle.endDest[type] === 0) ? (panelNo + 1) : (puzzle.endDest[type] - 1);
  }

  function updateArrows() {
    if (currentPanel == 0) document.getElementById('prev').setAttribute('style', 'opacity: 0;');
    else document.getElementById('prev').setAttribute('style', 'opacity: 1;');

    const ids = ['next', 'nextB', 'nextC']
    for (let i = 0; i < 3; i++) {
      if (open[i]) document.getElementById(ids[i]).setAttribute('style', 'opacity: 1;');
      else document.getElementById(ids[i]).setAttribute('style', 'opacity: 0;');
    }
  }

  window.getNext = function (type = 0) {
    if (!open[type]) return;
    if (endDest(type) !== localStorage[code].charCodeAt(currentPanel + 1)) {
      localStorage[code] = localStorage[code].slice(0, currentPanel + 1) + String.fromCharCode(endDest(type));
      if (code === challengeCode) localStorage['currentChallenge'] = currentChallenge.join('') + type;
    }
    currentPanel++;
    if (code === challengeCode) currentChallenge.push(type);
    reloadPanel();
  }

  window.getPrev = function () {
    if (currentPanel == 0) return;
    currentPanel--;
    if (code === challengeCode) currentChallenge.pop();
    reloadPanel();
  }

  window.reloadSymbolTheme = function () {
    reloadPanel();
}

  // Keyboard navigation between panels
  document.onkeydown = keyNav;
  function keyNav(event) {
    event = event || window.event;

    // Left keypress, move to previous panel
    if (event.keyCode == '37') {
      getPrev();
    }
    // Right keypress, move to next panel A
    else if (event.keyCode == '39') {
      getNext(0);
    }
    // Down keypress, move to next panel B
    else if (event.keyCode == '40') {
      getNext(1);
    }
    // Up keypress, move to next panel C
    else if (event.keyCode == '38') {
      getNext(2);
    }
  }

  function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}${(Math.round(Math.random() * 128) + 127).toString(16).padStart(2, '0')}`;
}

});
