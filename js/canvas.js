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
    // Remove existing element nodes (keep guides)
    var existing = canvasEl.querySelectorAll('.canvas-element');
    for (var i = 0; i < existing.length; i++) {
      existing[i].remove();
    }
    for (var j = 0; j < state.elements.length; j++) {
      renderElement(state.elements[j], canvasEl);
    }
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

    if (elData.type !== 'text') {
      el.style.backgroundColor = elData.bg;
    }

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
        el.style.overflowY = 'auto';
        break;

      case 'view':
      default:
        break;
    }

    if (state.selectedId === elData.id) {
      el.classList.add('selected');
      addResizeHandles(el);
    }

    parent.appendChild(el);

    if (elData.children) {
      for (var c = 0; c < elData.children.length; c++) {
        renderElement(elData.children[c], el);
      }
    }
  }

  function addResizeHandles(el) {
    var handles = ['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br'];
    for (var i = 0; i < handles.length; i++) {
      var h = document.createElement('div');
      h.className = 'resize-handle ' + handles[i];
      h.dataset.handle = handles[i];
      el.appendChild(h);
    }
  }

  on('stateChange', renderElements);

  G.canvasEl = canvasEl;
  G.renderCanvas = renderCanvas;
  G.renderElements = renderElements;
})();
