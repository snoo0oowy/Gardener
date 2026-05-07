// Undo/Redo stack
(function() {
  var G = window.Gardener;
  var state = G.state;
  var deepClone = G.deepClone;
  var emit = G.emit;

  var undoStack = [];
  var redoStack = [];
  var MAX_STACK = 50;

  function saveState() {
    undoStack.push(deepClone(state.elements));
    if (undoStack.length > MAX_STACK) undoStack.shift();
    redoStack.length = 0;
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(deepClone(state.elements));
    state.elements = undoStack.pop();
    state.selectedId = null;
    emit('stateChange');
    emit('selectionChange');
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(deepClone(state.elements));
    state.elements = redoStack.pop();
    state.selectedId = null;
    emit('stateChange');
    emit('selectionChange');
  }

  G.saveState = saveState;
  G.undo = undo;
  G.redo = redo;
})();
