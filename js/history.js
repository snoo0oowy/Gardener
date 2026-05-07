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
    undoStack.push({ elements: deepClone(state.elements), selectedId: state.selectedId });
    if (undoStack.length > MAX_STACK) undoStack.shift();
    redoStack.length = 0;
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push({ elements: deepClone(state.elements), selectedId: state.selectedId });
    var snapshot = undoStack.pop();
    state.elements = snapshot.elements;
    state.selectedId = snapshot.selectedId;
    emit('canvasChange');
    emit('selectionChange');
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push({ elements: deepClone(state.elements), selectedId: state.selectedId });
    var snapshot = redoStack.pop();
    state.elements = snapshot.elements;
    state.selectedId = snapshot.selectedId;
    emit('canvasChange');
    emit('selectionChange');
  }

  G.saveState = saveState;
  G.undo = undo;
  G.redo = redo;
})();
