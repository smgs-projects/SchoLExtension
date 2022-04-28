chrome.storage.local.get(['onOrOff'], result => {
  if (result.onOrOff) {
    fetch(chrome.runtime.getURL("compiled.js")).then((r) => { return r.text() }).then((r) => {
      var script = document.createElement('script');
      var code = document.createTextNode('(function() { const forceEnableQOL = true; ' + r + '})();');
      script.appendChild(code);
      (document.head || document.body).appendChild(script);
    })
    fetch(chrome.runtime.getURL("darkmode.css")).then((r) => { return r.text() }).then((r) => {
      var script = document.createElement('style');
      var code = document.createTextNode(r);
      script.appendChild(code);
      (document.head || document.body).appendChild(script);
    })
  }
})
