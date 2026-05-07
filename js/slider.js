// Slider thumb drag — adjusts value without moving the element
(function() {
  var G = window.Gardener;
  var state = G.state;
  var getElementById = G.getElementById;
  var emit = G.emit;
  var saveState = G.saveState;

  var sliderDrag = null;

  // Called by unified dispatcher in app.js
  function sliderStart(e) {
    var thumbEl = e.target.closest('.slider-thumb');
    if (!thumbEl) return false;

    var elNode = e.target.closest('.canvas-element');
    if (!elNode) return false;
    var id = elNode.dataset.id;

    if (id !== state.selectedId) {
      state.selectedId = id;
      emit('selectionChange');
      return true;
    }

    var el = getElementById(id);
    if (!el || el.type !== 'slider') return false;

    e.preventDefault();

    var trackBg = elNode.querySelector('.slider-track-bg');
    if (!trackBg) return false;
    var trackRect = trackBg.getBoundingClientRect();

    sliderDrag = {
      id: id,
      trackLeft: trackRect.left,
      trackWidth: trackRect.width,
    };
    return true;
  }

  function sliderMove(e) {
    if (!sliderDrag) return;
    var el = getElementById(sliderDrag.id);
    if (!el) return;

    var min = el.min !== undefined ? el.min : 0;
    var max = el.max !== undefined ? el.max : 100;
    var pct = sliderDrag.trackWidth > 0
      ? (e.clientX - sliderDrag.trackLeft) / sliderDrag.trackWidth
      : 0;
    pct = Math.max(0, Math.min(1, pct));
    el.value = Math.round(min + pct * (max - min));

    // Direct DOM update instead of full re-render
    var canvasEl = G.canvasEl;
    var node = canvasEl.querySelector('[data-id="' + sliderDrag.id + '"]');
    if (node) {
      var trackBg = node.querySelector('.slider-track-bg');
      if (trackBg) {
        var fill = trackBg.querySelector('.slider-fill');
        var thumb = trackBg.querySelector('.slider-thumb');
        var valPct = max > min ? ((el.value - min) / (max - min)) * 100 : 0;
        valPct = Math.max(0, Math.min(100, valPct));
        if (fill) fill.style.width = valPct + '%';
        if (thumb) thumb.style.left = valPct + '%';
      }
    }
    emit('selectionChange');
  }

  function sliderEnd() {
    if (!sliderDrag) return;
    saveState();
    sliderDrag = null;
    emit('canvasChange');
  }

  G.sliderStart = sliderStart;
  G.sliderMove = sliderMove;
  G.sliderEnd = sliderEnd;
})();
