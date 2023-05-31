chrome.storage.local.get(['onOrOff'], result => {
    if (result.onOrOff) {
        fetch(chrome.runtime.getURL("chrome_ext/darkmode.css")).then((r) => { return r.text() }).then((darkModeTxt) => {
            console.log(window);

            fetch(chrome.runtime.getURL("compiled.js")).then((r) => { return r.text() }).then((r) => {
                var script = document.createElement('script');
                var code = document.createTextNode(`(function() { const forceEnableQOL = true; const darkModeCss = \`${darkModeTxt}\`; ${r}})();`);
                script.appendChild(code);
                (document.head || document.body).appendChild(script);
            });
        });
    }
})
