// Global state management
window.Gardener = window.Gardener || {};

let _nextId = 1;

function generateId() {
  return `el_${_nextId++}`;
}

var _morandiPalette = [
  '#e8dede', '#dce6da', '#d8e2ea', '#ede4d8', '#e4dff0',
  '#d8e8e6', '#ece8e0', '#eedad8', '#e0e8d4', '#e4dce8',
  '#eaddd8', '#d8eae4', '#dce4ec', '#ece0d8', '#e0daea',
  '#e6e8dc', '#ecdce8', '#d8e4e0', '#eee8d8', '#dcdce8',
];

function randomMorandiColor() {
  return _morandiPalette[Math.floor(Math.random() * _morandiPalette.length)];
}

function createDefaultElement(type, x, y) {
  x = x || 0;
  y = y || 0;
  var defaultName = type === 'scrollview' ? 'ScrollView'
    : type.charAt(0).toUpperCase() + type.slice(1);

  var base = {
    id: generateId(),
    type: type,
    name: defaultName,
    x: Math.round(x),
    y: Math.round(y),
    w: type === 'slider' ? 200 : type === 'icon' ? 40 : type === 'switch' ? 50 : type === 'avatar' ? 48 : type === 'button' ? 120 : type === 'input' ? 200 : type === 'text' ? 150 : 200,
    h: type === 'slider' ? 36 : type === 'icon' ? 40 : type === 'switch' ? 28 : type === 'avatar' ? 48 : type === 'button' ? 44 : type === 'input' ? 40 : type === 'text' ? 30 : 100,
    bg: type === 'slider' ? 'transparent' : type === 'switch' ? 'transparent' : type === 'button' ? '#4a90c4' : type === 'view' ? randomMorandiColor() : type === 'image' ? '#e8e8ec' : type === 'icon' ? randomMorandiColor() : type === 'avatar' ? randomMorandiColor() : type === 'text' ? 'transparent' : '#ffffff',
    radius: type === 'button' ? 8 : type === 'input' ? 6 : type === 'avatar' ? 999 : 0,
    shadow: '',
    opacity: 1,
    children: [],
  };

  if (type === 'text' || type === 'button') {
    base.text = type === 'button' ? 'Button' : 'Text';
    base.fontSize = type === 'button' ? 16 : 14;
    base.fontWeight = type === 'button' ? 'bold' : 'normal';
    base.color = type === 'button' ? '#f0f4f8' : '#000000';
    base.textAlign = type === 'button' ? 'center' : 'left';
  }

  if (type === 'input') {
    base.text = '';
    base.fontSize = 14;
    base.fontWeight = 'normal';
    base.color = '#000000';
    base.textAlign = 'left';
    base.bg = '#ffffff';
    base.placeholder = 'Input';
  }

  if (type === 'image') {
    base.src = '';
  }

  if (type === 'scrollview') {
    base.bg = randomMorandiColor();
    base.scrollDirection = 'vertical';
  }

  if (type === 'slider') {
    base.min = 0;
    base.max = 100;
    base.value = 50;
    base.fillColor = '#4a90c4';
    base.thumbColor = '#4a90c4';
    base.trackColor = '#d0d0d0';
  }

  if (type === 'icon') {
    base.iconName = 'icon';
    base.color = '#555555';
  }

  if (type === 'switch') {
    base.checked = false;
    base.onColor = '#4a90c4';
    base.offColor = '#d0d0d0';
  }

  if (type === 'avatar') {
    base.mode = 'initials';
    base.initials = 'AB';
    base.src = '';
    base.color = '#ffffff';
  }

  return base;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// State
var state = {
  canvas: { width: 393, height: 852 },
  elements: [],
  selectedId: null,
};

// Event system
var _listeners = {};

function on(event, fn) {
  if (!_listeners[event]) _listeners[event] = [];
  _listeners[event].push(fn);
}

function emit(event, data) {
  var fns = _listeners[event] || [];
  for (var i = 0; i < fns.length; i++) {
    fns[i](data);
  }
}

// State mutation helpers
function getElementById(id, list) {
  list = list || state.elements;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
    if (list[i].children) {
      var found = getElementById(id, list[i].children);
      if (found) return found;
    }
  }
  return null;
}

function findParent(id, list) {
  list = list || state.elements;
  for (var i = 0; i < list.length; i++) {
    if (list[i].children) {
      for (var j = 0; j < list[i].children.length; j++) {
        if (list[i].children[j].id === id) return list[i];
      }
      var found = findParent(id, list[i].children);
      if (found) return found;
    }
  }
  return null;
}

function removeElement(id, list) {
  list = list || state.elements;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list.splice(i, 1);
      return true;
    }
    if (list[i].children && removeElement(id, list[i].children)) return true;
  }
  return false;
}

function getElementBounds(id) {
  var el = getElementById(id);
  if (!el) return null;
  var parent = findParent(id);
  if (!parent) return { x: el.x, y: el.y, w: el.w, h: el.h };
  var pp = getAbsolutePosition(parent.id);
  return { x: pp.x, y: pp.y, w: parent.w, h: parent.h };
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

window.Gardener.randomMorandiColor = randomMorandiColor;
window.Gardener.state = state;
window.Gardener.generateId = generateId;
window.Gardener.createDefaultElement = createDefaultElement;
window.Gardener.deepClone = deepClone;
window.Gardener.getElementById = getElementById;
window.Gardener.findParent = findParent;
window.Gardener.removeElement = removeElement;
window.Gardener.getElementBounds = getElementBounds;
window.Gardener.getAbsolutePosition = getAbsolutePosition;
window.Gardener.on = on;
window.Gardener.emit = emit;
