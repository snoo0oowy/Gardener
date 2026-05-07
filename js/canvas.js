// Canvas rendering
(function() {
  var G = window.Gardener;
  var state = G.state;
  var on = G.on;

  var canvasEl = document.getElementById('canvas');

  function renderCanvas() {
    canvasEl.style.width = state.canvas.width + 'px';
    canvasEl.style.height = state.canvas.height + 'px';
    renderElements();
  }

  function renderElements() {
    var existing = canvasEl.querySelectorAll('.canvas-element');
    for (var i = 0; i < existing.length; i++) {
      existing[i].remove();
    }
    for (var j = 0; j < state.elements.length; j++) {
      renderElement(state.elements[j], canvasEl);
    }
    updateHandlesOverlay();
  }

  function updateHandlesOverlay() {
    var overlay = document.getElementById('handles-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    if (!state.selectedId) return;

    var elNode = canvasEl.querySelector('[data-id="' + state.selectedId + '"]');
    if (!elNode) return;

    var canvasRect = canvasEl.getBoundingClientRect();
    var elRect = elNode.getBoundingClientRect();

    var group = document.createElement('div');
    group.className = 'handles-group';
    group.dataset.forId = state.selectedId;
    group.style.left = (elRect.left - canvasRect.left) + 'px';
    group.style.top  = (elRect.top  - canvasRect.top)  + 'px';
    group.style.width  = elRect.width  + 'px';
    group.style.height = elRect.height + 'px';

    var handles = ['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br'];
    for (var i = 0; i < handles.length; i++) {
      var h = document.createElement('div');
      h.className = 'resize-handle ' + handles[i];
      h.dataset.handle = handles[i];
      group.appendChild(h);
    }
    overlay.appendChild(group);
  }

  function renderElement(elData, parent) {
    var el = document.createElement('div');
    el.className = 'canvas-element';
    el.dataset.id = elData.id;
    el.dataset.type = elData.type;

    el.style.left = elData.x + 'px';
    el.style.top = elData.y + 'px';
    el.style.width = elData.w + 'px';
    el.style.height = elData.h + 'px';
    el.style.opacity = elData.opacity;
    el.style.borderRadius = elData.radius + 'px';

    el.style.backgroundColor = elData.bg || '';

    if (elData.shadow) {
      el.style.boxShadow = elData.shadow;
    }

    switch (elData.type) {
      case 'text':
        el.style.fontSize = elData.fontSize + 'px';
        el.style.fontWeight = elData.fontWeight;
        el.style.color = elData.color;
        el.style.textAlign = elData.textAlign;
        el.style.lineHeight = '1.4';
        el.textContent = elData.text || 'Text';
        el.style.padding = '4px';
        break;

      case 'button':
        el.style.fontSize = elData.fontSize + 'px';
        el.style.fontWeight = elData.fontWeight;
        el.style.color = elData.color;
        el.style.textAlign = elData.textAlign;
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = elData.textAlign === 'center' ? 'center' : elData.textAlign === 'right' ? 'flex-end' : 'flex-start';
        el.style.padding = '0 16px';
        el.textContent = elData.text || 'Button';
        break;

      case 'input':
        el.style.fontSize = elData.fontSize + 'px';
        el.style.color = elData.color;
        el.style.border = '1px solid #ccc';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.padding = '0 8px';
        var placeholder = document.createElement('span');
        placeholder.style.color = '#999';
        placeholder.style.fontSize = elData.fontSize + 'px';
        placeholder.textContent = elData.placeholder || 'Input';
        el.appendChild(placeholder);
        break;

      case 'image':
        if (elData.src) {
          var img = document.createElement('img');
          img.src = elData.src;
          img.draggable = false;
          el.appendChild(img);
        } else {
          var ph = document.createElement('div');
          ph.className = 'image-placeholder';
          ph.textContent = 'Image';
          ph.style.fontSize = '12px';
          ph.style.color = '#999';
          el.appendChild(ph);
        }
        break;

      case 'scrollview':
        var dir = elData.scrollDirection || 'vertical';
        var scrollLabel = document.createElement('div');
        scrollLabel.className = 'scrollview-label';
        var dirIcon = dir === 'horizontal' ? '↔' : dir === 'all' ? '⊕' : '↕';
        scrollLabel.textContent = dirIcon + ' ScrollView';
        el.appendChild(scrollLabel);
        var scrollInner = document.createElement('div');
        scrollInner.className = 'scroll-inner';
        if (dir === 'vertical')   { scrollInner.style.overflowY = 'auto'; scrollInner.style.overflowX = 'hidden'; }
        if (dir === 'horizontal') { scrollInner.style.overflowX = 'auto'; scrollInner.style.overflowY = 'hidden'; }
        if (dir === 'all')        { scrollInner.style.overflow = 'auto'; }
        el.appendChild(scrollInner);
        break;

      case 'slider': {
        var sMin = elData.min !== undefined ? elData.min : 0;
        var sMax = elData.max !== undefined ? elData.max : 100;
        var sVal = elData.value !== undefined ? elData.value : 50;
        var pct = sMax > sMin ? ((sVal - sMin) / (sMax - sMin)) * 100 : 0;
        pct = Math.max(0, Math.min(100, pct));

        var trackBg = document.createElement('div');
        trackBg.className = 'slider-track-bg';
        trackBg.style.background = elData.trackColor || '#d0d0d0';

        var fill = document.createElement('div');
        fill.className = 'slider-fill';
        fill.style.width = pct + '%';
        fill.style.background = elData.fillColor || '#4a90c4';

        var thumb = document.createElement('div');
        thumb.className = 'slider-thumb';
        thumb.style.left = pct + '%';
        thumb.style.background = elData.thumbColor || '#4a90c4';

        trackBg.appendChild(fill);
        trackBg.appendChild(thumb);
        el.appendChild(trackBg);
        break;
      }

      case 'switch': {
        var swOn = !!elData.checked;
        var swOnColor = elData.onColor || '#4a90c4';
        var swOffColor = elData.offColor || '#d0d0d0';
        var thumbSize = elData.h - 6;
        el.style.borderRadius = '999px';
        el.style.backgroundColor = swOn ? swOnColor : swOffColor;
        var swThumb = document.createElement('div');
        swThumb.className = 'switch-thumb';
        swThumb.style.width = thumbSize + 'px';
        swThumb.style.height = thumbSize + 'px';
        swThumb.style.top = '3px';
        swThumb.style.left = (swOn ? (elData.w - thumbSize - 3) : 3) + 'px';
        el.appendChild(swThumb);
        break;
      }

      case 'icon': {
        var iconLabel = document.createElement('span');
        iconLabel.className = 'icon-label';
        iconLabel.style.color = elData.color || '#555555';
        iconLabel.textContent = elData.iconName || 'icon';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.appendChild(iconLabel);
        break;
      }

      case 'view':
      default:
        break;
    }

    if (state.selectedId === elData.id) {
      el.classList.add('selected');
      el.style.zIndex = '1';
    }

    parent.appendChild(el);

    if (elData.children) {
      var childContainer = elData.type === 'scrollview'
        ? el.querySelector('.scroll-inner')
        : el;
      for (var c = 0; c < elData.children.length; c++) {
        renderElement(elData.children[c], childContainer);
      }
    }
  }

  on('stateChange', renderCanvas);
  on('selectionChange', updateHandlesOverlay);

  G.canvasEl = canvasEl;
  G.renderCanvas = renderCanvas;
  G.renderElements = renderElements;
})();
