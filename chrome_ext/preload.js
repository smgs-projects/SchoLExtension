chrome.storage.local.get(['onOrOff'], result => {
  if (result.onOrOff) {
    localStorage.setItem("disableQOL", "")
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
