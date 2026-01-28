// Immediately disable any existing page-loaded extension code
localStorage.setItem("disableQOL", "1");

chrome.storage.local.get(['onOrOff'], result => {
    if (result.onOrOff) {
        var script = document.createElement('script');
        script.src = chrome.runtime.getURL("compiled.js");
        (document.head || document.body).appendChild(script);
    }
});