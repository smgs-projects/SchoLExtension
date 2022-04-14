chrome.storage.local.get(['onOrOff'], result => {
  if (result.onOrOff) {
    localStorage.setItem("disableQOL", "")
    fetch(chrome.runtime.getURL("compiled.js")).then((r) => { return r.text() }).then((r) => {
      var script = document.createElement('script');
      var code = document.createTextNode('(function() { const forceEnableQOL = true; ' + r + '})();');
      script.appendChild(code);
      (document.head || document.body).appendChild(script);
    })
  } else {
    localStorage.removeItem("disableQOL")
  }
  
  var lastStatus = result.onOrOff;
  function checkStatus() {
    chrome.storage.local.get(['onOrOff'], result => {
      if (lastStatus != result.onOrOff) window.location.reload()
      lastStatus = result.onOrOff;
    })
  }
  setInterval(checkStatus, 100)
})
