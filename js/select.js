// Selection, resize, and properties panel
(function() {
  var G = window.Gardener;
  var state = G.state;
  var getElementById = G.getElementById;
  var findParent = G.findParent;
  var emit = G.emit;
  var on = G.on;
  var saveState = G.saveState;
  var snapPosition = G.snapPosition;
  var hideGuides = G.hideGuides;

  var isResizing = false;
  var resizeHandle = null;
  var resizeElementId = null;
  var resizeStartX = 0;
  var resizeStartY = 0;
  var resizeStartEl = {};

  var propX = document.getElementById('prop-x');
  var propY = document.getElementById('prop-y');
  var propW = document.getElementById('prop-w');
  var propH = document.getElementById('prop-h');
  var propBg = document.getElementById('prop-bg');
  var propRadius = document.getElementById('prop-radius');
  var propOpacity = document.getElementById('prop-opacity');
  var propText = document.getElementById('prop-text');
  var propFontSize = document.getElementById('prop-font-size');
  var propFontWeight = document.getElementById('prop-font-weight');
  var propColor = document.getElementById('prop-color');
  var propTextAlign = document.getElementById('prop-text-align');
  var propSrc = document.getElementById('prop-src');
  var propsContent = document.getElementById('props-content');
  var propsEmpty = document.getElementById('props-empty');
  var propsTitle = document.getElementById('props-title');
  var textProps = document.getElementById('text-props');
  var imageProps = document.getElementById('image-props');

  function initSelect() {
    // Resize handle interaction
    document.addEventListener('mousedown', function(e) {
      var handle = e.target.closest('.resize-handle');
      if (!handle) return;

      var elNode = handle.closest('.canvas-element');
      if (!elNode) return;

      isResizing = true;
      resizeHandle = handle.dataset.handle;
      resizeElementId = elNode.dataset.id;

      var el = getElementById(resizeElementId);
      if (!el) return;

      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      resizeStartEl = { x: el.x, y: el.y, w: el.w, h: el.h };

      e.preventDefault();
      e.stopPropagation();
    }, true);

    document.addEventListener('mousemove', function(e) {
      if (!isResizing) return;

      var el = getElementById(resizeElementId);
      if (!el) return;

      var dx = e.clientX - resizeStartX;
      var dy = e.clientY - resizeStartY;
      var minSize = 10;

      var newX = resizeStartEl.x;
      var newY = resizeStartEl.y;
      var newW = resizeStartEl.w;
      var newH = resizeStartEl.h;

      switch (resizeHandle) {
        case 'tl': newX += dx; newY += dy; newW -= dx; newH -= dy; break;
        case 'tc': newY += dy; newH -= dy; break;
        case 'tr': newY += dy; newW += dx; newH -= dy; break;
        case 'ml': newX += dx; newW -= dx; break;
        case 'mr': newW += dx; break;
        case 'bl': newX += dx; newW -= dx; newH += dy; break;
        case 'bc': newH += dy; break;
        case 'br': newW += dx; newH += dy; break;
      }

      if (newW < minSize) {
        if (resizeHandle.indexOf('l') !== -1) newX = resizeStartEl.x + resizeStartEl.w - minSize;
        newW = minSize;
      }
      if (newH < minSize) {
        if (resizeHandle.indexOf('t') !== -1) newY = resizeStartEl.y + resizeStartEl.h - minSize;
        newH = minSize;
      }

      var hasParent = findParent(resizeElementId);
      if (!hasParent) {
        var snapped = snapPosition(resizeElementId, newX, newY, newW, newH);
        el.x = snapped.x;
        el.y = snapped.y;
      } else {
        el.x = Math.round(newX);
        el.y = Math.round(newY);
      }
      el.w = Math.round(newW);
      el.h = Math.round(newH);

      emit('stateChange');
    });

    document.addEventListener('mouseup', function() {
      if (isResizing) {
        isResizing = false;
        hideGuides();
        saveState();
        emit('stateChange');
        updatePropsPanel();
      }
    });

    // Property panel inputs
    propX.addEventListener('change', function() { updateProp('x', Number(propX.value)); });
    propY.addEventListener('change', function() { updateProp('y', Number(propY.value)); });
    propW.addEventListener('change', function() { updateProp('w', Number(propW.value)); });
    propH.addEventListener('change', function() { updateProp('h', Number(propH.value)); });
    propBg.addEventListener('input', function() { updateProp('bg', propBg.value); });
    propRadius.addEventListener('change', function() { updateProp('radius', Number(propRadius.value)); });
    propOpacity.addEventListener('change', function() { updateProp('opacity', Number(propOpacity.value)); });
    propText.addEventListener('input', function() { updateProp('text', propText.value); });
    propFontSize.addEventListener('change', function() { updateProp('fontSize', Number(propFontSize.value)); });
    propFontWeight.addEventListener('change', function() { updateProp('fontWeight', propFontWeight.value); });
    propColor.addEventListener('input', function() { updateProp('color', propColor.value); });
    propTextAlign.addEventListener('change', function() { updateProp('textAlign', propTextAlign.value); });
    propSrc.addEventListener('change', function() { updateProp('src', propSrc.value); });

    document.getElementById('btn-delete').addEventListener('click', function() {
      if (!state.selectedId) return;
      saveState();
      deleteSelected();
    });

    on('selectionChange', updatePropsPanel);
  }

  function updateProp(key, value) {
    if (!state.selectedId) return;
    var el = getElementById(state.selectedId);
    if (!el) return;
    saveState();
    el[key] = value;
    emit('stateChange');
  }

  function deleteSelected() {
    if (!state.selectedId) return;
    var id = state.selectedId;

    function removeFromList(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) { list.splice(i, 1); return true; }
        if (list[i].children && removeFromList(list[i].children)) return true;
      }
      return false;
    }

    removeFromList(state.elements);
    state.selectedId = null;
    emit('stateChange');
    emit('selectionChange');
  }

  function updatePropsPanel() {
    var el = state.selectedId ? getElementById(state.selectedId) : null;

    if (!el) {
      propsContent.classList.add('hidden');
      propsEmpty.classList.remove('hidden');
      return;
    }

    propsEmpty.classList.add('hidden');
    propsContent.classList.remove('hidden');
    propsTitle.textContent = el.type.charAt(0).toUpperCase() + el.type.slice(1) + ' Properties';

    propX.value = el.x;
    propY.value = el.y;
    propW.value = el.w;
    propH.value = el.h;
    propBg.value = el.bg || '#ffffff';
    propRadius.value = el.radius || 0;
    propOpacity.value = el.opacity !== undefined ? el.opacity : 1;

    var isTextType = el.type === 'text' || el.type === 'button' || el.type === 'input';
    if (isTextType) textProps.classList.remove('hidden');
    else textProps.classList.add('hidden');
    if (el.type === 'image') imageProps.classList.remove('hidden');
    else imageProps.classList.add('hidden');

    if (isTextType) {
      propText.value = el.text || '';
      propFontSize.value = el.fontSize || 14;
      propFontWeight.value = el.fontWeight || 'normal';
      propColor.value = el.color || '#000000';
      propTextAlign.value = el.textAlign || 'left';
    }

    if (el.type === 'image') {
      propSrc.value = el.src || '';
    }
  }

  G.initSelect = initSelect;
  G.deleteSelected = deleteSelected;
})();
