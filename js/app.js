// Main app initialization
(function() {
  var G = window.Gardener;
  var state = G.state;
  var renderCanvas = G.renderCanvas;
  var initDrag = G.initDrag;
  var initSelect = G.initSelect;
  var undo = G.undo;
  var redo = G.redo;
  var exportToClipboard = G.exportToClipboard;

  function init() {
    initCanvasPreset();
    initDrag();
    initSelect();
    initKeyboard();
    initButtons();
    renderCanvas();
    console.log('[Gardener] Ready');
  }

  function initCanvasPreset() {
    var select = document.getElementById('canvas-preset');
    var customDiv = document.getElementById('custom-size');
    var customW = document.getElementById('custom-w');
    var customH = document.getElementById('custom-h');
    var applyBtn = document.getElementById('apply-custom');

    select.addEventListener('change', function() {
      if (select.value === 'custom') {
        customDiv.classList.remove('hidden');
      } else {
        customDiv.classList.add('hidden');
        var parts = select.value.split(',');
        state.canvas.width = Number(parts[0]);
        state.canvas.height = Number(parts[1]);
        renderCanvas();
      }
    });

    applyBtn.addEventListener('click', function() {
      state.canvas.width = parseInt(customW.value) || 390;
      state.canvas.height = parseInt(customH.value) || 844;
      renderCanvas();
    });
  }

  function initKeyboard() {
    document.addEventListener('keydown', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.ctrlKey || e.metaKey) {
        if (e.shiftKey && e.key === 'z') {
          e.preventDefault();
          redo();
        } else if (e.key === 'z') {
          e.preventDefault();
          undo();
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedId) {
          e.preventDefault();
          G.deleteSelected();
        }
      }
    });
  }

  function initButtons() {
    document.getElementById('btn-export').addEventListener('click', exportToClipboard);
  }

  init();
})();
