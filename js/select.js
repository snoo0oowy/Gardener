// Selection, resize, and properties panel
(function() {
  var G = window.Gardener;
  var state = G.state;
  var getElementById = G.getElementById;
  var findParent = G.findParent;
  var getElementBounds = G.getElementBounds;
  var emit = G.emit;
  var on = G.on;
  var saveState = G.saveState;
  var snapPosition = G.snapPosition;
  var snapResize = G.snapResize;
  var hideGuides = G.hideGuides;

  var isResizing = false;
  var resizeHandle = null;
  var resizeElementId = null;
  var resizeStartX = 0;
  var resizeStartY = 0;
  var resizeStartEl = {};

  var saveDebounce = null;

  // Property binding configuration
  var propConfigs = [
    { key: 'x', id: 'prop-x', event: 'change', parse: Number },
    { key: 'y', id: 'prop-y', event: 'change', parse: Number },
    { key: 'w', id: 'prop-w', event: 'change', parse: Number },
    { key: 'h', id: 'prop-h', event: 'change', parse: Number },
    { key: 'bg', id: 'prop-bg', event: 'input' },
    { key: 'radius', id: 'prop-radius', event: 'change', parse: Number },
    { key: 'opacity', id: 'prop-opacity', event: 'change', parse: Number },
    { key: 'text', id: 'prop-text', event: 'input', live: true },
    { key: 'fontSize', id: 'prop-font-size', event: 'change', parse: Number },
    { key: 'fontWeight', id: 'prop-font-weight', event: 'change' },
    { key: 'color', id: 'prop-color', event: 'input' },
    { key: 'textAlign', id: 'prop-text-align', event: 'change' },
    { key: 'src', id: 'prop-src', event: 'change' },
    { key: 'scrollDirection', id: 'prop-scroll-direction', event: 'change' },
    { key: 'min', id: 'prop-slider-min', event: 'change', parse: Number },
    { key: 'max', id: 'prop-slider-max', event: 'change', parse: Number },
    { key: 'fillColor', id: 'prop-slider-fill', event: 'input' },
    { key: 'thumbColor', id: 'prop-slider-thumb', event: 'input' },
    { key: 'trackColor', id: 'prop-slider-track', event: 'input' },
    { key: 'iconName', id: 'prop-icon-name', event: 'input', live: true },
    { key: 'color', id: 'prop-icon-color', event: 'input' },
    { key: 'onColor', id: 'prop-switch-on-color', event: 'input' },
    { key: 'offColor', id: 'prop-switch-off-color', event: 'input' },
  ];

  // DOM references — populated in initSelect()
  var els = {};

  function initSelect() {
    // Cache all DOM references
    var ids = [
      'prop-name', 'prop-x', 'prop-y', 'prop-w', 'prop-h',
      'prop-bg', 'prop-bg-transparent', 'prop-radius', 'prop-opacity',
      'prop-text', 'prop-font-size', 'prop-font-weight', 'prop-color', 'prop-text-align',
      'prop-src', 'prop-scroll-direction',
      'prop-slider-value', 'prop-slider-min', 'prop-slider-max',
      'prop-slider-fill', 'prop-slider-thumb', 'prop-slider-track',
      'prop-icon-name', 'prop-icon-color',
      'prop-switch-checked', 'prop-switch-on-color', 'prop-switch-off-color',
      'props-content', 'props-empty', 'props-title',
      'text-props', 'image-props', 'scrollview-props',
      'slider-props', 'icon-props', 'switch-props',
      'btn-delete'
    ];
    for (var i = 0; i < ids.length; i++) {
      els[ids[i]] = document.getElementById(ids[i]);
    }

    // Property bindings via config loop
    for (var j = 0; j < propConfigs.length; j++) {
      (function(cfg) {
        var input = els[cfg.id];
        if (!input) return;
        input.addEventListener(cfg.event, function() {
          var value = cfg.parse ? cfg.parse(input.value) : input.value;
          if (cfg.live) updatePropLive(cfg.key, value);
          else updateProp(cfg.key, value);
        });
      })(propConfigs[j]);
    }

    // Special: name (live)
    els['prop-name'].addEventListener('input', function() {
      updatePropLive('name', els['prop-name'].value);
    });

    // Special: transparent background toggle
    els['prop-bg-transparent'].addEventListener('change', function() {
      els['prop-bg'].disabled = els['prop-bg-transparent'].checked;
      updateProp('bg', els['prop-bg-transparent'].checked ? 'transparent' : els['prop-bg'].value);
    });

    // Special: slider value (dynamic min/max)
    els['prop-slider-value'].addEventListener('change', function() {
      updateProp('value', Number(els['prop-slider-value'].value));
    });

    // Special: switch checked (checkbox)
    els['prop-switch-checked'].addEventListener('change', function() {
      updateProp('checked', els['prop-switch-checked'].checked);
    });

    // Delete button
    els['btn-delete'].addEventListener('click', function() {
      if (!state.selectedId) return;
      saveState();
      deleteSelected();
    });

    on('selectionChange', updatePropsPanel);
  }

  // Resize handle — called by unified dispatcher in app.js
  function resizeStart(e) {
    var handle = e.target.closest('.resize-handle');
    if (!handle) return false;

    var group = handle.closest('.handles-group');
    if (!group) return false;

    isResizing = true;
    resizeHandle = handle.dataset.handle;
    resizeElementId = group.dataset.forId;

    var el = getElementById(resizeElementId);
    if (!el) return false;

    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartEl = { x: el.x, y: el.y, w: el.w, h: el.h };

    e.preventDefault();
    e.stopPropagation();
    return true;
  }

  function resizeMove(e) {
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

    var parentBounds = getElementBounds(resizeElementId);
    if (parentBounds) {
      var snapped = snapResize(resizeElementId, resizeHandle, newX, newY, newW, newH, parentBounds);
      el.x = snapped.x;
      el.y = snapped.y;
      el.w = snapped.w;
      el.h = snapped.h;
    } else {
      var snappedFree = snapResize(resizeElementId, resizeHandle, newX, newY, newW, newH);
      el.x = snappedFree.x;
      el.y = snappedFree.y;
      el.w = snappedFree.w;
      el.h = snappedFree.h;
    }

    emit('selectionChange');
  }

  function resizeEnd() {
    if (!isResizing) return;
    isResizing = false;
    hideGuides();
    saveState();
    emit('canvasChange');
    updatePropsPanel();
  }

  function updateProp(key, value) {
    if (!state.selectedId) return;
    var el = getElementById(state.selectedId);
    if (!el) return;
    saveState();
    el[key] = value;
    emit('canvasChange');
  }

  function updatePropLive(key, value) {
    if (!state.selectedId) return;
    var el = getElementById(state.selectedId);
    if (!el) return;
    el[key] = value;
    emit('canvasChange');
    clearTimeout(saveDebounce);
    saveDebounce = setTimeout(function() { saveState(); }, 600);
  }

  function deleteSelected() {
    if (!state.selectedId) return;
    G.removeElement(state.selectedId);
    state.selectedId = null;
    emit('canvasChange');
    emit('selectionChange');
  }

  function updatePropsPanel() {
    var el = state.selectedId ? getElementById(state.selectedId) : null;

    if (!el) {
      els['props-content'].classList.add('hidden');
      els['props-empty'].classList.remove('hidden');
      return;
    }

    els['props-empty'].classList.add('hidden');
    els['props-content'].classList.remove('hidden');
    els['props-title'].textContent = el.type.charAt(0).toUpperCase() + el.type.slice(1) + ' Properties';

    els['prop-name'].value = el.name || '';
    els['prop-x'].value = el.x;
    els['prop-y'].value = el.y;
    els['prop-w'].value = el.w;
    els['prop-h'].value = el.h;
    var isTransparent = !el.bg || el.bg === 'transparent';
    els['prop-bg-transparent'].checked = isTransparent;
    els['prop-bg'].disabled = isTransparent;
    els['prop-bg'].value = isTransparent ? '#ffffff' : el.bg;
    els['prop-radius'].value = el.radius || 0;
    els['prop-opacity'].value = el.opacity !== undefined ? el.opacity : 1;

    var isTextType = el.type === 'text' || el.type === 'button' || el.type === 'input';
    if (isTextType) els['text-props'].classList.remove('hidden');
    else els['text-props'].classList.add('hidden');
    if (el.type === 'image') els['image-props'].classList.remove('hidden');
    else els['image-props'].classList.add('hidden');
    if (el.type === 'scrollview') els['scrollview-props'].classList.remove('hidden');
    else els['scrollview-props'].classList.add('hidden');
    if (el.type === 'slider') els['slider-props'].classList.remove('hidden');
    else els['slider-props'].classList.add('hidden');
    if (el.type === 'icon') els['icon-props'].classList.remove('hidden');
    else els['icon-props'].classList.add('hidden');
    if (el.type === 'switch') els['switch-props'].classList.remove('hidden');
    else els['switch-props'].classList.add('hidden');

    if (isTextType) {
      els['prop-text'].value = el.text || '';
      els['prop-font-size'].value = el.fontSize || 14;
      els['prop-font-weight'].value = el.fontWeight || 'normal';
      els['prop-color'].value = el.color || '#000000';
      els['prop-text-align'].value = el.textAlign || 'left';
    }

    if (el.type === 'image') {
      els['prop-src'].value = el.src || '';
    }

    if (el.type === 'scrollview') {
      els['prop-scroll-direction'].value = el.scrollDirection || 'vertical';
    }

    if (el.type === 'slider') {
      var sMin = el.min !== undefined ? el.min : 0;
      var sMax = el.max !== undefined ? el.max : 100;
      els['prop-slider-min'].value = sMin;
      els['prop-slider-max'].value = sMax;
      els['prop-slider-value'].min = sMin;
      els['prop-slider-value'].max = sMax;
      els['prop-slider-value'].value = el.value !== undefined ? el.value : 50;
      els['prop-slider-fill'].value = el.fillColor || '#4a90c4';
      els['prop-slider-thumb'].value = el.thumbColor || '#4a90c4';
      els['prop-slider-track'].value = el.trackColor || '#d0d0d0';
    }

    if (el.type === 'icon') {
      els['prop-icon-name'].value = el.iconName || '';
      els['prop-icon-color'].value = el.color || '#555555';
    }

    if (el.type === 'switch') {
      els['prop-switch-checked'].checked = !!el.checked;
      els['prop-switch-on-color'].value = el.onColor || '#4a90c4';
      els['prop-switch-off-color'].value = el.offColor || '#d0d0d0';
    }
  }

  G.initSelect = initSelect;
  G.deleteSelected = deleteSelected;
  G.resizeStart = resizeStart;
  G.resizeMove = resizeMove;
  G.resizeEnd = resizeEnd;
})();
