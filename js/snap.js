// Alignment guides and snapping
(function() {
  var G = window.Gardener;
  var state = G.state;
  var getElementById = G.getElementById;

  var SNAP_THRESHOLD = 10;
  var guideH = document.getElementById('snap-guide-h');
  var guideV = document.getElementById('snap-guide-v');

  function getSnapTargets(excludeId) {
    var targets = [];
    var cw = state.canvas.width;
    var ch = state.canvas.height;

    targets.push(
      { x: 0 }, { x: cw }, { x: cw / 2 },
      { y: 0 }, { y: ch }, { y: ch / 2 }
    );

    function collectEdges(list, offX, offY) {
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.id === excludeId) continue;
        var ax = offX + el.x;
        var ay = offY + el.y;
        targets.push(
          { x: ax }, { x: ax + el.w }, { x: ax + el.w / 2 },
          { y: ay }, { y: ay + el.h }, { y: ay + el.h / 2 }
        );
        if (el.children) collectEdges(el.children, ax, ay);
      }
    }
    collectEdges(state.elements, 0, 0);
    return targets;
  }

  function snapPosition(elementId, proposedX, proposedY, w, h) {
    var targets = getSnapTargets(elementId);
    var snappedX = proposedX;
    var snappedY = proposedY;
    var showGuideV = false;
    var showGuideH = false;
    var guideVPos = 0;
    var guideHPos = 0;

    var left = proposedX;
    var right = proposedX + w;
    var centerX = proposedX + w / 2;
    var top = proposedY;
    var bottom = proposedY + h;
    var centerY = proposedY + h / 2;

    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      if (t.x !== undefined) {
        if (Math.abs(left - t.x) < SNAP_THRESHOLD) {
          snappedX = t.x;
          showGuideV = true;
          guideVPos = t.x;
          break;
        }
        if (Math.abs(right - t.x) < SNAP_THRESHOLD) {
          snappedX = t.x - w;
          showGuideV = true;
          guideVPos = t.x;
          break;
        }
        if (Math.abs(centerX - t.x) < SNAP_THRESHOLD) {
          snappedX = t.x - w / 2;
          showGuideV = true;
          guideVPos = t.x;
          break;
        }
      }
    }

    for (var j = 0; j < targets.length; j++) {
      var t2 = targets[j];
      if (t2.y !== undefined) {
        if (Math.abs(top - t2.y) < SNAP_THRESHOLD) {
          snappedY = t2.y;
          showGuideH = true;
          guideHPos = t2.y;
          break;
        }
        if (Math.abs(bottom - t2.y) < SNAP_THRESHOLD) {
          snappedY = t2.y - h;
          showGuideH = true;
          guideHPos = t2.y;
          break;
        }
        if (Math.abs(centerY - t2.y) < SNAP_THRESHOLD) {
          snappedY = t2.y - h / 2;
          showGuideH = true;
          guideHPos = t2.y;
          break;
        }
      }
    }

    if (showGuideV) {
      guideV.style.left = guideVPos + 'px';
      guideV.style.display = 'block';
    } else {
      guideV.style.display = 'none';
    }

    if (showGuideH) {
      guideH.style.top = guideHPos + 'px';
      guideH.style.display = 'block';
    } else {
      guideH.style.display = 'none';
    }

    return { x: Math.round(snappedX), y: Math.round(snappedY) };
  }

  function snapResize(elementId, handle, x, y, w, h) {
    var targets = getSnapTargets(elementId);
    var snappedX = x, snappedY = y, snappedW = w, snappedH = h;
    var showGuideV = false, showGuideH = false;
    var guideVPos = 0, guideHPos = 0;

    var affectsLeft   = handle.indexOf('l') !== -1;
    var affectsRight  = handle.indexOf('r') !== -1;
    var affectsTop    = handle.indexOf('t') !== -1;
    var affectsBottom = handle.indexOf('b') !== -1;

    var right  = x + w;
    var bottom = y + h;

    for (var i = 0; i < targets.length; i++) {
      var t = targets[i];
      if (t.x !== undefined) {
        if (affectsRight && Math.abs(right - t.x) < SNAP_THRESHOLD) {
          snappedW = t.x - snappedX;
          showGuideV = true; guideVPos = t.x; break;
        }
        if (affectsLeft && Math.abs(x - t.x) < SNAP_THRESHOLD) {
          var fixedRight = x + w;
          snappedX = t.x;
          snappedW = fixedRight - t.x;
          showGuideV = true; guideVPos = t.x; break;
        }
      }
    }

    for (var j = 0; j < targets.length; j++) {
      var t2 = targets[j];
      if (t2.y !== undefined) {
        if (affectsBottom && Math.abs(bottom - t2.y) < SNAP_THRESHOLD) {
          snappedH = t2.y - snappedY;
          showGuideH = true; guideHPos = t2.y; break;
        }
        if (affectsTop && Math.abs(y - t2.y) < SNAP_THRESHOLD) {
          var fixedBottom = y + h;
          snappedY = t2.y;
          snappedH = fixedBottom - t2.y;
          showGuideH = true; guideHPos = t2.y; break;
        }
      }
    }

    if (showGuideV) {
      guideV.style.left = guideVPos + 'px';
      guideV.style.display = 'block';
    } else {
      guideV.style.display = 'none';
    }

    if (showGuideH) {
      guideH.style.top = guideHPos + 'px';
      guideH.style.display = 'block';
    } else {
      guideH.style.display = 'none';
    }

    return {
      x: Math.round(snappedX),
      y: Math.round(snappedY),
      w: Math.round(snappedW),
      h: Math.round(snappedH)
    };
  }

  function hideGuides() {
    guideH.style.display = 'none';
    guideV.style.display = 'none';
  }

  G.snapPosition = snapPosition;
  G.snapResize = snapResize;
  G.hideGuides = hideGuides;
})();
