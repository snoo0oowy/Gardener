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
  var snapResize = G.snapResize;
  var hideGuides = G.hideGuides;

  var isResizing = false;
  var resizeHandle = null;
  var resizeElementId = null;
  var resizeStartX = 0;
  var resizeStartY = 0;
  var resizeStartEl = {};

  var saveDebounce = null;
  var propName = document.getElementById('prop-name');
  var propX = document.getElementById('prop-x');
  var propY = document.getElementById('prop-y');
  var propW = document.getElementById('prop-w');
  var propH = document.getElementById('prop-h');
  var propBg = document.getElementById('prop-bg');
  var propBgTransparent = document.getElementById('prop-bg-transparent');
  var propRadius = document.getElementById('prop-radius');
  var propOpacity = document.getElementById('prop-opacity');
  var propText = document.getElementById('prop-text');
  var propFontSize = document.getElementById('prop-font-size');
  var propFontWeight = document.getElementById('prop-font-weight');
  var propColor = document.getElementById('prop-color');
  var propTextAlign = document.getElementById('prop-text-align');
  var propSrc = document.getElementById('prop-src');
  var propScrollDirection = document.getElementById('prop-scroll-direction');
  var propSliderValue = document.getElementById('prop-slider-value');
  var propSliderMin = document.getElementById('prop-slider-min');
  var propSliderMax = document.getElementById('prop-slider-max');
  var propSliderFill = document.getElementById('prop-slider-fill');
  var propSliderThumb = document.getElementById('prop-slider-thumb');
  var propSliderTrack = document.getElementById('prop-slider-track');
  var propIconName = document.getElementById('prop-icon-name');
  var propIconColor = document.getElementById('prop-icon-color');
  var propSwitchChecked = document.getElementById('prop-switch-checked');
  var propSwitchOnColor = document.getElementById('prop-switch-on-color');
  var propSwitchOffColor = document.getElementById('prop-switch-off-color');
  var propsContent = document.getElementById('props-content');
  var propsEmpty = document.getElementById('props-empty');
  var propsTitle = document.getElementById('props-title');
  var textProps = document.getElementById('text-props');
  var imageProps = document.getElementById('image-props');
  var scrollviewProps = document.getElementById('scrollview-props');
  var sliderProps = document.getElementById('slider-props');
  var iconProps = document.getElementById('icon-props');
  var switchProps = document.getElementById('switch-props');

  function initSelect() {
    // Resize handle interaction
    document.addEventListener('mousedown', function(e) {
      var handle = e.target.closest('.resize-handle');
      if (!handle) return;

      var group = handle.closest('.handles-group');
      if (!group) return;

      isResizing = true;
      resizeHandle = handle.dataset.handle;
      resizeElementId = group.dataset.forId;

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
        var snapped = snapResize(resizeElementId, resizeHandle, newX, newY, newW, newH);
        el.x = snapped.x;
        el.y = snapped.y;
        el.w = snapped.w;
        el.h = snapped.h;
      } else {
        el.x = Math.round(newX);
        el.y = Math.round(newY);
        el.w = Math.round(newW);
        el.h = Math.round(newH);
      }

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
    propName.addEventListener('input', function() { updatePropLive('name', propName.value); });
    propX.addEventListener('change', function() { updateProp('x', Number(propX.value)); });
    propY.addEventListener('change', function() { updateProp('y', Number(propY.value)); });
    propW.addEventListener('change', function() { updateProp('w', Number(propW.value)); });
    propH.addEventListener('change', function() { updateProp('h', Number(propH.value)); });
    propBg.addEventListener('input', function() { updateProp('bg', propBg.value); });
    propBgTransparent.addEventListener('change', function() {
      propBg.disabled = propBgTransparent.checked;
      updateProp('bg', propBgTransparent.checked ? 'transparent' : propBg.value);
    });
    propRadius.addEventListener('change', function() { updateProp('radius', Number(propRadius.value)); });
    propOpacity.addEventListener('change', function() { updateProp('opacity', Number(propOpacity.value)); });
    propText.addEventListener('input', function() { updatePropLive('text', propText.value); });
    propFontSize.addEventListener('change', function() { updateProp('fontSize', Number(propFontSize.value)); });
    propFontWeight.addEventListener('change', function() { updateProp('fontWeight', propFontWeight.value); });
    propColor.addEventListener('input', function() { updateProp('color', propColor.value); });
    propTextAlign.addEventListener('change', function() { updateProp('textAlign', propTextAlign.value); });
    propSrc.addEventListener('change', function() { updateProp('src', propSrc.value); });
    propScrollDirection.addEventListener('change', function() { updateProp('scrollDirection', propScrollDirection.value); });
    propSliderValue.addEventListener('change', function() { updateProp('value', Number(propSliderValue.value)); });
    propSliderMin.addEventListener('change', function() { updateProp('min', Number(propSliderMin.value)); });
    propSliderMax.addEventListener('change', function() { updateProp('max', Number(propSliderMax.value)); });
    propSliderFill.addEventListener('input', function() { updateProp('fillColor', propSliderFill.value); });
    propSliderThumb.addEventListener('input', function() { updateProp('thumbColor', propSliderThumb.value); });
    propSliderTrack.addEventListener('input', function() { updateProp('trackColor', propSliderTrack.value); });
    propIconName.addEventListener('input', function() { updatePropLive('iconName', propIconName.value); });
    propIconColor.addEventListener('input', function() { updateProp('color', propIconColor.value); });
    propSwitchChecked.addEventListener('change', function() { updateProp('checked', propSwitchChecked.checked); });
    propSwitchOnColor.addEventListener('input', function() { updateProp('onColor', propSwitchOnColor.value); });
    propSwitchOffColor.addEventListener('input', function() { updateProp('offColor', propSwitchOffColor.value); });

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

  function updatePropLive(key, value) {
    if (!state.selectedId) return;
    var el = getElementById(state.selectedId);
    if (!el) return;
    el[key] = value;
    emit('stateChange');
    clearTimeout(saveDebounce);
    saveDebounce = setTimeout(function() { saveState(); }, 600);
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

    propName.value = el.name || '';
    propX.value = el.x;
    propY.value = el.y;
    propW.value = el.w;
    propH.value = el.h;
    var isTransparent = !el.bg || el.bg === 'transparent';
    propBgTransparent.checked = isTransparent;
    propBg.disabled = isTransparent;
    propBg.value = isTransparent ? '#ffffff' : el.bg;
    propRadius.value = el.radius || 0;
    propOpacity.value = el.opacity !== undefined ? el.opacity : 1;

    var isTextType = el.type === 'text' || el.type === 'button' || el.type === 'input';
    if (isTextType) textProps.classList.remove('hidden');
    else textProps.classList.add('hidden');
    if (el.type === 'image') imageProps.classList.remove('hidden');
    else imageProps.classList.add('hidden');
    if (el.type === 'scrollview') scrollviewProps.classList.remove('hidden');
    else scrollviewProps.classList.add('hidden');
    if (el.type === 'slider') sliderProps.classList.remove('hidden');
    else sliderProps.classList.add('hidden');
    if (el.type === 'icon') iconProps.classList.remove('hidden');
    else iconProps.classList.add('hidden');
    if (el.type === 'switch') switchProps.classList.remove('hidden');
    else switchProps.classList.add('hidden');

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

    if (el.type === 'scrollview') {
      propScrollDirection.value = el.scrollDirection || 'vertical';
    }

    if (el.type === 'slider') {
      var sMin = el.min !== undefined ? el.min : 0;
      var sMax = el.max !== undefined ? el.max : 100;
      propSliderMin.value = sMin;
      propSliderMax.value = sMax;
      propSliderValue.min = sMin;
      propSliderValue.max = sMax;
      propSliderValue.value = el.value !== undefined ? el.value : 50;
      propSliderFill.value = el.fillColor || '#4a90c4';
      propSliderThumb.value = el.thumbColor || '#4a90c4';
      propSliderTrack.value = el.trackColor || '#d0d0d0';
    }

    if (el.type === 'icon') {
      propIconName.value = el.iconName || '';
      propIconColor.value = el.color || '#555555';
    }

    if (el.type === 'switch') {
      propSwitchChecked.checked = !!el.checked;
      propSwitchOnColor.value = el.onColor || '#4a90c4';
      propSwitchOffColor.value = el.offColor || '#d0d0d0';
    }
  }

  G.initSelect = initSelect;
  G.deleteSelected = deleteSelected;
})();
