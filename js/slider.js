// Slider thumb drag — adjusts value without moving the element
(function() {
  var G = window.Gardener;
  var state = G.state;
  var getElementById = G.getElementById;
  var emit = G.emit;
  var saveState = G.saveState;

  var sliderDrag = null;

  document.addEventListener('mousedown', function(e) {
    var thumbEl = e.target.closest('.slider-thumb');
    if (!thumbEl) return;

    var elNode = e.target.closest('.canvas-element');
    if (!elNode) return;
    var id = elNode.dataset.id;

    if (id !== state.selectedId) {
      state.selectedId = id;
      emit('stateChange');
      return;
    }

    var el = getElementById(id);
    if (!el || el.type !== 'slider') return;

    e.preventDefault();

    var trackBg = elNode.querySelector('.slider-track-bg');
    if (!trackBg) return;
    var trackRect = trackBg.getBoundingClientRect();

    sliderDrag = {
      id: id,
      trackLeft: trackRect.left,
      trackWidth: trackRect.width,
    };
  }, true);

  document.addEventListener('mousemove', function(e) {
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
    emit('stateChange');
  });

  document.addEventListener('mouseup', function() {
    if (!sliderDrag) return;
    saveState();
    sliderDrag = null;
  });
})();
