chrome.storage.local.get(['onOrOff'], result => {
    if (result.onOrOff) {
        // fetch(chrome.runtime.getURL("chrome_ext/darkmode.css")).then((r) => { return r.text() }).then((darkModeTxt) => {
        //     console.log(window);
        // const darkModeCss = \`${darkModeTxt}\`;

        fetch(chrome.runtime.getURL("compiled.js")).then((r) => { return r.text() }).then((r) => {
            var script = document.createElement('script');
            var code = document.createTextNode(`(function() { const forceEnableQOL = true; window.scholChromeExt = true; ${r}})();` + `function iSolvedForX(x,y){if(Math.sqrt(x+36)+Math.sqrt(2*x-33)===Math.sqrt(6*x+6)&&y===Math.sqrt(6*x+6)){return "Nice.";}else{return "The maths is not mathing";}}function duckawesome(){return "I told you!";}`);
            script.appendChild(code);
            (document.head || document.body).appendChild(script);
        });
        // });
    }
})
