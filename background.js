chrome.webNavigation.onCommitted.addListener(async details => {
    if (!details.url.includes("learning.stmichaels.vic.edu.au")) {
        return;
    }

    chrome.storage.local.get(["onOrOff"], async result => {
        if (!result.onOrOff) {
            return;
        }

        try {
            console.debug("Fetching compiled.js for injection");
            const compiled = await fetch(chrome.runtime.getURL("compiled.js")).then(r => r.text());
            const finalCode = `
                window.forceEnableQOL = true;
                ${compiled}
            `;

            chrome.scripting.executeScript({
                target: { tabId: details.tabId, allFrames: false },
                world: "MAIN",
                func: code => { eval(code); },
                args: [finalCode]
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Injection failed", chrome.runtime.lastError.message);
                }
            });
        } catch (error) {
            console.error("Failed to inject compiled.js", error);
        }
    });
});
