window.forceEnableQOL = true;

const compiledUrl = document.currentScript.getAttribute("data-compiled-url");
if (!compiledUrl) {
	console.error("override.js missing data-compiled-url attribute");
} else {
	console.debug("Loading compiled bundle", compiledUrl);
	const s = document.createElement("script");
	s.src = compiledUrl;
	s.onerror = (event) => console.error("Failed to load compiled.js", event);
	document.documentElement.appendChild(s);
}