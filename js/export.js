// Export to clipboard
(function() {
  var G = window.Gardener;
  var state = G.state;

  var modal = document.getElementById('export-modal');
  var preview = document.getElementById('export-preview');
  var btnCopy = document.getElementById('btn-copy-export');
  var btnClose = document.getElementById('modal-close');

  btnClose.addEventListener('click', function() {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.classList.add('hidden');
  });

  btnCopy.addEventListener('click', function() {
    var text = preview.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        showToast('Copied to clipboard!');
        modal.classList.add('hidden');
      }).catch(function() {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  });

  function exportToClipboard() {
    var text = generateExportText();
    preview.textContent = text;
    modal.classList.remove('hidden');
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied to clipboard!');
    modal.classList.add('hidden');
  }

  function generateExportText() {
    var lines = ['Canvas ' + state.canvas.width + 'x' + state.canvas.height];
    for (var i = 0; i < state.elements.length; i++) {
      exportElement(state.elements[i], lines, 1);
    }
    return lines.join('\n');
  }

  function exportElement(el, lines, depth) {
    var indent = '';
    for (var i = 0; i < depth; i++) indent += '  ';

    var type = el.type.charAt(0).toUpperCase() + el.type.slice(1);
    var attrs = [];
    attrs.push('x:' + el.x + ', y:' + el.y + ', w:' + el.w + ', h:' + el.h);

    if (el.type !== 'text') attrs.push('bg:' + el.bg);
    if (el.radius) attrs.push('radius:' + el.radius);
    if (el.opacity !== undefined && el.opacity !== 1) attrs.push('opacity:' + el.opacity);

    if (el.type === 'text' || el.type === 'button' || el.type === 'input') {
      if (el.fontSize) attrs.push('font:' + el.fontSize);
      if (el.fontWeight === 'bold') attrs.push('weight:bold');
      if (el.color) attrs.push('color:' + el.color);
      if (el.textAlign && el.textAlign !== 'left') attrs.push('align:' + el.textAlign);
    }

    if (el.type === 'image' && el.src) attrs.push('src:"' + el.src + '"');

    var textContent = (el.type === 'text' || el.type === 'button') ? ' "' + (el.text || '') + '"' : '';
    lines.push(indent + type + textContent + ' (' + attrs.join(', ') + ')');

    if (el.children) {
      for (var c = 0; c < el.children.length; c++) {
        exportElement(el.children[c], lines, depth + 1);
      }
    }
  }

  function showToast(msg) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 2000);
  }

  G.exportToClipboard = exportToClipboard;
})();
