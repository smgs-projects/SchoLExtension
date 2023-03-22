fetch(chrome.runtime.getURL("darkmode.css")).then((r) => { return r.text() }).then((r) => {
  var script = document.createElement('style');
  var code = document.createTextNode(r);
  document.styleSheets[1].disabled = true
  document.getElementsByClassName("logo")[0].querySelector("img").src = 
  script.appendChild(code);
  (document.head || document.body).appendChild(script);

})