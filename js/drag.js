// Drag and drop: palette to canvas + element move + nesting
(function() {
  var G = window.Gardener;
  var state = G.state;
  var createDefaultElement = G.createDefaultElement;
  var getElementById = G.getElementById;
  var findParent = G.findParent;
  var removeElement = G.removeElement;
  var getElementBounds = G.getElementBounds;
  var getAbsolutePosition = G.getAbsolutePosition;
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

  // --- Handlers called by unified dispatcher in app.js ---

  function paletteStart(e) {
    var paletteItem = e.target.closest('.palette-item');
    if (!paletteItem) return false;

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
    return true;
  }

  function elementStart(e) {
    var elNode = e.target.closest('.canvas-element');
    if (!elNode || !canvasEl || !canvasEl.contains(elNode)) return false;

    var id = elNode.dataset.id;
    var el = getElementById(id);
    if (!el) return false;

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
    return true;
  }

  function deselect(e) {
    var canvasArea = document.getElementById('canvas-area');
    if (canvasArea && canvasArea.contains(e.target) && !e.target.closest('.canvas-element')) {
      state.selectedId = null;
      emit('selectionChange');
    }
  }

  function pointerMove(e) {
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

      var parentBounds = getElementBounds(dragState.id);
      if (parentBounds) {
        var snapped = snapPosition(dragState.id, newX, newY, el.w, el.h, parentBounds);
        el.x = snapped.x;
        el.y = snapped.y;
      } else {
        var snappedFree = snapPosition(dragState.id, newX, newY, el.w, el.h);
        el.x = snappedFree.x;
        el.y = snappedFree.y;
      }

      // Direct DOM update instead of full re-render
      var node = canvasEl.querySelector('[data-id="' + dragState.id + '"]');
      if (node) {
        node.style.left = el.x + 'px';
        node.style.top = el.y + 'px';
      }
      emit('selectionChange');

      var rect2 = canvasEl.getBoundingClientRect();
      var centerX = e.clientX - rect2.left;
      var centerY = e.clientY - rect2.top;
      var dropTarget = findContainerAtPoint(centerX, centerY, dragState.id);
      highlightDropTarget(dropTarget);
    }
  }

  function pointerUp(e) {
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
        emit('canvasChange');
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

        var currentParent = findParent(dragState.id);

        if (container2 && currentParent && container2.id === currentParent.id) {
          // Staying in the same parent
        } else if (container2 && container2.id !== dragState.id) {
          // Reparent into new container
          saveState();
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
          // Dragged out of container
          saveState();
          var elAbsX2 = absPos2 ? absPos2.x : el.x;
          var elAbsY2 = absPos2 ? absPos2.y : el.y;
          removeElement(dragState.id);
          el.x = elAbsX2;
          el.y = elAbsY2;
          state.elements.push(el);
        } else {
          saveState();
        }
      }

      dragState = null;
      hideGuides();
      emit('canvasChange');
    }
  }

  G.initDrag = function() {
    // Drag handlers are called by the unified dispatcher in app.js
    // Expose them for that purpose
  };
  G.paletteStart = paletteStart;
  G.elementStart = elementStart;
  G.deselect = deselect;
  G.pointerMove = pointerMove;
  G.pointerUp = pointerUp;
})();
