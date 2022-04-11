var theButton = document.querySelector("button");

function updateButton() {
    chrome.storage.local.get(['onOrOff'], result => {
        theButton.innerHTML = result.onOrOff ? "enabled" : "disabled";
        theButton.className = result.onOrOff ? "buttonON" : "buttonOFF";
    })
}

function toggleButton(e) {
    var bool = e.target.className === 'buttonON' ? false : true
    chrome.storage.local.set({ 'onOrOff': bool }, result => {
        updateButton()
    })
}

updateButton()
theButton.onclick = toggleButton