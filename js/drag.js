// Drag and drop: palette to canvas + element move + nesting
(function() {
  var G = window.Gardener;
  var state = G.state;
  var createDefaultElement = G.createDefaultElement;
  var getElementById = G.getElementById;
  var removeElement = G.removeElement;
  var emit = G.emit;
  var saveState = G.saveState;
  var snapPosition = G.snapPosition;
  var hideGuides = G.hideGuides;

  var canvasEl = document.getElementById('canvas');
  var dragState = null;
  var lastDropTarget = null;

  function isContainerType(type) {
    return type === 'view' || type === 'scrollview';
  }

  function getAbsolutePosition(id, list) {
    list = list || state.elements;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return { x: list[i].x, y: list[i].y };
      if (list[i].children) {
        var found = getAbsolutePosition(id, list[i].children);
        if (found) return { x: list[i].x + found.x, y: list[i].y + found.y };
      }
    }
    return null;
  }

  function isDescendant(childId, parentId) {
    var parent = getElementById(parentId);
    if (!parent || !parent.children) return false;
    for (var i = 0; i < parent.children.length; i++) {
      if (parent.children[i].id === childId) return true;
      if (isDescendant(childId, parent.children[i].id)) return true;
    }
    return false;
  }

  function findContainerAtPoint(px, py, excludeId, list, bestMatch) {
    list = list || state.elements;
    bestMatch = bestMatch || null;
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.id === excludeId) continue;
      if (excludeId && isDescendant(el.id, excludeId)) continue;

      var absPos = getAbsolutePosition(el.id);
      if (!absPos) continue;
      var absX = absPos.x;
      var absY = absPos.y;

      if (px >= absX && px <= absX + el.w && py >= absY && py <= absY + el.h) {
        if (isContainerType(el.type)) {
          bestMatch = el;
        }
        if (el.children) {
          bestMatch = findContainerAtPoint(px, py, excludeId, el.children, bestMatch) || bestMatch;
        }
      }
    }
    return bestMatch;
  }

  function clearDropHighlight() {
    if (lastDropTarget) {
      var node = document.querySelector('[data-id="' + lastDropTarget + '"]');
      if (node) node.classList.remove('drop-target');
      lastDropTarget = null;
    }
  }

  function highlightDropTarget(el) {
    clearDropHighlight();
    if (el) {
      lastDropTarget = el.id;
      var node = document.querySelector('[data-id="' + el.id + '"]');
      if (node) node.classList.add('drop-target');
    }
  }

  function initDrag() {
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('mousemove', onPointerMove, true);
    document.addEventListener('mouseup', onPointerUp, true);
  }

  function onPointerDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

    // 1) Palette item
    var paletteItem = e.target.closest('.palette-item');
    if (paletteItem) {
      e.preventDefault();
      var type = paletteItem.dataset.type;
      var ghost = document.createElement('div');
      ghost.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      ghost.style.position = 'fixed';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '100000';
      ghost.style.padding = '6px 14px';
      ghost.style.background = 'rgba(137, 180, 250, 0.9)';
      ghost.style.color = '#111';
      ghost.style.borderRadius = '6px';
      ghost.style.fontSize = '12px';
      ghost.style.fontWeight = '600';
      ghost.style.fontFamily = 'inherit';
      ghost.style.left = (e.clientX - 30) + 'px';
      ghost.style.top = (e.clientY - 15) + 'px';
      document.body.appendChild(ghost);
      dragState = { mode: 'palette', type: type, ghost: ghost };
      return;
    }

    // 2) Resize handle — skip, handled by select.js
    if (e.target.closest('.resize-handle')) return;

    // 3a) Slider thumb — skip entirely, handled by slider.js
    if (e.target.closest('.slider-thumb')) return;

    // 3) Canvas element — start move
    var elNode = e.target.closest('.canvas-element');
    if (elNode && canvasEl && canvasEl.contains(elNode)) {
      var id = elNode.dataset.id;
      var el = getElementById(id);
      if (el) {
        state.selectedId = id;
        emit('selectionChange');
        dragState = {
          mode: 'element',
          id: id,
          startX: e.clientX,
          startY: e.clientY,
          elStartX: el.x,
          elStartY: el.y,
        };
        e.preventDefault();
      }
      return;
    }

    // 4) Click on canvas background (inside or outside the white box) — deselect
    var canvasArea = document.getElementById('canvas-area');
    if (canvasArea && canvasArea.contains(e.target) && !e.target.closest('.canvas-element')) {
      state.selectedId = null;
      emit('stateChange');
      emit('selectionChange');
    }
  }

  function onPointerMove(e) {
    if (!dragState) return;

    if (dragState.mode === 'palette') {
      dragState.ghost.style.left = (e.clientX - 30) + 'px';
      dragState.ghost.style.top = (e.clientY - 15) + 'px';

      var rect = canvasEl.getBoundingClientRect();
      var cx = e.clientX - rect.left;
      var cy = e.clientY - rect.top;
      var target = findContainerAtPoint(cx, cy, null);
      highlightDropTarget(target);
      return;
    }

    if (dragState.mode === 'element') {
      var el = getElementById(dragState.id);
      if (!el) return;
      var dx = e.clientX - dragState.startX;
      var dy = e.clientY - dragState.startY;
      var newX = dragState.elStartX + dx;
      var newY = dragState.elStartY + dy;

      var hasParent = G.findParent(dragState.id);
      if (!hasParent) {
        var snapped = snapPosition(dragState.id, newX, newY, el.w, el.h);
        el.x = snapped.x;
        el.y = snapped.y;
      } else {
        el.x = Math.round(newX);
        el.y = Math.round(newY);
      }
      emit('stateChange');

      var rect2 = canvasEl.getBoundingClientRect();
      var centerX = e.clientX - rect2.left;
      var centerY = e.clientY - rect2.top;
      var dropTarget = findContainerAtPoint(centerX, centerY, dragState.id);
      highlightDropTarget(dropTarget);
    }
  }

  function onPointerUp(e) {
    if (!dragState) return;

    clearDropHighlight();

    if (dragState.mode === 'palette') {
      dragState.ghost.remove();
      var rect = canvasEl.getBoundingClientRect();
      var onCanvas = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (onCanvas) {
        var x = Math.round(e.clientX - rect.left);
        var y = Math.round(e.clientY - rect.top);
        var newEl = createDefaultElement(dragState.type, x, y);

        var container = findContainerAtPoint(x, y, null);
        if (container) {
          var absPos = getAbsolutePosition(container.id);
          newEl.x = x - absPos.x;
          newEl.y = y - absPos.y;
          container.children.push(newEl);
        } else {
          state.elements.push(newEl);
        }

        saveState();
        state.selectedId = newEl.id;
        emit('stateChange');
        emit('selectionChange');
      }
      dragState = null;
      return;
    }

    if (dragState.mode === 'element') {
      var el = getElementById(dragState.id);
      if (el) {
        var absPos2 = getAbsolutePosition(dragState.id);
        var centerX = absPos2 ? absPos2.x + el.w / 2 : el.x;
        var centerY = absPos2 ? absPos2.y + el.h / 2 : el.y;
        var container2 = findContainerAtPoint(centerX, centerY, dragState.id);

        var currentParent = G.findParent(dragState.id);

        if (container2 && currentParent && container2.id === currentParent.id) {
          // Staying in the same parent — no reparent needed
        } else if (container2 && container2.id !== dragState.id) {
          // Reparent into new container
          var removed = removeElement(dragState.id);
          if (removed) {
            var containerAbs = getAbsolutePosition(container2.id);
            var elAbsX = absPos2 ? absPos2.x : el.x;
            var elAbsY = absPos2 ? absPos2.y : el.y;
            el.x = elAbsX - containerAbs.x;
            el.y = elAbsY - containerAbs.y;
            container2.children.push(el);
          }
        } else if (currentParent && !container2) {
          // Dragged out of container → move to top level
          var elAbsX2 = absPos2 ? absPos2.x : el.x;
          var elAbsY2 = absPos2 ? absPos2.y : el.y;
          removeElement(dragState.id);
          el.x = elAbsX2;
          el.y = elAbsY2;
          state.elements.push(el);
        }
      }

      dragState = null;
      hideGuides();
      saveState();
      emit('stateChange');
    }
  }

  G.initDrag = initDrag;
})();
