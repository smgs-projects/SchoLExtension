fetch(chrome.runtime.getURL("compiled.js")).then((r) => { return r.text() }).then((r) => {
  var script = document.createElement('script');
  var code = document.createTextNode('(function() {' + r + '})();');
  script.appendChild(code);
  (document.head || document.body).appendChild(script);
})