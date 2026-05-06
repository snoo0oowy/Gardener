// Global state management
window.Gardener = window.Gardener || {};

let _nextId = 1;

function generateId() {
  return `el_${_nextId++}`;
}

function createDefaultElement(type, x, y) {
  x = x || 0;
  y = y || 0;
  var base = {
    id: generateId(),
    type: type,
    x: Math.round(x),
    y: Math.round(y),
    w: type === 'button' ? 120 : type === 'input' ? 200 : type === 'text' ? 150 : 200,
    h: type === 'button' ? 44 : type === 'input' ? 40 : type === 'text' ? 30 : 100,
    bg: type === 'button' ? '#007AFF' : type === 'view' ? '#f0f0f5' : type === 'image' ? '#e8e8ec' : '#ffffff',
    radius: type === 'button' ? 8 : type === 'input' ? 6 : 0,
    shadow: '',
    opacity: 1,
    children: [],
  };

  if (type === 'text' || type === 'button') {
    base.text = type === 'button' ? 'Button' : 'Text';
    base.fontSize = type === 'button' ? 16 : 14;
    base.fontWeight = type === 'button' ? 'bold' : 'normal';
    base.color = type === 'button' ? '#ffffff' : '#000000';
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
    base.bg = '#f5f5f5';
  }

  return base;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// State
var state = {
  canvas: { width: 390, height: 844 },
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

window.Gardener.state = state;
window.Gardener.generateId = generateId;
window.Gardener.createDefaultElement = createDefaultElement;
window.Gardener.deepClone = deepClone;
window.Gardener.getElementById = getElementById;
window.Gardener.findParent = findParent;
window.Gardener.removeElement = removeElement;
window.Gardener.on = on;
window.Gardener.emit = emit;
