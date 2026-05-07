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
    state._currentDevice = 'iphone17';
    applyDevice('iphone17');
    initPresetElements('iphone17');
    renderCanvas();
    console.log('[Gardener] Ready');
  }

  function applyDevice(key) {
    var cfg = G.devices ? G.devices[key] : null;
    var canvasEl = G.canvasEl;

    if (cfg) {
      state.canvas.width = cfg.width;
      state.canvas.height = cfg.height;
      canvasEl.style.borderRadius = cfg.cornerRadius ? cfg.cornerRadius + 'px' : '';
    } else {
      canvasEl.style.borderRadius = '';
    }

    renderDeviceChrome(cfg);
  }

  function renderDeviceChrome(cfg) {
    var chrome = document.getElementById('device-chrome');
    chrome.innerHTML = '';
    if (!cfg || !cfg.dynamicIsland) return;

    var di = cfg.dynamicIsland;
    var pill = document.createElement('div');
    pill.className = 'dynamic-island';
    pill.style.width = di.width + 'px';
    pill.style.height = di.height + 'px';
    pill.style.top = di.top + 'px';
    pill.style.left = Math.round((cfg.width - di.width) / 2) + 'px';
    pill.style.borderRadius = di.borderRadius + 'px';
    chrome.appendChild(pill);
  }

  function initPresetElements(key) {
    var cfg = G.devices ? G.devices[key] : null;
    if (!cfg || !cfg.safeArea) return;

    var statusBar = G.createDefaultElement('view', 0, 0);
    statusBar.name = 'Status Bar';
    statusBar.w = cfg.width;
    statusBar.h = cfg.safeArea.statusBarHeight;
    statusBar.bg = G.randomMorandiColor();
    statusBar.radius = 0;

    var bottomBar = G.createDefaultElement('view', 0, cfg.height - cfg.safeArea.homeIndicatorHeight);
    bottomBar.name = 'Bottom Safe Area';
    bottomBar.w = cfg.width;
    bottomBar.h = cfg.safeArea.homeIndicatorHeight;
    bottomBar.bg = G.randomMorandiColor();
    bottomBar.radius = 0;

    state.elements.push(statusBar, bottomBar);
  }

  function resetAndApplyDevice(key, customW, customH) {
    if (!confirm('Switching canvas will clear all elements. Continue?')) {
      var select = document.getElementById('canvas-preset');
      select.value = key === null ? 'custom' : (state._currentDevice || 'iphone17');
      return;
    }
    state.elements = [];
    state.selectedId = null;
    if (key) {
      state._currentDevice = key;
      applyDevice(key);
      initPresetElements(key);
    } else {
      state._currentDevice = null;
      applyDevice(null);
      state.canvas.width = customW || 390;
      state.canvas.height = customH || 844;
    }
    renderCanvas();
    G.emit('selectionChange');
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
        resetAndApplyDevice(select.value);
      }
    });

    applyBtn.addEventListener('click', function() {
      resetAndApplyDevice(null, parseInt(customW.value), parseInt(customH.value));
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
