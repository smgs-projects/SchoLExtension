var theButton = document.querySelector("button");

function updateButton() {
    chrome.storage.local.get(['onOrOff'], result => {
        theButton.innerHTML = result.onOrOff ? "Enabled" : "Disabled";
        theButton.className = result.onOrOff ? "buttonON" : "buttonOFF";

        chrome.browserAction.setIcon({
            path: result.onOrOff ? "Enabled.png" : "Disabled.png"
        });

        chrome.tabs.query({ url: [ "https://learning.stmichaels.vic.edu.au/*", "https://learning-dev.stmichaels.vic.edu.au/*" ] }, tabs => {
            tabs.forEach(tab => {
                chrome.tabs.reload(tab.id);
            });
        }); 
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