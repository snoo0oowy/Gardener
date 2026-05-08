// Layer tree panel
(function() {
  var G = window.Gardener;
  var state = G.state;
  var on = G.on;
  var emit = G.emit;

  var treeEl = document.getElementById('layer-tree');

  var typeIcons = {
    view: '□',
    image: '📷',
    text: 'T',
    button: '▶',
    input: '✎',
    scrollview: '↕',
    slider: '—',
    icon: '◎',
    switch: '◑',
    avatar: 'A',
  };

  function renderTree() {
    treeEl.innerHTML = '';
    for (var i = 0; i < state.elements.length; i++) {
      buildTreeItem(state.elements[i], treeEl);
    }
  }

  function buildTreeItem(elData, parent) {
    var item = document.createElement('div');
    item.className = 'layer-item';
    if (state.selectedId === elData.id) item.classList.add('selected');
    item.dataset.id = elData.id;

    var icon = document.createElement('span');
    icon.className = 'layer-icon';
    icon.textContent = typeIcons[elData.type] || '?';

    var label = document.createElement('span');
    label.className = 'layer-label';
    label.textContent = formatLabel(elData);

    item.appendChild(icon);
    item.appendChild(label);

    item.addEventListener('click', function(e) {
      e.stopPropagation();
      state.selectedId = elData.id;
      emit('selectionChange');
    });

    parent.appendChild(item);

    if (elData.children && elData.children.length > 0) {
      var childContainer = document.createElement('div');
      childContainer.className = 'layer-children';
      for (var c = 0; c < elData.children.length; c++) {
        buildTreeItem(elData.children[c], childContainer);
      }
      parent.appendChild(childContainer);
    }
  }

  function formatLabel(el) {
    var defaultName = el.type === 'scrollview' ? 'ScrollView'
      : el.type.charAt(0).toUpperCase() + el.type.slice(1);
    if (el.name && el.name !== defaultName) return el.name;

    var name = defaultName;
    if (el.type === 'text' || el.type === 'button') {
      var t = (el.text || '').trim();
      if (t) name += ' "' + (t.length > 12 ? t.slice(0, 12) + '…' : t) + '"';
    }
    if (el.type === 'input' && el.placeholder) {
      name += ' "' + el.placeholder + '"';
    }
    if (el.type === 'icon' && el.iconName) {
      name += ' "' + el.iconName + '"';
    }
    if (el.type === 'avatar') {
      if (el.mode === 'image' && el.src) name += ' [image]';
      else if (el.initials) name += ' "' + el.initials + '"';
    }
    return name;
  }

  function updateSelectionInTree() {
    var items = treeEl.querySelectorAll('.layer-item');
    for (var i = 0; i < items.length; i++) {
      if (items[i].dataset.id === state.selectedId) {
        items[i].classList.add('selected');
      } else {
        items[i].classList.remove('selected');
      }
    }
  }

  on('canvasChange', renderTree);
  on('selectionChange', updateSelectionInTree);
})();
