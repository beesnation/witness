namespace(function () {

  window.createElement = function (type) {
    return document.createElementNS('http://www.w3.org/2000/svg', type)
  }

  window.drawSymbol = function (params) {
    let svg = createElement('svg')
    svg.setAttribute('viewBox', '0 0 ' + params.width + ' ' + params.height)
    if (!params.x) params.x = 0
    if (!params.y) params.y = 0
    drawSymbolWithSvg(svg, params)
    return svg
  }

  function mx(params) { return params.width / 2 + params.x; }
  function my(params) { return params.height / 2 + params.y; }

  function setAttr(thing, params) {
    thing.setAttribute('fill', (window.symbolColors[params.color] ?? params.color) || '#000000ff')
    if (params.class !== undefined) thing.setAttribute('class', params.class)
    thing.setAttribute('transform', 'translate(' + mx(params) + ', ' + my(params) + ')')
    if (params.stroke !== undefined) thing.setAttribute('stroke', params.stroke)
    if (params.strokeWidth !== undefined) thing.setAttribute('stroke-width', params.strokeWidth)
    thing.style.pointerEvents = 'none';
  }

  function simplePoly(svg, params, path) {
    let elem = createElement('polygon')
    svg.appendChild(elem)
    setAttr(elem, params)
    elem.setAttribute('points', path)
    return elem
  }

  function simplePath(svg, params, path) {
    let elem = createElement('path')
    svg.appendChild(elem)
    setAttr(elem, params)
    elem.setAttribute('d', path + 'z')
    return elem
  }

  function simpleLine(svg, params, length, thickness, r) {
    let l = createElement('rect')
    svg.appendChild(l)
    setAttr(l, params)
    l.setAttribute('x', mx(params) - (thickness / 2))
    l.setAttribute('y', my(params))
    l.setAttribute('width', thickness);
    l.setAttribute('height', length);
    l.setAttribute('transform', 'rotate(' + r + ', ' + mx(params) + ', ' + my(params) + ')')
    return l
  }

  function simpleDot(svg, params, x, y) {
    let circ = createElement('circle')
    svg.appendChild(circ)
    setAttr(circ, params)
    circ.setAttribute('r', 3);
    circ.setAttribute('cx', x);
    circ.setAttribute('cy', y);
    return circ;
  }

  //********************** REPEAT-FUNCTIONS **********************//

  function drawPolyomino(svg, params, size, space, yoffset, path) {
    if (params.polyshape === 0) return
    let polyomino = window.polyominoFromPolyshape(params.polyshape)
    let bounds = { 'xmin': 0, 'xmax': 0, 'ymin': 0, 'ymax': 0 }
    for (var i = 0; i < polyomino.length; i++) {
      let pos = polyomino[i]
      bounds.xmin = Math.min(bounds.xmin, pos.x)
      bounds.xmax = Math.max(bounds.xmax, pos.x)
      bounds.ymin = Math.min(bounds.ymin, pos.y)
      bounds.ymax = Math.max(bounds.ymax, pos.y)
    }
    let offset = (size + space) / 2 // Offset between elements to create the gap
    let centerX = (params.width - size - offset * (bounds.xmax + bounds.xmin)) / 2 + params.x
    let centerY = (params.height - size - offset * (bounds.ymax + bounds.ymin)) / 2 + params.y

    for (var i = 0; i < polyomino.length; i++) {
      let pos = polyomino[i]
      if (pos.x % 2 !== 0 || pos.y % 2 !== 0) continue;
      let poly = createElement('polygon')
      svg.appendChild(poly)
      poly.setAttribute('points', path)
      let transform = '';
      if (window.isRotated(params.polyshape)) // -30 degree rotation around the midpoint of the square
        transform = 'rotate(-30, ' + mx(params) + ', ' + my(params) + ') '
      transform += 'translate(' + (centerX + pos.x * offset) + ', ' + (centerY + pos.y * offset + yoffset) + ')'
      setAttr(poly, params)
      poly.setAttribute('transform', transform)
    }
  }

  const triangleDistributions = [
    [],
    [1],
    [2],
    [3],
    [2, 2],
    [2, 3],
    [3, 3],
    [2, 3, 2],
    [3, 2, 3],
    [3, 3, 3]
  ]

  function triangleSingle(svg, params, xoffset, yoffset) {
    let path = createElement('path')
    svg.appendChild(path)
    path.setAttribute('d', 'M -7 7 Q -9.1 7 -7.9 5 L -1 -6 Q 0 -7.7 1 -6 L 7.9 5 Q 9.1 7 7 7 z')
    setAttr(path, params)
    path.setAttribute('transform', 'translate(' + (mx(params) + xoffset) + ', ' + (my(params) + yoffset) + ')')
    return path;
  }

  function onebyone(svg, params, xoffset, yoffset) {
    let hex = createElement('polygon')
    svg.appendChild(hex)
    setAttr(hex, params)
    hex.setAttribute('points', '7.07 0, 0 7.07, -7.07 0, 0 -7.07')
    hex.setAttribute('transform', 'translate(' + (mx(params) + xoffset) + ', ' + (my(params) + yoffset) + ')')
    return hex;
  }

  function enobyeno(svg, params, xoffset, yoffset) {
    let hex = createElement('polygon')
    svg.appendChild(hex)
    setAttr(hex, params)
    hex.setAttribute('points', '8.49 0, 0 8.49, -8.49 0, 0 -8.49, 8.49 0, 4.24 0, 0 -4.24, -4.24 0, 0 4.24, 4.24 0')
    hex.setAttribute('transform', 'translate(' + (mx(params) + xoffset) + ', ' + (my(params) + yoffset) + ')')
    return hex;
  }

  function dartSingle(svg, params, rot, xoffset, yoffset) {
    const rotate = function (degrees) { return 'rotate(' + degrees + ', ' + mx(params) + ', ' + (my(params) - 1) + ')' }
    let path = createElement('path')
    svg.appendChild(path)
    setAttr(path, params)
    path.setAttribute('d', 'M -4 7 Q -6 9 -7 9 Q -9 9 -8 7 L -1 -7 Q 0 -9 1 -7 L 8 7 Q 9 9 7 9 Q 6 9 4 7 L 1 4 Q 0 3 -1 4' + 'z')
    let transform = rotate(45 * params.rot)
    transform += ' translate(' + (mx(params) + xoffset) + ', ' + (my(params) + yoffset) + ')'
    path.setAttribute('transform', transform)
    return path;
  }

  //********************** MAIN **********************//

  window.drawSymbolWithSvg = function (svg, params) {
    let circ, rect, hex, hex2, arrowhead, path, poly, transform;
    let midx = params.width / 2 + params.x;
    let midy = params.height / 2 + params.y;
    if (!params.rot) params.rot = 0
    let rotate = function (degrees) { return 'rotate(' + degrees + ', ' + midx + ', ' + midy + ')' }
    switch (params.type) {
      case 'square': //------------------------------------SQUARE
        rect = createElement('rect')
        svg.appendChild(rect)
        rect.setAttribute('width', 28); rect.setAttribute('height', 28);
        rect.setAttribute('x', midx - 14); rect.setAttribute('y', midy - 14);
        rect.setAttribute('rx', 7); rect.setAttribute('ry', 7);
        setAttr(rect, params)
        rect.setAttribute('transform', '')
        break;
      case 'dot': //------------------------------------HEXAGON
        let dot = simplePoly(svg, params, '5.2 9, 10.4 0, 5.2 -9, -5.2 -9, -10.4 0, -5.2 9');
        dot.setAttribute('transform', `translate(${midx}, ${midy}) scale(${(params.size ?? 7) / 7})`);
        if (params.sound) dot.setAttribute('fill', '#ff6666ff');
        break;
      case 'gap':
        for (xoffset of [-40, 9]) {
          rect = createElement('rect')
          svg.appendChild(rect)
          rect.setAttribute('width', 32)
          rect.setAttribute('height', 24)
          rect.setAttribute('fill', 'var(--line-undone)')
          rect.setAttribute('transform', rotate(90 * params.rot))
          rect.setAttribute('x', midx + xoffset)
          rect.setAttribute('y', midy - 12)
          rect.setAttribute('shape-rendering', 'crispedges')
        }
        break;
      case 'star': //------------------------------------STAR
        simplePoly(svg, params, '-10.5 -10.5, -9.5 -4, -15 0, -9.5 4, -10.5 10.5, -4 9.5, 0 15, 4 9.5, 10.5 10.5, 9.5 4, 15 0, 9.5 -4, 10.5 -10.5, 4, -9.5, 0 -15, -4 -9.5')
        break;
      case 'poly': //------------------------------------POLYOMINO
        drawPolyomino(svg, params, 10, 4, 0, '0 0, 10 0, 10 10, 0 10')
        break;
      case 'ylop': //------------------------------------BLUE MINOS / NEGATIVE MINOS
        drawPolyomino(svg, params, 12, 2, 0, '0 0, 12 0, 12 12, 0 12, 0 3, 3 3, 3 9, 9 9, 9 3, 0 3')
        break;
      case 'nega': //------------------------------------NEGATOR
        if (localStorage.symbolTheme == "Canonical")
          simplePoly(svg, params, '2.9 -2, 2.9 -10.4, -2.9 -10.4, -2.9 -2, -10.2 2.2, -7.3 7.2, 0 3, 7.3 7.2, 10.2 2.2')
        else
          simplePath(svg, params, 'M -3 0 L -3 -9 L 3 -9 L 3 0 L 10 4 L 8 9 L 0 5 L -8 9 L -10 4')
        break;
      case 'nonce': //------------------------------------?
        /* Do nothing */
        break;
      case 'triangle': //------------------------------------TRIANGLE
        if (localStorage.symbolTheme == "Canonical") {
          let distribution = triangleDistributions[params.count]
          let high = distribution.length
          for (var y = 0; y < high; y++) {
            let wide = distribution[y]
            for (var x = 0; x < wide; x++) {
              poly = createElement('polygon')
              svg.appendChild(poly)
              let Xcoord = midx + 11 * (2 * x - wide + 1)
              let Ycoord = midy + 10 * (2 * y - high + 1)
              poly.setAttribute('points', '0 -8, -8 6, 8 6')
              setAttr(poly, params)
              poly.setAttribute('transform', 'translate(' + Xcoord + ', ' + Ycoord + ')')
            }
          }
        }
        else
          switch (params.count) {
            case 1:
              triangleSingle(svg, params, 0, 0);
              break;
            case 2:
              triangleSingle(svg, params, -9, 0);
              triangleSingle(svg, params, 9, 0);
              break;
            case 3:
              triangleSingle(svg, params, 0, -8);
              triangleSingle(svg, params, -9, 8);
              triangleSingle(svg, params, 9, 8);
              break;
            case 4:
              triangleSingle(svg, params, -9, -9);
              triangleSingle(svg, params, 9, -9);
              triangleSingle(svg, params, -9, 9);
              triangleSingle(svg, params, 9, 9);
              break;
          }
        break;
      case 'atriangle': //------------------------------------TRIANGLE
        if (localStorage.symbolTheme == "Canonical") {
          let distribution = triangleDistributions[params.count]
          let high = distribution.length
          for (var y = 0; y < high; y++) {
            let wide = distribution[y]
            for (var x = 0; x < wide; x++) {
              poly = createElement('polygon')
              svg.appendChild(poly)
              let Xcoord = midx + 11 * (2 * x - wide + 1)
              let Ycoord = midy + 10 * (2 * y - high + 1)
              poly.setAttribute('points', '0 9, 9 -7, -9 -7, 0 9, 0 4, -3.5 -3, 3.5 -3, 0 4')
              setAttr(poly, params)
              poly.setAttribute('transform', 'translate(' + Xcoord + ', ' + Ycoord + ')')
            }
          }
        }
        else
          switch (params.count) {
            case 1:
              simplePath(svg, params, 'M -7 -8 L -4 -5 L 4 -5 Q 5 -5 3.8 -3 L 0.5 2 Q 0 3 -0.5 2 L -3.8 -3 Q -5 -5 -4 -5 L -7 -8 Q -10.9 -8 -9 -5 L -1 7 Q 0 8.2 1 7 L 9 -5 Q 10.9 -8 7 -8');
              break;
            case 2:
              simplePath(svg, params, 'M -7 -8 L -4 -5 L 4 -5 Q 5 -5 3.8 -3 L 0.5 2 Q 0 3 -0.5 2 L -3.8 -3 Q -5 -5 -4 -5 L -7 -8 Q -10.9 -8 -9 -5 L -1 7 Q 0 8.2 1 7 L 9 -5 Q 10.9 -8 7 -8').setAttribute('transform', 'translate(' + (midx + 11) + ', ' + midy + ')');
              simplePath(svg, params, 'M -7 -8 L -4 -5 L 4 -5 Q 5 -5 3.8 -3 L 0.5 2 Q 0 3 -0.5 2 L -3.8 -3 Q -5 -5 -4 -5 L -7 -8 Q -10.9 -8 -9 -5 L -1 7 Q 0 8.2 1 7 L 9 -5 Q 10.9 -8 7 -8').setAttribute('transform', 'translate(' + (midx - 11) + ', ' + midy + ')');
              break;
            case 3:
              simplePath(svg, params, 'M -7 -8 L -4 -5 L 4 -5 Q 5 -5 3.8 -3 L 0.5 2 Q 0 3 -0.5 2 L -3.8 -3 Q -5 -5 -4 -5 L -7 -8 Q -10.9 -8 -9 -5 L -1 7 Q 0 8.2 1 7 L 9 -5 Q 10.9 -8 7 -8').setAttribute('transform', 'translate(' + midx + ', ' + (midy + 9) + ')');
              simplePath(svg, params, 'M -7 -8 L -4 -5 L 4 -5 Q 5 -5 3.8 -3 L 0.5 2 Q 0 3 -0.5 2 L -3.8 -3 Q -5 -5 -4 -5 L -7 -8 Q -10.9 -8 -9 -5 L -1 7 Q 0 8.2 1 7 L 9 -5 Q 10.9 -8 7 -8').setAttribute('transform', 'translate(' + (midx + 11) + ', ' + (midy - 9) + ')');
              simplePath(svg, params, 'M -7 -8 L -4 -5 L 4 -5 Q 5 -5 3.8 -3 L 0.5 2 Q 0 3 -0.5 2 L -3.8 -3 Q -5 -5 -4 -5 L -7 -8 Q -10.9 -8 -9 -5 L -1 7 Q 0 8.2 1 7 L 9 -5 Q 10.9 -8 7 -8').setAttribute('transform', 'translate(' + (midx - 11) + ', ' + (midy - 9) + ')');
              break;
            case 4:
              simplePath(svg, params, 'M -7 -8 L -4 -5 L 4 -5 Q 5 -5 3.8 -3 L 0.5 2 Q 0 3 -0.5 2 L -3.8 -3 Q -5 -5 -4 -5 L -7 -8 Q -10.9 -8 -9 -5 L -1 7 Q 0 8.2 1 7 L 9 -5 Q 10.9 -8 7 -8').setAttribute('transform', 'translate(' + (midx + 11) + ', ' + (midy + 10) + ')');
              simplePath(svg, params, 'M -7 -8 L -4 -5 L 4 -5 Q 5 -5 3.8 -3 L 0.5 2 Q 0 3 -0.5 2 L -3.8 -3 Q -5 -5 -4 -5 L -7 -8 Q -10.9 -8 -9 -5 L -1 7 Q 0 8.2 1 7 L 9 -5 Q 10.9 -8 7 -8').setAttribute('transform', 'translate(' + (midx - 11) + ', ' + (midy + 10) + ')');
              simplePath(svg, params, 'M -7 -8 L -4 -5 L 4 -5 Q 5 -5 3.8 -3 L 0.5 2 Q 0 3 -0.5 2 L -3.8 -3 Q -5 -5 -4 -5 L -7 -8 Q -10.9 -8 -9 -5 L -1 7 Q 0 8.2 1 7 L 9 -5 Q 10.9 -8 7 -8').setAttribute('transform', 'translate(' + (midx + 11) + ', ' + (midy - 10) + ')');
              simplePath(svg, params, 'M -7 -8 L -4 -5 L 4 -5 Q 5 -5 3.8 -3 L 0.5 2 Q 0 3 -0.5 2 L -3.8 -3 Q -5 -5 -4 -5 L -7 -8 Q -10.9 -8 -9 -5 L -1 7 Q 0 8.2 1 7 L 9 -5 Q 10.9 -8 7 -8').setAttribute('transform', 'translate(' + (midx - 11) + ', ' + (midy - 10) + ')');
              break;
          }
        break;
      case 'start': //------------------------------------START/CIRCLE LINE
        // if (params.opposite === undefined) break;
        circ = createElement('circle')
        svg.appendChild(circ)
        circ.setAttribute('fill', 'var(--line-undone)')
        circ.setAttribute('r', 24)
        circ.setAttribute('cx', midx); circ.setAttribute('cy', midy);
        if (params.opposite) {
          simplePath(svg, params, 'M -3 0 L -3 -9 L 3 -9 L 3 0 L 10 4 L 8 9 L 0 5 L -8 9 L -10 4').setAttribute('fill', 'var(--inner)')
        }
        break;
      case 'end': //------------------------------------END/GOAL NUB
        rect = createElement('rect')
        circ = createElement('circle')
        svg.appendChild(rect)
        svg.appendChild(circ)
        rect.setAttribute('fill', 'var(--line-undone)')
        circ.setAttribute('fill', 'var(--line-undone)')
        rect.setAttribute('width', 24); rect.setAttribute('height', 24);
        circ.setAttribute('r', 12)
        rect.setAttribute('x', midx - 12); rect.setAttribute('y', midy - 12);
        circ.setAttribute('cx', midx); circ.setAttribute('cy', midy);

        let axis = 'x'
        let sign = 1;
        if (params.dir === 'top' || params.dir === 'bottom') axis = 'y';
        if (params.dir === 'left' || params.dir === 'top') sign = -1;
        rect.setAttribute(axis, parseInt(rect.getAttribute(axis)) + (sign * 12))
        circ.setAttribute('c' + axis, parseInt(circ.getAttribute('c' + axis)) + (sign * 24))
        if (params.endType > 0 && document.getElementById('metaButtons') != null) {
          let text = createElement('text')
          svg.appendChild(text);
          text.innerHTML = params.endType === 1 ? 'B' : 'C'
          text.setAttribute('fill', 'var(--text)')
          text.setAttribute('x', midx - 6); text.setAttribute('y', midy);
          text.setAttribute(axis, parseInt(text.getAttribute(axis)) + (sign * 24))
        }
        break;
      case 'drag': //------------------------------------DRAWN LINE
        if (!params.rot) params.rot = 0
        for (var i = 0; i < 6; i++) {
          for (var j = 0; j < 2; j++) {
            rect = createElement('rect')
            svg.appendChild(rect)
            rect.setAttribute('fill', 'var(--background)')
            rect.setAttribute('width', 2); rect.setAttribute('height', 2);
            if (params.rot === 0) { rect.setAttribute('x', i * 4); rect.setAttribute('y', j * 4); }
            else { rect.setAttribute('x', j * 4); rect.setAttribute('y', i * 4); }
          }
        }
        break;
      case 'bridge': //------------------------------------SEREN'S BRIDGE
        if (localStorage.symbolTheme == "Canonical")
          simplePoly(svg, params, '-10.58 14.56, -17.12 -5.56, 0 -18, 17.12 -5.56, 10.58 14.56, 5.29 7.28, 8.56 -2.78, 0 -9, -8.56 -2.78, -5.29 7.28')
        else
          simplePoly(svg, params, '-9.52 13.10, -15.41 -5.00, 0.00 -16.20, 15.41 -5.00, 9.52 13.10, 4.76 6.55, 7.70 -2.50, 0.00 -8.10, -7.70 -2.50, -4.76 6.55')
        break;
      case 'arrow': //------------------------------------SIGMA'S ARROW
        if (localStorage.symbolTheme == "Canonical") {
          rect = createElement('rect')
          svg.appendChild(rect)
          setAttr(rect, params)
          rect.setAttribute('width', 6)
          rect.setAttribute('height', 36)
          rect.setAttribute('transform', rotate(45 * params.rot))
          rect.setAttribute('x', midx - 3)
          rect.setAttribute('y', midy - 18)

          for (var i = 0; i < params.count; i++) {
            arrowhead = createElement('path')
            svg.appendChild(arrowhead)
            setAttr(arrowhead, params)
            transform = rotate(45 * params.rot)
            transform += ' translate(' + midx + ', ' + (midy - 14 + i * 12) + ')'
            arrowhead.setAttribute('d', 'M 2 -8 Q 0 -10 -2 -8 L -12 2 Q -14 4 -14 5 L -14 11 Q -14 12 -13 11 L -1 -1 Q 0 -2 1 -1 L 13 11 Q 14 12 14 11 L 14 5 Q 14 4 12 2 ' + 'z')
            arrowhead.setAttribute('transform', transform)
          }
        }
        else {
          for (var i = -(params.count / 2); i < (params.count / 2); i++) {
            arrowhead = createElement('path')
            svg.appendChild(arrowhead)
            setAttr(arrowhead, params)
            transform = rotate(45 * params.rot)
            transform += ' translate(' + midx + ', ' + (midy + i * 12 + 4.5 - (params.rot % 2 * 6)) + ')'
            arrowhead.setAttribute('d', 'M 2 -8 Q 0 -10 -2 -8 L -12 2 Q -14 4 -14 5 L -14 11 Q -14 12 -13 11 L -1 -1 Q 0 -2 1 -1 L 13 11 Q 14 12 14 11 L 14 5 Q 14 4 12 2 ' + 'z')
            arrowhead.setAttribute('transform', transform)
          }
        }
        break;
      case 'sizer': //------------------------------------RADIAZIA'S SIZER
        if (localStorage.symbolTheme == "Canonical")
          simplePath(svg, params, 'M -24 0 ' +
            'a 24 24 0 0 0  24 -24 ' +
            'a 24 24 0 0 0  24  24 ' +
            'a 24 24 0 0 0 -24  24 ' +
            'a 24 24 0 0 0 -24 -24 ')
        else
          simplePath(svg, params, 'M -13 7 Q -14 11 -10 11 L 10 11 Q 14 11 13 7 L 8 -7 Q 7 -9 5 -9 L -5 -9 Q -7 -9 -8 -7')
        break;
      case 'cross': //------------------------------------LOOKSY - CROSS
        simplePoly(svg, params, '10 2.5, 10 -2.5, 2.5 -2.5, 2.5 2.5');
        simplePoly(svg, params, '-10 2.5, -10 -2.5, -2.5 -2.5, -2.5 2.5');
        simplePoly(svg, params, '2.5 10, 2.5 2.5, -2.5 2.5, -2.5 10');
        simplePoly(svg, params, '2.5 -10, 2.5 -2.5, -2.5 -2.5, -2.5 -10');
        break;
      case 'crossFilled':
        simplePoly(svg, params, '-10 -2.5,-10 2.5,-2.5 2.5,-2.5 10,2.5 10,2.5 2.5,10 2.5,10 -2.5,2.5 -2.5,2.5 -10,-2.5 -10,-2.5 -2.5')
        break;
      case 'curve': //------------------------------------LOOKSY - CURVE
        simplePoly(svg, params, '10 0, 0 10, -10 0, 0 -10, 0 -5, -5 0, 0 5, 5 0, 0 -5, 0 -10')
        break;
      case 'curveFilled':
        simplePoly(svg, params, '10 0, 0 10, -10 0, 0 -10')
        break;
      case 'dots':
        switch (params.count) {
          case 1:
            simplePoly(svg, params, '3 3, -3 3, -3 -3, 3 -3')
            break;
          case 2:
            simplePoly(svg, params, '1 8, -5 8, -5 2, 1 2')
            simplePoly(svg, params, '5 -2, -1 -2, -1 -8, 5 -8')
            break;
          case 3:
            simplePoly(svg, params, '-1 8, -7 8, -7 2, -1 2')
            simplePoly(svg, params, '-1 -8, -7 -8, -7 -2, -1 -2')
            simplePoly(svg, params, '7 3, 1 3, 1 -3, 7 -3')
            break;
          case 4:
            simplePoly(svg, params, '-2 8, -8 8, -8 2, -2 2')
            simplePoly(svg, params, '-2 -8, -8 -8, -8 -2, -2 -2')
            simplePoly(svg, params, '2 8, 8 8, 8 2, 2 2')
            simplePoly(svg, params, '2 -8, 8 -8, 8 -2, 2 -2')
            break;
        }
        break;
      case 'dotsHollow':
        switch (params.count) {
          case 1:
            simplePoly(svg, params, '4 4, -4 4, -4 -4, 4 -4, 4 2, 2 2, 2 -2, -2 -2, -2 2, 4 2')
            break;
          case 2:
            simplePoly(svg, params, '2 9, -6 9, -6 1, 2 1, 2 7, 0 7, 0 3, -4 3, -4 7, 2 7')
            simplePoly(svg, params, '6 -1, -2 -1, -2 -9, 6 -9, 6 -3, 4 -3, 4 -7, 0 -7, 0 -3, 6 -3')
            break;
          case 3:
            simplePoly(svg, params, '-1 9, -9 9, -9 1, -1 1, -1 7, -3 7, -3 3, -7 3, -7 7, -1 7')
            simplePoly(svg, params, '-1 -1, -9 -1, -9 -9, -1 -9, -1 -3, -3 -3, -3 -7, -7 -7, -7 -3, -1 -3')
            simplePoly(svg, params, '9 4, 1 4, 1 -4, 9 -4, 9 2, 7 2, 7 -2, 3 -2, 3 2, 9 2')
            break;
          case 4:
            simplePoly(svg, params, '-1 9, -9 9, -9 1, -1 1, -1 7, -3 7, -3 3, -7 3, -7 7, -1 7')
            simplePoly(svg, params, '-1 -1, -9 -1, -9 -9, -1 -9, -1 -3, -3 -3, -3 -7, -7 -7, -7 -3, -1 -3')
            simplePoly(svg, params, '9 9, 1 9, 1 1, 9 1, 9 7, 7 7, 7 3, 3 3, 3 7, 9 7')
            simplePoly(svg, params, '9 -1, 1 -1, 1 -9, 9 -9, 9 -3, 7 -3, 7 -7, 3 -7, 3 -3, 9 -3')
            break;
        }
        break;
      case 'twobytwo': //------------------------------------LOOKSY2 - TWOBYTWO
        if (localStorage.symbolTheme == "Canonical") {
          onebyone(svg, params, 9.71, 0)
          onebyone(svg, params, -9.71, 0)
          onebyone(svg, params, 0, 9.71)
          enobyeno(svg, params, 0, -11)
        } else {
          onebyone(svg, params, 9.71, 0)
          onebyone(svg, params, -9.71, 0)
          onebyone(svg, params, 0, 9.71)
          onebyone(svg, params, 0, -9.71)
        }
        break;
      case 'dart': //------------------------------------LOOKSY2 - DART
        switch (params.count) {
          case 1:
            dartSingle(svg, params, params.rot, 0, 0);
            break;
          case 2:
            dartSingle(svg, params, params.rot, -10, 0);
            dartSingle(svg, params, params.rot, 10, 0);
            break;
          case 3:
            dartSingle(svg, params, params.rot, 0, -10);
            dartSingle(svg, params, params.rot, -10, 10);
            dartSingle(svg, params, params.rot, 10, 10);
            break;
          case 4:
            dartSingle(svg, params, params.rot, -10, -10);
            dartSingle(svg, params, params.rot, 10, -10);
            dartSingle(svg, params, params.rot, -10, 10);
            dartSingle(svg, params, params.rot, 10, 10);
            break;
        }
        break;
      case 'polynt': //------------------------------------UNSUSPICIOUSPERSON'S ANTIPOLYOMINO
        // if (localStorage.symbolTheme == "Canonical")
        drawPolyomino(svg, params, 12, 2, 12, '0 0, 0 -12, 12 -12, 12 0, 0 0, 2 -2, 8 -2, 2 -8, 2 -2, 0 0, 0 -12, 12 -12, 10 -10, 4 -10, 10 -4, 10 -10, 12 -12, 0 -12')
        // else
        // drawPolyomino(svg, params, 12, 2, '3 0, 6 3, 9 0, 12 3, 9 6, 12 9, 9 12, 6 9, 3 12, 0 9, 3 6, 0 3')
        break;
      case 'xvmino': //------------------------------------XV MINOS
        drawPolyomino(svg, params, 12, 2, 0, '0 0, 12 0, 12 12, 0 12, 0 2, 2 2, 2 10, 10 10, 10 2, 7 2, 7 10, 5 10, 5 2, 0 2');
        break;
      case 'divdiamond': //------------------------------------SHAUN'S DIVIDED DIAMOND
        let m = 3;
        if (localStorage.symbolTheme == "Canonical") m = 5;
        simplePoly(svg, params, `-${m * 5} 0, 0 ${m * 5}, ${m * 5} 0, 0 -${m * 5}, 0 -${m * 5 - 6}, ${m * 5 - 6} 0, 0 ${m * 5 - 6}, -${m * 5 - 6} 0, 0 -${m * 5 - 6}, 0 -${m * 5}`)
        switch (params.count) {
          case 2:
            simpleDot(svg, params, 0, 0);
            break;
          case 3:
            rect = createElement('rect')
            svg.appendChild(rect)
            setAttr(rect, params)
            rect.setAttribute('x', -2);
            rect.setAttribute('y', -m * 4);
            rect.setAttribute('width', 4);
            rect.setAttribute('height', m * 8);
            break;
          case 4:
            simpleLine(svg, params, m * 4, 4, 180);
            simpleLine(svg, params, m * 3, 4, 60);
            simpleLine(svg, params, m * 3, 4, 300);
            break;
          case 5:
            if (localStorage.symbolTheme == "Canonical") {
              simpleLine(svg, params, m * 4, 4, 180);
              simpleLine(svg, params, m * 4, 4, 0);
              simpleLine(svg, params, m * 4, 4, 90);
              simpleLine(svg, params, m * 4, 4, 270);
            } else {
              simpleLine(svg, params, m * 3, 4, 45);
              simpleLine(svg, params, m * 3, 4, 135);
              simpleLine(svg, params, m * 3, 4, 225);
              simpleLine(svg, params, m * 3, 4, 315);
            }
            break;
          case 6:
            if (localStorage.symbolTheme == "Canonical") {
              simpleLine(svg, params, m * 4, 4, 180);
              simpleLine(svg, params, m * 11 / 3, 4, 108);
              simpleLine(svg, params, m * 3, 4, 36);
              simpleLine(svg, params, m * 11 / 3, 4, 252);
              simpleLine(svg, params, m * 3, 4, 324);
            } else {
              simpleLine(svg, params, m * 3, 4, 45);
              simpleLine(svg, params, m * 3, 4, 135);
              simpleLine(svg, params, m * 3, 4, 225);
              simpleLine(svg, params, m * 3, 4, 315);
              simpleDot(svg, params, m * 4, m * 4);
            }
            break;
          case 7:
            if (localStorage.symbolTheme == "Canonical") {
              simpleLine(svg, params, m * 4, 4, 180);
              simpleLine(svg, params, m * 4, 4, 0);
              simpleLine(svg, params, m * 3, 4, 120);
              simpleLine(svg, params, m * 3, 4, 60);
              simpleLine(svg, params, m * 3, 4, 300);
              simpleLine(svg, params, m * 3, 4, 240);
            } else {
              simpleLine(svg, params, m * 3, 4, 45);
              simpleLine(svg, params, m * 3, 4, 135);
              simpleLine(svg, params, m * 3, 4, 225);
              simpleLine(svg, params, m * 3, 4, 315);
              simpleDot(svg, params, m * 4, m * 4);
              simpleDot(svg, params, -m * 4, -m * 4);
            }
            break;
          case 8:
            if (localStorage.symbolTheme == "Canonical") {
              simpleLine(svg, params, m * 4, 4, 180);
              simpleLine(svg, params, m * 3, 4, 130);
              simpleLine(svg, params, m * 4, 4, 80);
              simpleLine(svg, params, m * 3, 4, 20);
              simpleLine(svg, params, m * 3, 4, 230);
              simpleLine(svg, params, m * 4, 4, 280);
              simpleLine(svg, params, m * 3, 4, 340);
            } else {
              simpleLine(svg, params, m * 3, 4, 45);
              simpleLine(svg, params, m * 3, 4, 135);
              simpleLine(svg, params, m * 3, 4, 225);
              simpleLine(svg, params, m * 3, 4, 315);
              simpleDot(svg, params, m * 4, m * 4);
              simpleDot(svg, params, -m * 4, -m * 4);
              simpleDot(svg, params, -m * 4, m * 4);
            }
            break;
          case 9:
            if (localStorage.symbolTheme == "Canonical") {
              simpleLine(svg, params, m * 4, 4, 180);
              simpleLine(svg, params, m * 4, 4, 0);
              simpleLine(svg, params, m * 4, 4, 90);
              simpleLine(svg, params, m * 4, 4, 270);
              simpleLine(svg, params, m * 3, 4, 45);
              simpleLine(svg, params, m * 3, 4, 135);
              simpleLine(svg, params, m * 3, 4, 225);
              simpleLine(svg, params, m * 3, 4, 315);
            } else {
              simpleLine(svg, params, m * 7 / 3, 4, 45);
              simpleLine(svg, params, 7, 4, 135);
              simpleLine(svg, params, m * 7 / 3, 4, 225);
              simpleLine(svg, params, m * 7 / 3, 4, 315);
              simpleDot(svg, params, m * 4, m * 4);
              simpleDot(svg, params, -m * 4, -m * 4);
              simpleDot(svg, params, -m * 4, m * 4);
              simpleDot(svg, params, m * 4, -m * 4);
            }
            break;
        }
        break;
      case 'dice':
        simplePoly(svg, params, `20 20, 20 -20, -20 -20, -20 20, 16 20, 16 16, -16 16, -16 -16, 16 -16, 16 20`).setAttribute('transform', 'translate(' + midx + ', ' + midy + ') rotate(-5)');
        switch (params.count) {
          case 8:
          case 9:
            simpleDot(svg, params, 0, 10).setAttribute('transform', 'translate(' + midx + ', ' + midy + ') rotate(-5)');
            simpleDot(svg, params, 0, -10).setAttribute('transform', 'translate(' + midx + ', ' + midy + ') rotate(-5)');
          case 6:
          case 7:
            simpleDot(svg, params, 10, 0).setAttribute('transform', 'translate(' + midx + ', ' + midy + ') rotate(-5)');
            simpleDot(svg, params, -10, 0).setAttribute('transform', 'translate(' + midx + ', ' + midy + ') rotate(-5)');
          case 4:
          case 5:
            simpleDot(svg, params, -10, 10).setAttribute('transform', 'translate(' + midx + ', ' + midy + ') rotate(-5)');
            simpleDot(svg, params, 10, -10).setAttribute('transform', 'translate(' + midx + ', ' + midy + ') rotate(-5)');
          case 2:
          case 3:
            simpleDot(svg, params, 10, 10).setAttribute('transform', 'translate(' + midx + ', ' + midy + ') rotate(-5)');
            simpleDot(svg, params, -10, -10).setAttribute('transform', 'translate(' + midx + ', ' + midy + ') rotate(-5)');
            break;
        }
        if (params.count % 2) simpleDot(svg, params, 0, 0).setAttribute('transform', 'translate(' + midx + ', ' + midy + ') rotate(-5)');
        break;
      case 'vtriangle': //------------------------------------SUS' TENUOUS TRIANGLE
        if (localStorage.symbolTheme == "Canonical") {
          simplePath(svg, params, 'M -13.5 12 Q -16.5 12 -13.5 7.5 L -1.5 -12 Q 0 -15 1.5 -12 L 15 9 Q 16.5 12 13.5 12 L 7 9 L 10.5 9 L 1.5 -6 Q 0 -8.3 -1.5 -6 L -10.5 9 L -7 9 L -1 -2 Q 0 -3.8 1 -2 L 7 9 L 13.5 12')
        }
        else {
          simplePath(svg, params, 'M -6 6 Q -8.2 6 -7 4 L -1 -5 Q 0 -6.6 1 -5 L 7 4 Q 8.2 6 6 6').setAttribute('transform', 'translate(' + midx + ', ' + (midy + 4) + ')');
          simplePath(svg, params, 'M -10 8.2 Q -11 10 -12 10 L -14 10 Q -15.2 10 -14 8 L -1 -12 Q 0 -13.6 1 -12 L 14 8 Q 15.2 10 14 10 L 12 10 Q 11 10 10 8.2 L 1 -6 Q 0 -7.7 -1 -6')
        }
        break;
      case 'x':
        if ((params.spokes - 1) & 1) {
          simpleLine(svg, params, 35, 5, 135)
          simpleDot(svg, params, -25, -25).setAttribute('r', '2.5px')
        } else {
          simpleLine(svg, params, 14, 5, 135)
          simpleDot(svg, params, -10, -10).setAttribute('r', '2.5px')
        }
        if ((params.spokes - 1) & 2) {
          simpleLine(svg, params, 35, 5, 225)
          simpleDot(svg, params, 25, -25).setAttribute('r', '2.5px')
        } else {
          simpleLine(svg, params, 14, 5, 225)
          simpleDot(svg, params, 10, -10).setAttribute('r', '2.5px')
        }
        if ((params.spokes - 1) & 4) {
          simpleLine(svg, params, 35, 5, 45)
          simpleDot(svg, params, -25, 25).setAttribute('r', '2.5px')
        } else {
          simpleLine(svg, params, 14, 5, 45)
          simpleDot(svg, params, -10, 10).setAttribute('r', '2.5px')
        }
        if ((params.spokes - 1) & 8) {
          simpleLine(svg, params, 35, 5, 315)
          simpleDot(svg, params, 25, 25).setAttribute('r', '2.5px')
        } else {
          simpleLine(svg, params, 14, 5, 315)
          simpleDot(svg, params, 10, 10).setAttribute('r', '2.5px')
        }
        break;
      case 'pentagon': //------------------------------------SHAUN'S PENTAGONS
        if (localStorage.symbolTheme == "Canonical") simplePoly(svg, params, '0 -14, 14 -2.5, 9 13.4, -9 13.4, -14 -2.5');
        else simplePath(svg, params, 'M -6 13.4 Q -9 13.4 -10 11 L -13 0 Q -14 -2.5 -12 -4.5 L -2 -12.5 Q 0 -14 2 -12.5 L 12 -4.5 Q 14 -2.5 13 0 L 10 11 Q 9 13.4 6 13.5')
        break;
      case 'crystal':
        if (params.count == 5) {
          simplePath(svg, params, 'M -2.5 -12.5 Q 0 -15 2.5 -12.5 L 12.5 -2.5 Q 15 0 12.5 2.5 L 2.5 12.5 Q 0 15 -2.5 12.5 L -12.5 2.5 Q -15 0 -12.5 -2.5');
          break;
        }
        let c = simplePath(svg, params, 'M -10 7.5 Q -12.5 5 -12.5 2.5 L -12.5 -2.5 Q -12.5 -5 -10 -7.5 L -2.5 -15 Q 0 -17.5 2.5 -15 L 10 -7.5 Q 12.5 -5 12.5 -2.5 L 12.5 2.5 Q 12.5 5 10 7.5 L 2.5 15 Q 0 17.5 -2.5 15')
        transform = rotate(45 * params.count)
        transform += ' translate(' + midx + ', ' + midy + ')'
        c.setAttribute('transform', transform)
        break;
      case 'copier': //------------------------------------ARTLESS' COPIER
        simplePath(svg, params, 'M -4 0 L -9 -5 L -5 -9 L 0 -4 L 5 -9 L 9 -5 L 4 0 L 9 5 L 5 9 L 0 4 L -5 9 L -9 5')
        break;
      case 'celledhex': //------------------------------------SHAUN'S CELLED HEXES
      case 'null':
        simplePath(svg, params, 'M -2 -14 Q 0 -15 2 -14 L 11 -9 Q 13 -8 13 -6 L 13 6 Q 13 8 11 9 L 2 13 Q 0 14 -2 13 L -11 9 Q -13 8 -13 6 L -13 -6 Q -13 -8 -11 -9')
        break;
      case 'scaler':
        if (localStorage.symbolTheme == "Canonical") {
          if (params.flip) simplePath(svg, params, 'M -13 -14 Q -14 -14 -13 -12 L -2 10 Q 0 14.6 2 10 L 13 -12 Q 14 -14 13 -14 L 8 -14 Q 7.4 -14 7 -13 Q 6 -11 5 -11 L -1 -11 Q -2.3 -11 -2 -10 L -1 -6 Q -0.8 -5 0 -5 L 3 -5 Q 3.5 -5 3 -4 L 1 0 Q 0 2 -1 0 L -6 -11 Q -7.4 -14 -8 -14');
          else simplePath(svg, params, 'M -13 14 Q -14 14 -13 12 L -2 -10 Q 0 -14.6 2 -10 L 13 12 Q 14 14 13 14 L 8 14 Q 7.4 14 6 11 L 1 0 Q 0 -2 -1 0 L -6 11 Q -7.4 14 -8 14');
        } else {
          if (params.flip) {
            simplePath(svg, params, 'M 14 -13 Q 14 -15 12 -13 L 2 -2 Q 0 0 2 2 L 12 13 Q 14 15 14 13 L 14 8 Q 14 7 13 6 L 8 1 Q 7 0 8 -1 L 13 -6 Q 14 -7 14 -8');
            simplePath(svg, params, 'M -14 -13 Q -14 -15 -12 -13 L -2 -2 Q 0 0 -2 2 L -12 13 Q -14 15 -14 13 L -14 8 Q -14 7 -13 6 L -8 1 Q -7 0 -8 -1 L -13 -6 Q -14 -7 -14 -8');
          }
          else {
            simplePath(svg, params, 'M 2 -13 Q 2 -15 4 -13 L 14 -2 Q 16 0 14 2 L 4 13 Q 2 15 2 13 L 2 8 Q 2 7 3 6 L 8 1 Q 9 0 8 -1 L 3 -6 Q 2 -7 2 -8');
            simplePath(svg, params, 'M -2 -13 Q -2 -15 -4 -13 L -14 -2 Q -16 0 -14 2 L -4 13 Q -2 15 -2 13 L -2 8 Q -2 7 -3 6 L -8 1 Q -9 0 -8 -1 L -3 -6 Q -2 -7 -2 -8');
          }
        }
        break;
      case 'portal': // TODO: MAKE THIS OCTAGONAL
        simplePath(svg, params, 'M -0.2 -9.9 Q 0 -10 0.2 -9.9 L 6.8 -7.1 Q 7 -7 7.1 -6.8 L 9.9 -0.2 Q 10 0 9.9 0.2 L 7.1 6.8 Q 7 7 6.8 7.1 L 0.2 9.9 Q 0 10 -0.2 9.9 L -6.8 7.1 Q -7 7 -7.1 6.8 L -9.9 0.2 Q -10 0 -9.9 -0.2 L -7.1 -6.8 Q -7 -7 -6.8 -7.1');
        for (a of [0, 90, 180, 270])
          simplePath(svg, params, localStorage.symbolTheme == "Canonical" ? 'M -5.7 -10.2 Q -6 -10 -5.9 -10.2 L -4.1 -13.8 Q -4 -14 -3.8 -14.1 L -0.2 -15.9 Q 0 -16 0.2 -15.9 L 3.8 -14.1 Q 4 -14 4.1 -13.8 L 5.9 -10.2 Q 6 -10 5.7 -10.2 L 3.3 -11.8 Q 3 -12 2.7 -12.1 L 0.3 -12.9 Q 0 -13 -0.3 -12.9 L -2.8 -12.1 Q -3 -12 -3.3 -11.8' : 'M -4.9 -10.1 Q -5 -10 -5 -10.2 L -5 -12.8 Q -5 -13 -4.9 -13.1 L -3.2 -14.8 Q -3 -15 -2.7 -15.1 L -0.3 -15.9 Q 0 -16 0.3 -15.9 L 2.7 -15.1 Q 3 -15 3.2 -14.8 L 4.9 -13.1 Q 5 -13 5 -12.8 L 5 -10.2 Q 5 -10 4.9 -10.1 L 3.2 -11.8 Q 3 -12 2.7 -12.1 L 0.3 -12.9 Q 0 -13 -0.3 -12.9 L -2.8 -12.1 Q -3 -12 -3.2 -11.8').setAttribute('transform', rotate(a) + ' translate(' + midx + ', ' + midy + ')');
        break;
      case 'blackhole':
        if (localStorage.symbolTheme == "Canonical") {
          simpleDot(svg, params, 0, 0).setAttribute('r', '20px');
          let temp = simpleDot(svg, params, 0, 0);
          temp.setAttribute('r', '25px');
          temp.setAttribute('opacity', '0.5');
        } else {
          for (a of [0, 72, 144, 216, 288]) {
            simplePath(svg, params, 'M 0 2 A 1 1 0 0 0 0 -14 A 1 1 0 0 0 0 -10 A 1 1 0 0 1 0 -2 A 1 1 0 0 0 0 2').setAttribute('transform', rotate(a) + ' translate(' + midx + ', ' + midy + ')');
          }
          // simplePath(svg, params, 'M 0 -2 C 0 -4 5 -9 12 -5 C 12.9 -4.5 12.6 -4.1 12 -4.3 C 7 -6 4 0 2 0 C 4 0 9 5 5 12 C 4.5 12.8 4.1 12.6 4.3 12 C 6 7 0 4 0 2 C 0 4 -5 9 -12 5 C -12.7 4.6 -12.5 4.1 -12 4.3 C -7 6 -4 0 -2 0 C -4 0 -9 -5 -5 -12 C -4.6 -12.7 -4.1 -12.6 -4.3 -12 C -6 -7 0 -4 0 -2');
        }
        break;
      case 'whitehole':
        if (localStorage.symbolTheme == "Canonical") {
          simpleDot(svg, params, 0, 0).setAttribute('r', '20px');
          let b2 = simpleDot(svg, params, 0, 0);
          b2.setAttribute('r', '17px');
          b2.setAttribute('fill', 'var(--inner)');
          let temp = simpleDot(svg, params, 0, 0);
          temp.setAttribute('r', '25px');
          temp.setAttribute('opacity', '0.5');
        } else {
          for (a of [0, 72, 144, 216, 288]) {
            simplePath(svg, params, 'M 0 4 A 1 1 90 0 1 0 -16 L 0 -13 A 1 1 90 0 0 0 0 A 1 1 90 0 0 0 0 A 1 1 90 0 1 0 -11 A 1 1 90 0 0 0 -13 L 0 -16 A 1 1 90 0 1 0 -8 A 1 1 90 0 0 0 -4 A 1 1 90 0 1 0 4').setAttribute('transform', rotate(a) + ' translate(' + midx + ', ' + midy + ')');
          }
        }
        break;
      case 'pokerchip':
        simplePath(svg, params, 'M 1.2 -8.4 Q 0 -9.24 -1.2 -8.4 C -3.6 -7.2 -1.2 -7.2 -3.6 -5.4 C -6 -3.6 -4.8 -6 -7.2 -4.8 Q -8.4 -4.32 -8.4 -2.4 C -8.4 -1.2 -7 -3 -7 0 C -7 3 -8.4 1.2 -8.4 2.4 Q -8.4 4.56 -7.2 4.8 C -4.8 6 -6 3.6 -3.6 5.52 C -1.2 7.2 -3.6 7.2 -1.2 8.4 Q 0 9.12 1.2 8.4 C 3.6 7.2 1.2 7.2 3.6 5.52 C 6 3.6 4.8 6 7.2 4.8 Q 8.4 4.32 8.4 2.4 C 8.4 1.2 7 3 7 0 C 7 -3 8.4 -1.2 8.4 -2.52 Q 8.4 -4.32 7.2 -4.8 C 4.8 -6 6 -3.6 3.6 -5.52 C 1.2 -7.2 3.6 -7.2 1.2 -8.4 L 2.4 -15.6 C 4.8 -14.4 4.8 -12 7.2 -10.8 C 9.6 -9.6 10.8 -10.8 13.2 -9.6 Q 14.4 -8.76 14.4 -6 C 14.4 -3.6 12 -2.4 12 0 C 12 2.4 14.4 3.6 14.4 6 Q 14.4 9 13.2 9.6 C 10.8 10.8 9.6 9.6 7.2 10.8 C 4.8 12 4.8 14.4 2.4 15.6 Q 0 16.56 -2.4 15.6 C -4.8 14.4 -4.8 12 -7.2 10.8 C -9.6 9.6 -10.8 10.8 -13.2 9.6 Q -14.4 9 -14.4 6 C -14.4 3.6 -12 2.4 -12 0 C -12 -2.4 -14.4 -3.6 -14.4 -6 Q -14.4 -8.76 -13.2 -9.6 C -10.8 -10.8 -9.6 -9.6 -7.2 -10.8 C -4.8 -12 -4.8 -14.4 -2.4 -15.6 Q 0 -16.44 2.4 -15.6');
        break;
      case 'swirl':
        if (localStorage.symbolTheme == "Canonical") {
          if (params.flip) simplePath(svg, params, 'M -18 0 A 18 18 90 1 0 0 -18 L 0 -14 A 14 14 90 1 1 -14 0 L -8 0 L -16 -8 L -24 0')
          else simplePath(svg, params, 'M 18 0 A 18 18 90 1 1 0 -18 L 0 -14 A 14 14 90 1 0 14 0 L 8 0 L 16 -8 L 24 0')
        } else {
          if (params.flip) simplePath(svg, params, 'M 0 0 L -10.4 -10.6 A 15 15 90 1 0 -3.4 -14.4 C -4.1 -14.4 -0.5 -8.9 0 -9 A 9 9 90 1 1 -9 -1.1')
          else simplePath(svg, params, 'M 0 0 L 10.4 -10.6 A 15 15 90 1 1 3.4 -14.4 C 4.1 -14.4 0.5 -8.9 0 -9 A 9 9 90 1 0 9 -1.1')
        }
        break;
      case 'eye':
        simplePath(svg, params, 'M -1.33 -14.9625 Q 0 -15.96 1.33 -14.9625 L 19.95 -0.9975 Q 21.28 0 19.95 0.9975 L 1.33 14.9625 Q 0 15.96 -1.33 14.9625 L -19.95 0.9975 Q -21.28 0 -19.95 -0.9975 L -1.33 -14.9625 L 0.665 -10.4738 Q 0 -10.9725 -0.665 -10.4738 L -13.3 -0.9975 Q -14.63 0 -13.3 0.9975 L -0.665 10.4738 Q 0 10.9725 0.665 10.4738 L 13.3 0.9975 Q 14.63 0 13.3 -0.9975 L 0.665 -10.4738');
        switch (params.count) {
          case 1:
            simpleDot(svg, params, 0, -5)
            break;
          case 2:
            simpleDot(svg, params, 5, 0)
            break;
          case 3:
            simpleDot(svg, params, 0, 5)
            break;
          case 4:
            simpleDot(svg, params, -5, 0)
            break;
        }
        break;
      case 'bell': //------------------------------------KUBE'S BELLS
        let d = simplePath(svg, params, localStorage.symbolTheme == "Canonical" ?
          'm -4.6991416,-16.677537 c -0.84456,0.40364 -3.0966846,1.216065 -4.2531754,4.685452 -1.15649,3.4693867 -1.98715,11.64241611 -3.308567,15.7868534 -1.321417,4.1444382 -4.011233,7.0214796 -5.022194,8.4232616 -1.010961,1.401781 -1.011683,2.255378 -0.455232,2.875417 0.55645,0.620038 2.038301,1.418044 4.783196,1.752438 2.744895,0.334395 8.0923375,0.41937 12.95462635605,0.497239 C 4.8618004,17.26525 10.209252,17.18028 12.954147,16.845885 c 2.744895,-0.334394 4.228371,-1.1324 4.784821,-1.752438 0.55645,-0.620039 0.555729,-1.473636 -0.455232,-2.875417 C 16.272774,10.816248 13.582959,7.9392066 12.261542,3.7947684 10.940125,-0.34966889 10.107838,-8.5226983 8.9513409,-11.992085 7.7948509,-15.461472 5.5427255,-16.273897 4.6981654,-16.677537 3.2421762,-17.267871 1.7405658,-17.303 -4.8764395e-4,-17.344385 -1.5757735,-17.313577 -3.7617635,-17.121814 -4.6991416,-16.677537 Z' :
          'M 12.6 14 Q 14.14 14 14 12.6 L 12.6 0 C 11.2 -14 -11.2 -14 -12.6 0 L -14 12.6 Q -14.14 14 -12.6 14 M 4.2 -9.8 C 4.2 -15.4 -4.2 -15.4 -4.2 -9.8');
        transform = rotate(90 * (params.count - 1))
        transform += ' translate(' + midx + ', ' + midy + ')';
        // if (params.flip) transform += ' scale(-1, 1)';
        d.setAttribute('transform', transform);
        break;
      case 'drop': //------------------------------------MAILDROPFOLDER'S DROPLET
        let qa = simplePath(svg, params, 'M 0 -14 L 7.33 2.8 A 8 8 0 1 1 -7.33 2.8');
        transform = rotate(90 * (params.count - 1))
        transform += ' translate(' + midx + ', ' + midy + ')'
        qa.setAttribute('transform', transform)
        break;
      case 'flower':
        let scale = Math.random() + 0.5;
        for (let i = (Math.random() / 2); i < 5; i++)
          simplePath(svg, params, 'M 0 -4 C -14 -4 0 -24 0 -24 C 0 -24 14 -4 0 -4 L 0 -8 C 7 -8 0 -18 0 -19 C 0 -18 -7 -8 0 -8 M 6 -8 L 6 0 L -6 0 L -6 -8').setAttribute('transform', `translate(${midx}, ${midy}) rotate(${i * 72}) scale(${scale})`);
        break;
      case 'line':
        if (!params.rot) {
          simpleLine(svg, params, 28, 2, 90).setAttribute('fill', 'var(--line-default)')
          simpleLine(svg, params, 28, 2, -90).setAttribute('fill', 'var(--line-default)')
        } else {
          simpleLine(svg, params, 28, 2, 0).setAttribute('fill', 'var(--line-default)')
          simpleLine(svg, params, 28, 2, 180).setAttribute('fill', 'var(--line-default)')
        }
        break;
      case 'bridgeButActually':
        let br = simplePath(svg, params, 'M-36-12H-8A1 1 0 01-8 12H-36M8-12A1 1 0 018 12H36V-12')
        br.setAttribute('fill', 'var(--line-undone)')
        br.setAttribute('transform', `translate(${midx}, ${midy}) rotate(${180 * params.flip})`);
        break;
      case 'fulcrum':
        simplePath(svg, params, 'M 0 0 L -5 8.6 H 5 z  M 6 0 Q 8 0 8 2 H 14 A 4 4 0 1 0 14 -6 H 8 Q 8 -4 6 -4 H -6 Q -8 -4 -8 -6 H -14 A 4 4 0 1 0 -14 2 H -8 Q -8 0 -6 0 z')
            .setAttribute('transform', `translate(${midx}, ${midy}) rotate(${90 * params.flip})`);
        break;
      case 'none': break;
      default: //------------------------------------ERROR HANDLING
        console.error('Cannot draw unknown SVG type: ' + params.type)
        break;
    }
  }

})