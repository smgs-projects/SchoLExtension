// 
// Random SchoL improvements that make it better maybe?
// by Zac McWilliam and Sebastien Taylor
//         ____
//   _,.-'`_ o `;__,
//    _.-'` '---'  '
//
// Dark mode made by Max Bentley, Yuma Soerianto, and Sebastien Taylor
//         _
//     ___(.)<
//     \____)
// 

// Regex to find subject codes inside a subject string e.g. "12 PHYSICS 01 (12SC-PHYSI01)" -> "12SC-PHYSI01"
// Regex2 to find subject codes inside a subject string e.g. "12 PHYSICS 01 [12SC-PHYSI01]" -> "12SC-PHYSI01"
const REGEXP = /\(([^)]+)\)/;
const REGEXP2 = /\[([^)]+)\]/;
// Period name constants
const PERIODS = {
    P1: "Period 1",
    P2: "Period 2",
    P3: "Period 3",
    P4: "Period 4",
    LUNCH: "Lunch",
    P5: "Period 5",
    P5_HOUSE: "Period 5 (House Period)",
    P6: "Period 6",
    P5_6_MERGED: "Period 5-6"
}

// Timetable rows NOT to remove if all blank (derived from PERIODS)
const TIMETABLE_WHITELIST = [PERIODS.P1, PERIODS.P2, PERIODS.P3, PERIODS.P4, PERIODS.P5, PERIODS.P5_HOUSE, PERIODS.P6]
// Conditions where "Click to view marks" will appear on feedback (uses str.includes())
const SHOW_FEEDBACKS = ["(00", "[00", "(01", "[01", "(02", "[02", "(03", "[03", "(04", "[04", "(05", "[05", "(06", "[06", "(12", "[12"];
// Theme API location
const THEME_API = "https://apps.stmichaels.vic.edu.au/scholext"
// SchoL Remote Service API Link
const REMOTE_API = "/modules/remote/" + btoa("https://apps.stmichaels.vic.edu.au/scholext/auth") + "/window"
// List of valid pronouns
const VALID_PRONOUNS = {"hehim" : "He/Him", "sheher": "She/Her", "theythem": "They/Them", "other": "Ask Me"}
// List of valid image types for timetable themes
const IMAGE_TYPES = ['image/png', 'image/gif', 'image/bmp', 'image/jpeg'];
// Link to files
const FILE_URL = "https://schol.baj810.com/files/"

const DEFAULT_CONFIG = {
    "theme" : {},
    "themedefault" : {},
    "darkmodetheme" : "light",
    "settings" : {"colourduework":1,"compacttimetable":1,"enhancedtimetable":0},
    "pronouns" : {"selected":[],"show":[1,1,1]},
    "updated" : 0,
    "version" : 2
}

let minConfettiGrade = 90;
let PTVDepatureUpdate = true;
let extConfigSvr;
let extConfig;

// Check if running as valid extension
const isExtension = document.currentScript && document.currentScript.src && document.currentScript.src.startsWith("chrome-extension://");

// ----- RGB CONTRAST STUFF -----

const RED = 0.2126;
const GREEN = 0.7152;
const BLUE = 0.0722;
const GAMMA = 2.4;

function getRgbLuminance(r, g, b) {
  var a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, GAMMA);
  });
  return a[0] * RED + a[1] * GREEN + a[2] * BLUE;
}

function getRgbContrast(rgb1, rgb2) {
  var lum1 = getRgbLuminance(...rgb1);
  var lum2 = getRgbLuminance(...rgb2);
  var brightest = Math.max(lum1, lum2);
  var darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// ----- END RGB CONTRAST STUFF -----

// Dark Mode
let darkmodeCSSDom;
function applyDark() {
    darkmodeCSSDom = document.createElement('link');
    darkmodeCSSDom.rel = "stylesheet";
    darkmodeCSSDom.href = (FILE_URL + "/darkMode/darkmode.css?v=1.10.1");

    document.styleSheets[1] && (document.styleSheets[1].disabled = false);

    darkmodeCSSDom.id = "darkmode-core";
    (document.head || document.body).appendChild(darkmodeCSSDom);

    darkmodeCSSDom.onload = (e) => {
        // Custom text contrast checks
        const layer1Bg = [0, 0, 38];
        const wcagContrast = 4.5; // WCAG-recommended contrast ratio
        document
        .querySelectorAll(`span:not([style*="color:#000"]):not(td[style*="background-color"] span):not(span[style*="background-color"] > span):not(div[style*="background-color"] *)`)
        .forEach((e) => {
            let rgb = window.getComputedStyle(e).color
            .replace(/[^\d,]/g, "")
            .split(",")
            .slice(0, 3);

            // Check if there's enough contrast
            if (rgb.length === 3 && getRgbContrast(layer1Bg, rgb) < wcagContrast) {
                e.style.color = `rgb(${255 - rgb[0]},${255 - rgb[1]},${255 - rgb[2]})`;
            }
        });  

        document.querySelectorAll(`span[style*="background-color"]`).forEach((e) => {
            let rgb = window.getComputedStyle(e).color
            .replace(/[^\d,]/g, "")
            .split(",")
            .slice(0, 3);

            let rgbBg = window.getComputedStyle(e).backgroundColor
            .replace(/[^\d,]/g, "")
            .split(",")
            .slice(0, 3);

            // Check if there's enough contrast
            if (rgb.length === 3 && getRgbContrast(rgbBg, rgb) < wcagContrast) {
                e.style.cssText += `color:rgb(${255 - rgb[0]},${255 - rgb[1]},${255 - rgb[2]}) !important;`;
            }
        });
        
        document.querySelectorAll(`#content *[style*="color"]:not(.breadcrumb *):not(td[style*="background-color"] *):not(div[style*="background-color"] > .Paragraph > *)`).forEach((e) => {
            let rgb = window.getComputedStyle(e).color
            .replace(/[^\d,]/g, "")
            .split(",")
            .slice(0, 3);
        
            let rgbBg = window.getComputedStyle(e).backgroundColor
            .replace(/[^\d,]/g, "")
            .split(",")
            .slice(0, 3);
        
            // Check if there's enough contrast
            if (rgb.length === 3 && getRgbContrast(rgbBg, rgb) < wcagContrast) {
                e.style.cssText += `color:rgb(${255 - rgb[0]},${255 - rgb[1]},${255 - rgb[2]}) !important;`;
            }
        });
    };
}
async function updateTheme(theme) {
    if (darkmodeCSSDom) {
        // If dark mode css already exists, remove it
        darkmodeCSSDom.remove();
        darkmodeCSSDom = undefined;
    }

    switch (theme) {
        case "dark":
            applyDark();
            break;
        case "defaults":
            // Use the matchMedia() method to check whether the system is light or dark and apply the theme accordingly.
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                applyDark();
            }
            break;
        case "light":
            break;
        default:
            // Set a default config and save it if there's no valid stored value
            extConfig.darkmodetheme = DEFAULT_CONFIG.darkmodetheme;
            extConfig.updated = Date.now();
            localStorage.setItem("extConfig", JSON.stringify(extConfig));
            await postConfig();
    }
}

// Try to push out darkmode early to prevent light mode flash
// Check for extConfig existence early to get dark mode theme setting ASAP
// Also disable if being overrided by dev ScholExt 
if (!(localStorage.getItem("disableQOL") != undefined && typeof forceEnableQOL == "undefined" && !isExtension) && localStorage.getItem("extConfig") !== null) {
    try {
        let earlyExtConfig = JSON.parse(localStorage.getItem("extConfig"));
        if (earlyExtConfig.darkmodetheme) updateTheme(earlyExtConfig.darkmodetheme);
    } catch {
        console.log("Early extConfig parse failed");
    }
}



if (document.readyState === "complete" || document.readyState === "interactive") { load(); }
else { window.addEventListener('DOMContentLoaded', () => { load() }); }

// Append header CSS for all pages
const headerImgTag = document.createElement('style');
headerImgTag.innerHTML = `
    .logo-wrapper {
        margin: -1px;
    }
`;
document.head.appendChild(headerImgTag);

async function load() {
    if (localStorage.getItem("disableQOL") != undefined && typeof forceEnableQOL == "undefined" && !isExtension) return; // Allow disabling of QOL features (mainly for testing)
    if (typeof schoolboxUser == "undefined") return;

    if (schoolboxUser.id != localStorage.getItem("lastUser")) {
        localStorage.removeItem("extConfig");
        localStorage.removeItem("lastThemeCache");
        localStorage.removeItem("userToken");
        localStorage.setItem("lastUser", schoolboxUser.id);
    }

    let skip_server_loading = false; // Assume server is online, if not, we will set this to true

    if (localStorage.getItem("skipServerLoading") !== null) { // If we have a skipServerLoading item, check if it is still valid (30 minutes)
        if (localStorage.getItem("skipServerLoading") > Date.now()) { skip_server_loading = true; }
        else { localStorage.removeItem("skipServerLoading"); }

        // or if the server is back online, we can remove the skipServerLoading item
        // If the server is down and localStorage.getItem("skipServerLoading") is set, we will skip server loading for 30 minutes.
        // Just in case it's back, let's add an async function to check if it's back up and if so, remove the config
        (async () => {
            try {
                await getConfig();
                console.warn("[SCHOLEXT] Server is back online! Everything will be loaded as normal with the next page load.")
                localStorage.removeItem("skipServerLoading");
            } catch (error) { if (error.message === 'Network error') {
                console.warn(`[SCHOLEXT] Server is still offline, skipping forced server loading for ${Math.round((localStorage.getItem("skipServerLoading") - Date.now()) / 1000 / 60)} minutes`);
            } }
        })();
    }

    let extConfigSvr = { updated: 0, version: DEFAULT_CONFIG.version };
    if (!skip_server_loading) {
        try {
          extConfigSvr = await getConfig(); // IF NOT EXISTS, RETURNS {updated: 0, version: INT}
        } catch (error) {
            skip_server_loading = true; // Skip loading from server unless we can fix the issue (e.g. invalid JWT then resolved)
            if (error.message === 'Forbidden') {
                console.error('[SCHOLEXT] Access to configuration data is forbidden. This is likely due to an invalid JWT. We will try to generate a new one,'); // Clear JWT and try again
                localStorage.removeItem('userToken');
                await remoteAuth();

                // Try again, if this continues to fail, something is quite wrong.
                try { extConfigSvr = await getConfig(); skip_server_loading = false; }
                catch (error) {
                    console.error('[SCHOLEXT] Failed to fetch configuration data after re-authentication. Something is very wrong', error);
                }
            } else if (error.message === 'Network error') {
                console.error('[SCHOLEXT] Could not reach the server. It is possible that the server is down. Will still attempt to load configuration data from local storage.');
            } else {
                console.error('[SCHOLEXT] An unknown error occurred while fetching configuration data.');
            }
        }
    }

    if (DEFAULT_CONFIG.version != extConfigSvr.version) { console.log("Version Mismatch"); return; } // If local version is not the same as the server, stop loading

    if (skip_server_loading) { // If we are skipping server loading, we need to check if we have a local config
        if (localStorage.getItem("extConfig") !== null) {
            try { extConfig = JSON.parse(localStorage.getItem("extConfig"));
            } catch { localStorage.removeItem("extConfig"); return; } // Ensure extConfig is valid JSON
        } else { // No local config, there is nothing we can do so we will just prevent loading
            console.error('[SCHOLEXT] No configuration data could be loaded. Server is likely down and no local configuration data exists. Please try again later.');
            return;
        }
        console.warn("[SCHOLEXT] Loaded configuration data from local storage. We were unable to reach the server to fetch the latest configuration data so this may be out of date.");
        console.warn("[SCHOLEXT] It is possible that some functionality will not work as intended until the server is back online.");
        console.warn("[SCHOLEXT] If you are seeing this message frequently, please contact the SchoL Extension team.");

        if (!localStorage.getItem("skipServerLoading")) {
            // Set a localStorage item to continue skipping server loading for 30 minutes, this means timetable cols will load immediately for the user while the server is down
            localStorage.setItem("skipServerLoading", Date.now() + 1800000);

            console.log("Could not connect to SchoL Extension server. Custom timetable colours may not work correctly")
        }
    }
    else if (localStorage.getItem("extConfig") !== null) { // We already have a config locally and versions match
        try { extConfig = JSON.parse(localStorage.getItem("extConfig"));
        } catch { localStorage.removeItem("extConfig"); return; } // Ensure extConfig is valid JSON

        if (extConfig.updated < extConfigSvr.updated) { // External config is newer, updated on another device OR migrated to a newer version
            extConfig = extConfigSvr;
            localStorage.setItem("extConfig", JSON.stringify(extConfig))
        }
    } else if (extConfigSvr.updated !== 0) { // Server config already exists but none locally, save remote
        extConfig = extConfigSvr;
        localStorage.setItem("extConfig", JSON.stringify(extConfig))
    } else { // No server config or local config, make one and send to server
        extConfig = DEFAULT_CONFIG
        await timetableCache(true)
    }


    if (!localStorage.getItem("lastThemeCache") || (localStorage.getItem("lastThemeCache") && Date.now() - parseInt(localStorage.getItem("lastThemeCache")) > 8.64e+7) || extConfig.themedefault == {}) {
        await timetableCache()
    }

    allPages()
    if (window.location.pathname == "/") mainPage();
    if (window.location.pathname == "/learning/classes") classesPage();
    if (window.location.pathname.startsWith("/calendar")) setInterval(eDiary, 500);
    if (window.location.pathname.startsWith("/learning/due")) setInterval(dueWork, 500);
    if (window.location.pathname.startsWith("/learning/grades")) feedback();
    if (window.location.pathname.startsWith("/learning/assessments/")) assessments();
    if (window.location.pathname.startsWith("/timetable")) timetable();
    if (window.location.pathname === "/news") myLearningTab();
    if (window.location.pathname.startsWith("/search/user")) profilePage();
    if (window.location.pathname.startsWith("/search/user/") && window.location.pathname.endsWith(schoolboxUser.id)) await loadSettings();
    if (window.location.pathname.startsWith("/settings/notifications")) await loadSettings();
}

async function timetableCache(forcePush) {
    return new Promise (async ( resolve ) => {
        await remoteAuth();
        fetch('/timetable').then(r => r.text()).then(result => {
            let timetableTheme = Object.assign({}, extConfig.theme) || {}
            let defaultTheme = {}
            let parser = new DOMParser();
            const timetable = parser.parseFromString(result, 'text/html')
            for (const subject of timetable.querySelectorAll(".timetable-subject[style*='background-color'] div")) {
                const match = REGEXP.exec(subject.innerText) || REGEXP2.exec(subject.innerText);
                if (!match) continue;
                
                const fullText = subject.innerText.trim();
                const subjectCode = match[1];
                const subjectName = fullText.replace(match[0], '').trim();
                
                defaultTheme[subjectCode] = {
                    color: subject.parentNode.style.backgroundColor, 
                    image: null, 
                    current: "color",
                    name: subjectName
                }
            }
            for (const subject in defaultTheme) {
                if (timetableTheme[subject] === undefined) {
                    timetableTheme[subject] = defaultTheme[subject]
                }
            }
            for (const subject in timetableTheme) {
                if (defaultTheme[subject] === undefined) {
                    delete timetableTheme[subject]
                }
            }
            localStorage.setItem("lastThemeCache", Date.now())

            if (JSON.stringify(extConfig.theme) != JSON.stringify(timetableTheme) || JSON.stringify(extConfig.themedefault) != JSON.stringify(defaultTheme) || forcePush) {
                extConfig.theme = timetableTheme;
                extConfig.themedefault = defaultTheme;
                extConfig.updated = Date.now();
                localStorage.setItem("extConfig", JSON.stringify(extConfig))
                postConfig().then(r=>resolve());
            } else { resolve(); }
        })
    })
}

window.Clipboard = (function(window, document, navigator) {
    var textArea, copy, range, selection;
    copy = function(text) {
        textArea = document.createElement('textArea');
        textArea.value = text;
        document.body.appendChild(textArea);
        if (navigator.userAgent.match(/ipad|iphone/i)) {
            range = document.createRange();
            range.selectNodeContents(textArea);
            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            textArea.setSelectionRange(0, 999999);
        } else {
            textArea.select();
        }
    document.execCommand('copy');
    document.body.removeChild(textArea);
    };
    return { copy: copy };
})(window, document, navigator);
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(result){
        var r = parseInt(result[1], 16);
        var g = parseInt(result[2], 16);
        var b = parseInt(result[3], 16);
        return r + ", " + g + ", " + b;
    }
    return null;
}
function getRGB(c) {
    return parseInt(c, 16) || c
}
function getsRGB(c) {
    return getRGB(c) / 255 <= 0.03928
    ? getRGB(c) / 255 / 12.92
    : Math.pow((getRGB(c) / 255 + 0.055) / 1.055, 2.4)
}
function getLuminance(hexColor) {
    return (
      0.2126 * getsRGB(hexColor.substr(1, 2)) +
      0.7152 * getsRGB(hexColor.substr(3, 2)) +
      0.0722 * getsRGB(hexColor.substr(-2))
    )
}
function getContrast(f, b) {
    const L1 = getLuminance(f)
    const L2 = getLuminance(b)
    return (Math.max(L1, L2) + 0.25) / (Math.min(L1, L2) + 0.25)
}

function getTextColor(bgColor) {
    if (!bgColor) return '#000000';
    const rgb = bgColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 150 ? '#000000' : '#ffffff';
    }
    return '#000000';
}
function rgbsFromHexes(url) {
    const matches = [...url.matchAll(/(?:[0-9a-fA-F]{6})/g)]
    let rgbs = []
    for (const match of matches) {
        const rgbcode = hexToRgb(match)
        if (!rgbcode) continue;
        rgbs.push(`rgb(${rgbcode})`);
    }
    return rgbs
}

async function allPages() {
    // Search bar
    if (document.getElementById("message-list").children[1]) {
        const container = document.getElementById("message-list").children[1];
        if (!container.querySelector('input[placeholder="Type to search"]')) {
            const searchbar = document.createElement('input')
            searchbar.placeholder = "Type to search"
            searchbar.className = "notification-searchbar"
            searchbar.style.margin = "0px"
            searchbar.addEventListener('keyup', () => {
                if (document.activeElement === searchbar) {
                    const text = searchbar.value.toLowerCase();
                    const notifications = document.getElementById("msg-content").querySelectorAll("li")
                    for (const notif of notifications) {
                        if (notif.textContent.toLocaleLowerCase().trim().indexOf(text) == -1) {
                            notif.style.display = "none";
                        } else {
                            notif.style.display = "block";
                        }
                    }
                }
            });
            container.appendChild(searchbar)
        }
    }
    // Fix "days remaining" on due work items to a more friendly value
    for (let item of document.querySelectorAll("time")) {
        if (item.textContent.includes("remaining")) {
            const daysleft = (new Date(item.dateTime).getTime() - Date.now()) / 8.64e+7
            const hoursleft = (new Date(item.dateTime).getTime() - Date.now()) / 3.6e+6
            const minutesleft = (new Date(item.dateTime).getTime() - Date.now()) / 60000

            if (daysleft >= 1) { item.textContent = Math.round(daysleft) + (daysleft == 1 ? " day left" : " days left") }
            else if (hoursleft >= 1) { item.textContent = Math.round(hoursleft) + (hoursleft == 1 ? " hour left" : " hours left") }
            else { item.textContent = Math.round(minutesleft) + (minutesleft == 1 ? " minute left" : " minutes left") }
        }
    }
    // Add Timetable link to profile dropdown
    document.querySelector("#profile-options .icon-staff-students").insertAdjacentHTML("afterend", `<li><a href="/timetable" class="icon-timetable">Timetable</a></li>`)
    
    // Check if extConfig has darkmodeTheme (backwards compatibility)
    if (!extConfig.darkmodetheme) {
        // If the darkmodetheme config is not available, set it to a default val and post to db
        extConfig.darkmodetheme = DEFAULT_CONFIG.darkmodetheme;
        extConfig.updated = Date.now();
        localStorage.setItem("extConfig", JSON.stringify(extConfig));
        await postConfig();
    }
    updateTheme(extConfig.darkmodetheme);
    
    colourSidebar();
    colourTimetable();
    colourDuework();
    setTimeout(colourDuework, 1000) // Some pages require extra loading time
}

function colourSidebar() {
    for (const subjectlink of document.querySelectorAll("#side-menu-mysubjects li a")) {
        //Uses the link that it leads to, since that is the only way to get it out of the text
        let theme = extConfig.theme[subjectlink.href.split("/")[subjectlink.href.split("/").length - 1]]
        if (!theme?.color) continue
        subjectlink.style.backgroundColor = theme.color.replace("rgb", "rgba").replace(")", ", 10%)")
        subjectlink.style.borderLeft = "7px solid " + theme.color
    }
}

function colourDuework() {
    if (extConfig.settings.colourduework) {
        let dueworkitems = document.querySelectorAll(".Schoolbox_Learning_Component_Dashboard_UpcomingWorkController li")
        if (!dueworkitems.length) { dueworkitems = document.querySelectorAll("#report_content li") }

        for (const duework of dueworkitems) {
            const subjects = REGEXP.exec(duework.querySelector("a:not(.title)").innerText)[1]?.split(",")
            for (const subject of subjects) {
                const colour = extConfig.theme[subject]?.color
                if (!colour) continue
                duework.style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
                duework.style.borderLeft = "10px solid " + colour
            }
        }
    }
}

function colourTimetable() {
    // Change timetable subject colours to match everywhere
    for (const subject of document.querySelectorAll(".timetable-subject[style*='background-color'] div, .timetable-subject[style*='background'] div, .show-for-small-only tr td .timetable-subject div")) {
        if (!REGEXP.exec(subject.textContent)) continue;
        const subjectcodes = REGEXP.exec(subject.innerText)[1].split(",")
        for (const subjectcode of subjectcodes) {
            const theme = extConfig.theme[subjectcode]
            if (!theme?.color) continue
            const textcol = getTextColor(rgbToHex(...theme["color"].replace(/[^\d\s]/g, '').split(' ').map(Number)).toUpperCase())
            subject.parentNode.style.backgroundColor = theme["color"]
            subject.parentNode.style.color = textcol
            if (textcol != "#000000") subject.parentNode.querySelectorAll("a").forEach(e => e.style.color = "#b0e1ff" )

            // Apply contrast to child divs
            subject.parentNode.querySelectorAll("div").forEach(div => {
                div.style.backgroundColor = theme["color"]
                div.style.color = textcol
            })

            if (theme.current == "image" && theme.image) {
                subject.parentNode.style.backgroundImage = "url(" + theme.image + ")"
                subject.parentNode.style.backgroundSize = `100% 100%`
            }

        }
    }
}
function classesPage() {
    const cards = document.querySelectorAll("div.v-card")
    for (const card of cards) {
        for (const subject of card.querySelector("p.meta").innerText.split("\n")[0].split(",")) {
            const colour = extConfig.theme[subject]?.color
            if (!colour) continue
            card.querySelector("div.card-class-image").style.borderBottom = `10px solid ${colour}`
        }
    }
}

function profilePage() {
    fetch(THEME_API + "/pronouns/" + window.location.pathname.split("/")[window.location.pathname.split("/").length - 1],
        { headers: new Headers({"Authorization": "Basic " + localStorage.getItem("userToken")}) })
    .then(r => r.json())
    .then(r => {
        let pronouns = r.join(", ")
        const profileRow = document.querySelector(".main .profile.content .row");
        profileRow.style.position = "relative";
        profileRow.insertAdjacentHTML("beforeend", `<span class="neutral label hide-for-small-down" style="position: absolute; top: 0; right: 0; margin: 0${!pronouns.length ? "; display: none !important" : ""}" id="pronounslabel">Pronouns: ${pronouns}</span>`)
        profileRow.children[1].insertAdjacentHTML("beforeend", `<dl class="hide-for-medium-up" ${!pronouns.length ? "style='display: none !important'" : ""}><dt class="small-4 medium-3 columns">Pronouns:</dt><dd class="small-8 medium-9 columns" id="pronounsrow">${pronouns}</dd></dl>`)
    })
}

async function loadSettings() {
    let tablerows = "";
    for (const subject in extConfig.theme) {
        const rgbvalue = extConfig.theme[subject].color
        const hexvalue = rgbToHex(...rgbvalue.replace(/[^\d\s]/g, '').split(' ').map(Number))
        tablerows += `<tr role="row" class="subject-color-row" style="background-color: ${rgbvalue.replace("rgb", "rgba").replace(")", ", 10%)")}; ${extConfig.theme[subject].current === "image" ? "background-image: url(" + extConfig.theme[subject].image +");" : ""} background-size: 100% 100%; border-left: 7px solid ${rgbvalue}">
            <td>${subject}</td>
            <td>
                <div id="image-uploader">
                    <input type="color" style="display: ${extConfig.theme[subject].current === "image" ? "none" : ""}" value="${hexvalue}">
                    <input type="url" class="image-drop-zone"pattern="https://.*" required placeholder="Drag Image Here" style="display: ${extConfig.theme[subject].current === "image" ? "" : "none"}" value="${extConfig.theme[subject]["image"] === null ? "" : extConfig.theme[subject].image}">
                    <p style="display: none; color: red" class="invalidurl">Not a valid URL</p>
                </div>
            </td>
            <td style="text-align: center">
                <a id="settingsresset" data-target="delete" data-state="closed" class="icon-refresh" title="Reset" style="vertical-align: middle; line-height: 40px"></a>
            </td>
            <td style="text-align: center">
                <a data-target="delete" style="vertical-align: middle; line-height: 39px; display: ${extConfig.theme[subject].current === "image" ? "none" : ""}" data-state="closed" class="icon-image" title="Image">
                <a data-target="delete" style="vertical-align: middle; line-height: 39px; display: ${extConfig.theme[subject].current === "image" ? "" : "none"}" data-state="closed" class="icon-drag-drop" title="Colour">
            </td>
        </tr>`
    }
    if (Object.keys(extConfig.theme).length < 1) {
        tablerows += `<tr role="row" class="subject-color-row">
            <td colspan="3">There are no timetable subjects associated with your account</td>
        </tr>`
    }

    const darkModeOptions = [
        { value: 'defaults', label: 'System Defaults' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
    ];
    
    function generateDropdown(options) {
        let dropdownHtml = '<option disabled="" selected="">Click to select a theme</option>';

        options.forEach(option => {
            dropdownHtml += `<option value="${option.value}">${option.label}</option>`;
        });
    
        return dropdownHtml;
    }
    const darkOptions = generateDropdown(darkModeOptions);

    let themeoptions = ""
    const themes = await getThemes()
    if (themes) {
        themeoptions += `<option disabled selected>Click to select a theme</option>`
        for (const theme of themes) {
            themeoptions += `<option ${localStorage.getItem("currentTheme") === theme.name ? "selected" : ""} value='${theme.theme}'>${theme.name}</option>`
        }
    }

    const settings = {
        "colourduework": ["Coloured Due Work", "Add colours to due work items based on the timetable"],
        "compacttimetable": ["Compact Timetable", "Remove empty items/rows from the timetable on the dashboard and timetable page"],
        "enhancedtimetable": ["Enhanced Timetable", "Use enhanced desktop timetable layout. Please note: this feature is in Beta."],
    }
    let settingselems = ""
    for (const setting in settings) {
        settingselems += `<tr>
            <td style="border-bottom: 0px !important"><label for="toggle_${setting}">${settings[setting][0]}<p>${settings[setting][1]}</p></label></td>
            <td style="border-bottom: 0px !important">
                <div class="long switch no-margin" style="float: right">
                    <input id="toggle_${setting}" type="checkbox" name="toggle_${setting}" value="1" checked>
                    <label for="toggle_${setting}">
                        <span>Enabled</span>
                        <span>Disabled</span>
                    </label>
                </div>
            </td>
        </tr>`
    }

    const is_profile = window.location.pathname.startsWith("/search/user")
    let contentrow;
    if (is_profile) {
        contentrow = document.querySelectorAll("#content .row");
        if (!contentrow[3]) { contentrow = contentrow[1] } else { contentrow = contentrow[3] }

        contentrow.querySelector("div").classList = "medium-12 large-6 island"
        contentrow.querySelector("div").insertAdjacentHTML("afterbegin", `<h2 class="subheader">Profile</h2>`)
    } else {
        contentrow = document.querySelector("#msg-settings");
        contentrow.insertAdjacentHTML("beforebegin", `<div class="row"><div class="medium-12 large-6 island" id="msg-settings-wrapper"></div></div>`)
        document.getElementById("msg-settings-wrapper").appendChild(contentrow)
        contentrow = contentrow.parentNode
    }
    contentrow.insertAdjacentHTML(is_profile ? "beforeend" : "afterend", `<div class="medium-12 large-6 island">
            <h2 class="subheader">Preferred Pronouns</h2>
            <section>
                <fieldset class="content">
                    <div class="small-12 columns">
                        <p>St Michael's is committed to ensuring that we have safe and inclusive learning environments and in keeping with our values, that we respect and acknowledge the diversity of our community. We have therefore provided the option for students and staff to choose their pronouns on SchoL - noting that this is not currrently reflected on School records nor an official notification to the School. There is no expectation or requirement for students or staff to select their pronouns.</p>
                    </div>
                    <div class="small-12 medium-6 columns">
                        <fieldset class="content">
                            <label>Select Pronouns
                                <div class="checklist checklist-container" id="pronoun-list">
                                    <input id="checkbox-pronoun1" type="checkbox" name="theythem"><label for="checkbox-pronoun1">They/Them</label>
                                    <input id="checkbox-pronoun2" type="checkbox" name="hehim"><label for="checkbox-pronoun2">He/Him</label>
                                    <input id="checkbox-pronoun3" type="checkbox" name="sheher"><label for="checkbox-pronoun3">She/Her</label>
                                    <input id="checkbox-pronoun4" type="checkbox" name="other"><label for="checkbox-pronoun4">Other (Ask Me)</label>
                                </div>
                            </label>
                        </fieldset>
                    </div>
                    <div class="small-12 medium-6 columns">
                        <fieldset class="content">
                            <label>Select roles to show your pronouns to
                                <div class="checklist checklist-container" id="pronoun-roles">
                                    <input id="checkbox-roles1" type="checkbox" name="0"><label for="checkbox-roles1">Students</label>
                                    <input id="checkbox-roles2" type="checkbox" name="1"><label for="checkbox-roles2">Staff/Teachers</label>
                                    <input id="checkbox-roles3" type="checkbox" name="2"><label for="checkbox-roles3">Parents</label>
                                </div>
                            </label>
                        </fieldset>
                    </div>
                    <div class="small-12 columns">
                        <p class="meta"><strong>Note: </strong>To make official changes of names to a student's records, there is a process that parents need to follow by contacting the Head of the School.</p>
                    </div>
                </fieldset>
            </section>
            <h2 class="subheader"> </h2>
            <table class="dataTable no-footer" role="grid">
                <thead>
                    <tr role="row">
                        <th style="width: 1000px">Subject</th>
                        <th style="width: 200px">Pick Theme</th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>${tablerows}</tbody>
            </table>

            <h2 class="subheader">Theme Manager</h2>
            <section>
                <fieldset class="content">
                    <legend><strong>Theme Import/Export</strong></legend>
                    <div class="small-12 columns">
                        <p>Import a theme (list of hex codes seperated by dashes), this also supports URLs from <a target="_blank" href="https://coolors.co/d9ed92-b5e48c-99d98c-76c893-52b69a-34a0a4-168aad-1a759f-1e6091-184e77">coolors.co</a></p>
                    </div>
                    <div class="small-12 columns">
                        <div class="input-group">
                            <input type="text" id="importtext" placeholder="Hex codes seperated by dashes (#FDFD96-#22AA66...) or https://coolors.co/ link">
                            <a class="button disabled" id="importbtn">Import</a>
                        </div>
                    </div>
                    <div class="small-12 columns"><p>Export your current theme to share it with friends!</p></div>
                    <div class="small-12 columns"><div class="input-group"><input type="text" id="currenttheme" readonly><a class="button" id="exportbtn">Export</a></div></div>
                    <div class="small-12 columns"><p>Or choose a premade theme!</p></div>
                    <div class="small-12 columns"><select id="context-selector-themes">${themeoptions}</select></div>
                </fieldset>
                <fieldset class="content">
                    <legend><strong>Settings</strong></legend>
                    <div class="small-12 columns">
                        <table class="no-margin"><tbody>${settingselems}</tbody></table>
                    </div>
                </fieldset>
                <div class="component-action">
                    <section>
                        <a class="button" style="color: #ff5555;" id="resetbtn">Reset</a>
                    </section>
                </div>
            </section>

            <div id=customStuff>
            </div>

            <ul class="meta" style="font-size: 12px; color: #AAA; margin-top: 20px; font-style: normal;">
                Additional features developed by Billy (M2026), Yuma (M2024), Sebastien (H2023), Max (S2024), and Zac (H2022).
            </ul>

            <ul class="meta" style="font-size: 12px">
                SchoL features and profile settings are managed by the School Leadership Team and the St Michael's ICT Steering Committee. Feedback and future suggestions for the improvement of SchoL can be directed to: <a href="mailto:scholfeedback@stmichaels.vic.edu.au">scholfeedback@stmichaels.vic.edu.au</a>. <!-- rip dead name remover :( -->
            </ul>
        </div>`)


    module_darkMode = `  
        <h2 class="subheader">Dark Mode</h2>
        <section>
            <fieldset class="content">
                <div class="small-12 columns">
                    <p>Select your SchoL Theme Here! 'System Defaults' uses your system theme setting, while light and dark mode override that setting for your preference.<br></p>
                </div>
                <div class="small-12 columns" style="margin-top:10px;"><select id="context-selector-dark">${darkOptions}</select></div>
                <div class="small-12 columns">
                    <p class="meta"><strong>Note:</strong> Not all text on SchoL will be compatible with dark mode, due to overridden custom formatting added to news/blog posts.</p>
                </div>
            </fieldset>
        </section>
        `

    function injectModule(html) {
        // Get the div tag with the id customStuff
        var div = document.getElementById("customStuff");
        
        // Append the HTML to the div tag
        div.innerHTML += html;
    }

    injectModule(module_darkMode)

    // When the page loads, add an event listener to the theme selector.
    document.querySelector("#context-selector-dark").value = extConfig.darkmodetheme;
    document.querySelector("#context-selector-dark").addEventListener("change", async function() {
        // Write to and save darkmode theme config
        extConfig.darkmodetheme = this.value;
        extConfig.updated = Date.now();
        localStorage.setItem("extConfig", JSON.stringify(extConfig))
        await postConfig();

        // localStorage.setItem("theme", this.value);
        window.location.reload();
        // updateTheme(this.value);
    });

    for (const setting in settings) {
        const toggle_setting = document.getElementById("toggle_" + setting)
        if (extConfig.settings[setting]) { toggle_setting.setAttribute("checked", 1) }
        else { toggle_setting.removeAttribute("checked", 1) }

        toggle_setting.addEventListener("change", async function () {
            extConfig.settings[setting] = toggle_setting.checked;
            extConfig.updated = Date.now();
            localStorage.setItem("extConfig", JSON.stringify(extConfig))
            await postConfig();
        })
    }

    let elem_imageupload = document.getElementById("image-uploader")
    let elem_resetbtn = document.getElementById("resetbtn")
    let elem_currenttheme = document.getElementById("currenttheme")
    let elem_importtext = document.getElementById("importtext")
    let elem_importbtn = document.getElementById("importbtn")
    let elem_exportbtn = document.getElementById("exportbtn")
    let elem_themeselector = document.getElementById("context-selector-themes")
    document.addEventListener("drop", async function(event) {
        if (!event.target.classList.contains("image-drop-zone")) return;
        event.preventDefault()
        if (event.dataTransfer && event.dataTransfer.files) {
            var fileType = event.dataTransfer.files[0].type;
            if (IMAGE_TYPES.includes(fileType)) {
                if (!localStorage.getItem("hasUploaded") && !window.confirm("This image will be stored privately on school servers under your account. Continue?")) {
                    event.target.parentElement.style.border = "5px solid red"
                    return
                }
                event.target.parentElement.style.border = "5px solid green"
                let formData = new FormData();
                formData.append("upload", event.dataTransfer.files[0]);
                const url = "https://learning.stmichaels.vic.edu.au" + ((await postImage(formData)).meta.file._links.image)
                const row = event.target.parentElement.parentElement.parentElement
                const subject = row.querySelector("td").innerText
                extConfig.theme[subject].image = url
                row.style.backgroundImage = "url(" + url + ")"
                row.style.backgroundSize = "100% 100%"
                localStorage.setItem("extConfig", JSON.stringify(extConfig))
                await postConfig()
                localStorage.setItem("hasUploaded", 1)
            } else {
                event.target.parentElement.style.border = "5px solid red"
            }
        }
    }, true)
    for (const pronoun of document.querySelectorAll("#pronoun-list input")) {
        if (extConfig.pronouns.selected.includes(pronoun.name)) {
            pronoun.checked = true
        }
        pronoun.addEventListener("change", async function() {
            if (!pronoun.checked) extConfig.pronouns.selected = extConfig.pronouns.selected.filter(e => e != pronoun.name)
            else if (!extConfig.pronouns.selected.includes(pronoun.name)) extConfig.pronouns.selected.push(pronoun.name)

            document.getElementById("pronounslabel").innerText = "Pronouns: " + extConfig.pronouns.selected.map(e => VALID_PRONOUNS[e]).join(", ")
            document.getElementById("pronounsrow").innerText = extConfig.pronouns.selected.map(e => VALID_PRONOUNS[e]).join(", ")
            if (!extConfig.pronouns.selected.length) {
                document.getElementById("pronounslabel").style.setProperty("display", "none", "important")
                document.getElementById("pronounsrow").parentNode.style.setProperty("display", "none", "important")
            } else {
                document.getElementById("pronounslabel").style.display = ""
                document.getElementById("pronounsrow").parentNode.style.display = ""
            }
            extConfig.updated = Date.now();
            localStorage.setItem("extConfig", JSON.stringify(extConfig))
            await postConfig();
        })
    }
    for (const role of document.querySelectorAll("#pronoun-roles input")) {
        if (extConfig.pronouns.show[parseInt(role.name)]) {
            role.checked = true
        }
        role.addEventListener("change", async function() {
            extConfig.pronouns.show[parseInt(role.name)] = role.checked
            extConfig.updated = Date.now();
            localStorage.setItem("extConfig", JSON.stringify(extConfig))
            await postConfig();
        })
    }

    function updateThemeExport() {
        elem_currenttheme.value = Object.values(extConfig.theme).map(e => {if (e["current"] === "color") {return e["color"]}})
        .filter(e => e !== undefined)
        .map((e) => {
            return rgbToHex(...e.replace(/[^\d\s]/g, '').split(' ').map(Number))
        }
        ).join("-").replaceAll("#", "").toUpperCase()
    }
    updateThemeExport();

    for (const row of document.querySelectorAll(".subject-color-row")) {
        const subject = row.children[0].innerText;
        // Colour picker input
        if (!row.children[1]) continue;
        row.children[1].children[0].children[0].addEventListener("change", async function(e) {
            const rgbval = "rgb(" + hexToRgb(e.target.value) + ")"
            row.style.borderLeft = "7px solid " + rgbval
            row.style.backgroundColor = rgbval.replace("rgb", "rgba").replace(")", ", 10%)")

            extConfig.theme[subject].color = rgbval
            extConfig.theme[subject].current = "color"
            extConfig.updated = Date.now();
            localStorage.setItem("extConfig", JSON.stringify(extConfig))
            colourSidebar();
            updateThemeExport();
            await postConfig();
        })
        // Image picker input
        row.children[1].children[0].children[1].addEventListener("change", async function(e) {
            const url = e.target.value
            let valid_url = url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g) !== null && e.target.reportValidity()

            e.target.style.border = valid_url ? "solid green 2px" : "solid red 1px"
            row.querySelector(".invalidurl").style.display = valid_url ? "none" : ""

            extConfig.theme[subject].image = valid_url ? url : null
            extConfig.theme[subject].current = valid_url ? "image" : "color"
            row.style.backgroundImage = valid_url ? "url(" + url + ")" : ""
            row.style.backgroundSize = "100% 100%"
            extConfig.updated = Date.now();
            localStorage.setItem("extConfig", JSON.stringify(extConfig))
            await postConfig();

            setTimeout(function() {
                e.target.style.border = ""
            }, 5000)
        })
        // Reset button
        row.children[2].children[0].addEventListener("click", async function () {
            const rgbval = extConfig.themedefault[subject].color

            row.style.borderLeft = "7px solid " + rgbval
            row.style.backgroundColor = rgbval.replace("rgb", "rgba").replace(")", ", 10%)")
            row.style.backgroundImage = ""
            row.style.backgroundSize = "100% 100%"
            row.children[1].children[0].children[0].value = rgbToHex(...rgbval.replace(/[^\d\s]/g, '').split(' ').map(Number))
            row.children[1].children[0].children[1].value = ""

            extConfig.theme[subject] = {color: rgbval, image: null, current: "color"}
            extConfig.updated = Date.now();
            localStorage.setItem("extConfig", JSON.stringify(extConfig))
            colourSidebar();
            updateThemeExport();
            await postConfig();
        })
        // Image button
        row.children[3].children[0].addEventListener("click", async function () {
            extConfig.theme[subject]["current"] = "image"
            extConfig.updated = Date.now();
            localStorage.setItem("extConfig", JSON.stringify(extConfig))
            row.children[1].children[0].children[0].style.display = "none"
            row.children[1].children[0].children[1].style.display = ""
            row.style.backgroundImage = "url(" + extConfig.theme[subject]["image"] + ")"
            row.style.backgroundSize = "100% 100%"
            row.children[3].children[0].style.display = "none"
            row.children[3].children[1].style.display = ""
            await postConfig();
        })
        // Colour button
        row.children[3].children[1].addEventListener("click", async function () {
            extConfig.theme[subject]["current"] = "color"
            extConfig.updated = Date.now();
            localStorage.setItem("extConfig", JSON.stringify(extConfig))
            row.children[1].children[0].children[0].style.display = ""
            row.children[1].children[0].children[1].style.display = "none"
            row.style.backgroundColor = extConfig.theme[subject].color.replace("rgb", "rgba").replace(")", ", 10%)")
            row.style.backgroundImage = ""
            row.children[3].children[0].style.display = ""
            row.children[3].children[1].style.display = "none"
            row.querySelector(".invalidurl").style.display = "none"
            await postConfig();
        })
    }
    elem_themeselector.addEventListener("change", async function(evt){
        let newtheme = evt.target.value.split("-")
        let currenttheme = Object.assign({}, extConfig.themedefault)
        console.log(evt.target)
        localStorage.setItem("currentTheme", elem_themeselector.options[elem_themeselector.selectedIndex].text)
        let i = 0
        for (subjectcode in currenttheme) {
            currenttheme[subjectcode] = {color: "rgb(" + hexToRgb(newtheme[i]) + ")", image: null, current: "color"}
            i++; if (i >= newtheme.length) { i = 0; }
        }
        extConfig.theme = currenttheme;
        extConfig.updated = Date.now();
        localStorage.setItem("extConfig", JSON.stringify(extConfig))
        await postConfig()
        window.location.reload()
    })
    elem_exportbtn.addEventListener("click", function () {
        elem_exportbtn.innerText = "Copied!"
        if (navigator.userAgent.match(/ipad|iphone/i)) {
            Clipboard.copy(elem_currenttheme.value)
        } else {
            elem_currenttheme.select();
            document.execCommand("copy");
        }
        setTimeout(() => { elem_exportbtn.innerText = "Export" }, 1000)
    })
    elem_importbtn.addEventListener("click", async function () {
        if (!elem_importtext.value) { return }
        let currenttheme = extConfig.themedefault
        const newtheme = rgbsFromHexes(elem_importtext.value)
        if (newtheme.length == 0) {
            elem_importbtn.parentElement.insertAdjacentHTML("afterend", `<div data-alert class="alert-box alert themecodealert"><strong>Invalid Input:</strong> Ensure the text you enter is a list of hex codes seperated by dashes or a coolors.co link.<br><br>For example: "d9ed92-b5e48c-99d98c-76c893-52b69a-34a0a4"</div>`)
            setTimeout(function () {
                document.querySelector(".themecodealert")?.remove()
            }, 6000)
            return
        }
        let i = 0
        for (subjectcode in currenttheme) {
            currenttheme[subjectcode] = {color: newtheme[i], image: null, current: "color"}
            i++; if (i >= newtheme.length) { i = 0; }
        }
        extConfig.theme = currenttheme;
        extConfig.updated = Date.now();
        localStorage.setItem("extConfig", JSON.stringify(extConfig))
        await postConfig();
        window.location.reload()
    })
    elem_resetbtn.addEventListener("click", async function () {
        if (!confirm("Reset: This will reset all your theme colours and settings back to default, are you sure you want to do this?")) return;
        extConfig = DEFAULT_CONFIG;
        await timetableCache(true)
        window.location.reload()
    })
    elem_importtext.addEventListener("keyup", function () {
        if (!elem_importtext.value) {
            elem_importbtn.classList = "button disabled"
        } else {
            elem_importbtn.classList = "button"
        }
    })
}

function dueWork() {
    if(!document.querySelector(".event-container span.fc-event-title") !== null && document.querySelector("span[recoloured]") !== null) return;
    colourDuework()
    for (const duework of document.querySelectorAll(".event-container span.fc-event-title")) {
        duework.setAttribute("recoloured", 1)
        const subjects = REGEXP.exec(duework.innerText)[1]?.split(",")
        if (!subjects) continue
        for (const subject of subjects) {
            const colour = extConfig.theme[subject]?.color
            if (!colour) { continue }
            const textcol = getTextColor(rgbToHex(...colour.replace(/[^\d\s]/g, '').split(' ').map(Number)).toUpperCase())
            duework.parentNode.style.backgroundColor = colour
            for (const title of duework.parentNode.children) {
                title.style.color = textcol
            }
        }
    }
}

async function myLearningTab() {
    let myLearningContent;
    let myLearningLoaded = false;
    let myLearningTabEl;
    let setMyLearningView;

    const renderEmptyState = msg => `
            <div class="empty-state no-margin">
                <i class="icon-news"></i>
                <p>${msg}</p>
            </div>`;

    function timeSince(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        const intervals = [
            { limit: 31536000, label: 'year' },
            { limit: 2592000, label: 'month' },
            { limit: 86400, label: 'day' },
            { limit: 3600, label: 'hour' },
            { limit: 60, label: 'minute' }
        ];
        for (let i of intervals) {
            const count = Math.floor(seconds / i.limit);
            if (count >= 1) return `${count} ${i.label}${count !== 1 ? 's' : ''} ago`;
        }
        return "just now";
    }

    function renderNewsArticle(article, savedIds) {
        const pubDate = new Date(article.publishAt);
        
        const timeTitle = pubDate.toLocaleDateString("en-AU", { 
            day: "2-digit", month: "2-digit", year: "numeric" 
        }) + " " + pubDate.toLocaleTimeString("en-AU", {
            hour: "numeric", minute: "2-digit", hour12: true 
        }).replace(" ", "").toLowerCase();
        
        const timeAgoStr = timeSince(pubDate);

        let imageHtml = "";
        if (article.featureImage?.hash) {
            const hash = article.featureImage.hash;
            imageHtml = `<a href="/news/${article.id}?ref=dashboard"><img srcset="/storage/image.php?hash=${hash}&amp;size=constrain200, /storage/image.php?hash=${hash}&amp;size=constrain300 1.5x" src="/storage/image.php?hash=${hash}&amp;size=constrain200" alt="feature image"></a>`;
        } else if (article.author?._links?.avatar?.href) {
            imageHtml = `<div class="card-feature-avatar"><a href="/news/${article.id}?ref=dashboard"><img src="${article.author._links.avatar.href}&amp;size=square64" alt="author portrait"></a></div>`;
        }

        const authorHref = article.author?._links?.profile?.href || "#";
        const authorName = article.author?.fullname || "Unknown Author";

        let topicsHtml = "";
        if (article.topics?.length) {
            const topicsList = article.topics.map(t => `<a href="/news?topic=${t.slug}">${t.name}</a>`).join(", ");
            topicsHtml = ` <span>in ${topicsList}</span>`;
        }

        const attachmentsHtml = article.attachments ? ` <span>| <a href="/news/${article.id}?ref=dashboard#article-attachments">${article.attachments} attachments</a></span>` : "";
        
        const isSaved = savedIds.includes(article.id);
        const favClass = isSaved ? 'icon-favourite' : 'icon-favourite-hollow';
        const favTitle = isSaved ? 'Remove from saved' : 'Save for later';
        
        return `
        <li class="actions-small-1 read">
            <div class="list-item">
                <div class="small-12 card wrap-down">
                    ${imageHtml}
                    <h3><a href="/news/${article.id}?ref=dashboard">${article.title}</a></h3> 
                    <p class="meta">
                        <span>By  <a href="${authorHref}">${authorName}</a></span> 
                        <span>— <time title="${timeTitle}">${timeAgoStr}</time></span> 
                        ${topicsHtml}
                        ${attachmentsHtml}
                    </p> 
                    <article>
                        <div>${article.blurb || ''}</div> 
                        <div class="article-read-more"><a href="/news/${article.id}?ref=dashboard">Click here to read the full article...</a></div>
                    </article>
                </div>
            </div> 
            <nav>
                <a class="save-for-later-btn ${favClass}" data-id="${article.id}" title="${favTitle}" style="cursor: pointer;"></a>
            </nav>
        </li>
        `;
    }

    async function fetchMyLearningFeed() {
        const subjectCodes = extConfig?.theme ? Object.keys(extConfig.theme) : [];
        if (!subjectCodes.length) return { matchedArticles: [], savedIds: [] };

        const [feedRes, savedRes] = await Promise.all([
            fetch("https://learning.stmichaels.vic.edu.au/news/lists/feed"),
            fetch("https://learning.stmichaels.vic.edu.au/news/saved", {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
        ]);

        if (!feedRes.ok) throw new Error("Could not fetch feed");
        const feedData = await feedRes.json();
        
        const savedIds = savedRes.ok ? await savedRes.json().catch(() => []) : [];

        const matchedArticles = [];

        await Promise.all(feedData.map(async (article) => {
            try {
                const articleRes = await fetch(`https://learning.stmichaels.vic.edu.au/news/${article.id}`, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                if (!articleRes.ok) return;
                const htmlText = await articleRes.text();
                
                const audienceIdx = htmlText.indexOf("audienceSegments");
                if (audienceIdx !== -1) {
                    const relevantText = htmlText.substring(audienceIdx, audienceIdx + 4000);
                    if (subjectCodes.some(sc => relevantText.includes(sc))) {
                        matchedArticles.push(article);
                    }
                }
            } catch (err) {
                console.error(`Failed reading article ${article.id}`, err);
            }
        }));

        matchedArticles.sort((a, b) => new Date(b.publishAt) - new Date(a.publishAt));
        return { matchedArticles, savedIds };
    }

    async function handleSaveForLater(btn) {
        const id = btn.getAttribute('data-id');
        const isSaved = btn.classList.contains('icon-favourite');
        const action = isSaved ? 'remove' : 'add';
        const url = `https://learning.stmichaels.vic.edu.au/news/saved/${id}/${action}`;
        
        btn.classList.toggle('icon-favourite');
        btn.classList.toggle('icon-favourite-hollow');
        btn.title = isSaved ? "Save for later" : "Remove from saved";

        try {
            const res = await fetch(url, { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!res.ok) throw new Error("Failed to update saved state");
        } catch (err) {
            console.error("Failed to toggle favourite", err);
            btn.classList.toggle('icon-favourite');
            btn.classList.toggle('icon-favourite-hollow');
            btn.title = isSaved ? "Remove from saved" : "Save for later";
        }
    }

    async function loadMyLearning() {
        myLearningLoaded = true;
        myLearningContent.innerHTML = renderEmptyState("Loading My Learning...");

        try {
            const { matchedArticles, savedIds } = await fetchMyLearningFeed();

            if (matchedArticles.length > 0) {
                myLearningContent.innerHTML = `<ul class="information-list">` + 
                    matchedArticles.map(article => renderNewsArticle(article, savedIds)).join("") + 
                    `</ul>`;

                myLearningContent.addEventListener('click', async (e) => {
                    const btn = e.target.closest('.save-for-later-btn');
                    if (btn) {
                        e.preventDefault();
                        await handleSaveForLater(btn);
                    }
                });
            } else {
                myLearningContent.innerHTML = renderEmptyState("No My Learning news to view at this time.");
            }
        } catch (error) {
            console.error("Failed to load My Learning news", error);
            myLearningContent.innerHTML = renderEmptyState("Failed to load My Learning news.");
            myLearningLoaded = false;
        }
    }

    // Now loop to find the tabs
    let attempts = 0;
    const interval = setInterval(() => {
        let newsComponent = document.getElementById("news-component");
        let tabs, tabsContent;

        if (newsComponent) {
            tabs = newsComponent.querySelector(".tabs");
            tabsContent = newsComponent.querySelector(".tabs-content");
        } else {
            // On /news page
            tabsContent = document.querySelector(".tabs-content");
            if (tabsContent && tabsContent.previousElementSibling && tabsContent.previousElementSibling.classList.contains("tabs")) {
                tabs = tabsContent.previousElementSibling;
            } else {
                tabs = document.querySelector("dl.tabs, ul.tabs, .tabs");
            }
            newsComponent = document; // fallback
        }

        if (tabs && tabsContent) {
            clearInterval(interval);
            if (!tabs.innerHTML.includes("My Learning")) {
                const componentAction = newsComponent !== document ? newsComponent.querySelector(".component-action") : null;
                
                myLearningContent = document.createElement("div");
                myLearningContent.className = "tabs-content no-margin";
                myLearningContent.style.display = "none";
                myLearningContent.innerHTML = renderEmptyState("No news to view at this time.");
                tabsContent.insertAdjacentElement("afterend", myLearningContent);

                setMyLearningView = (enabled) => {
                    tabsContent.style.display = enabled ? "none" : "";
                    myLearningContent.style.display = enabled ? "" : "none";
                    if (componentAction) componentAction.style.display = enabled ? "none" : "";
                };

                myLearningTabEl = document.createElement("dd");
                myLearningTabEl.className = "my-learning-tab";
                myLearningTabEl.innerHTML = `<a>My Learning</a>`;
                tabs.appendChild(myLearningTabEl);
                
                // Event delegation
                tabs.addEventListener("click", async (e) => {
                    const clickedTab = e.target.closest("dd, li, .tab-item"); // Be flexible with tab container types
                    if (!clickedTab) return;

                    if (clickedTab === myLearningTabEl || myLearningTabEl.contains(clickedTab)) {
                        e.preventDefault();
                        tabs.querySelectorAll(".active").forEach(el => el.classList.remove("active"));
                        myLearningTabEl.classList.add("active");
                        setMyLearningView(true);

                        if (!myLearningLoaded) {
                            await loadMyLearning();
                        }
                    } else if (myLearningTabEl.classList.contains("active")) {
                        myLearningTabEl.classList.remove("active");
                        setMyLearningView(false);
                    }
                });
            }
        }
        
        attempts++;
        if (attempts > 20) { // Gives up after ~10 seconds
            clearInterval(interval);
            console.warn("[SCHOLEXT] Could not find .tabs or .tabs-content for My Learning tab on /news.");
        }
    }, 500);
}

function colourEDiaryList() {
    if (document.querySelector("div[id='calender']") && document.querySelector("div[id='calender']").querySelector("div.empty-state > p").textContent === "There are no upcoming calendar events") return;
    if (document.querySelectorAll(".fc-list-event").length === 0) {setTimeout(colourEDiaryList, 500); return}
    document.querySelectorAll(".fc-list-event").forEach(event => {
        const eventDot = event.querySelector(".fc-list-event-dot");
        eventDot.style.backgroundColor = eventDot.style.borderColor
        const subjectcode = REGEXP.exec(event.querySelector(".fc-event-title").innerText)
        if (!subjectcode) return;
        const colour = extConfig.theme[subjectcode[1]]?.color
        if (!colour) return;
        eventDot.style.borderColor = colour
        eventDot.style.backgroundColor = colour
    })
}

function confettiGrades() {
    if (schoolboxUser.role.student === true) { // Only run confetti for students
        const confettiGrades = document.createElement("script");
        confettiGrades.src = (FILE_URL + "/confetti/confetti.js");
        
        confettiGrades.onload = async () => {
            const CONFETTI_STORAGE_KEY = "scholConfettiGrades";
            const CONFETTI_STORAGE_TTL_MS = 365 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            let confettiSeen = {};

            try {
                confettiSeen = JSON.parse(localStorage.getItem(CONFETTI_STORAGE_KEY) || "{}") || {};
            } catch (e) {
                confettiSeen = {};
            }

            Object.keys(confettiSeen).forEach(key => {
                if (!confettiSeen[key] || now - confettiSeen[key] > CONFETTI_STORAGE_TTL_MS) {
                    delete confettiSeen[key];
                }
            });

            try {
                localStorage.setItem(CONFETTI_STORAGE_KEY, JSON.stringify(confettiSeen));
            } catch (e) {}

            const assessmentMatch = window.location.pathname.match(/^\/learning\/assessments\/(\d+)\/\d+\/?$/);
            const assessmentId = assessmentMatch ? assessmentMatch[1] : null;
            const confettiStorageKey = assessmentId ? `assessment:${assessmentId}` : null;

            let attempts = 0;
            let gradeDiv = document.querySelectorAll(".grade");
            // wait until there is at least 1 grade element on the page
            while (gradeDiv.length < 1 && attempts < 8) {
                await new Promise(resolve => setTimeout(resolve, 150));
                gradeDiv = document.querySelectorAll(".grade");
                attempts++;
            }
            gradeDiv = document.querySelectorAll(".grade");
            let confettiRunning = false;
            let autoTriggered = false;

            const triggerConfetti = (gradeDiv, override = {}) => {
                if (confettiRunning) return;
                confettiRunning = true;

                const gradeRect = gradeDiv.getBoundingClientRect();
                const gradeOriginX = (gradeRect.left + gradeRect.width / 2) / window.innerWidth;
                const gradeOriginY = (gradeRect.top + gradeRect.height / 2) / window.innerHeight;
                window.confetti({
                    particleCount: window.innerWidth >= 950 ? 100 : 75,
                    spread: window.innerWidth >= 950 ? 90 : 160,
                    decay: 0.86,
                    scalar: 1.25,
                    gravity: 1.02,
                    ticks: 90,
                    startVelocity: window.innerWidth >= 950 ? 40 : 35,
                    origin: { x: gradeOriginX, y: gradeOriginY },
                    angle: window.innerWidth >= 950 ? 130 : 90,
                    disableForReducedMotion: true,
                    ...override
                }).finally(() => {
                    confettiRunning = false;
                }).catch(error => {
                    console.error("Confetti grade error:", error);
                    confettiRunning = false;
                });
            };

            const firstGradeDiv = gradeDiv[0];
            if (!firstGradeDiv) return;

            const gradeText = firstGradeDiv.textContent.trim();
            let gradeValue = null;

                // if grade is a percentage
            if (gradeText.includes("%")) {
                gradeValue = parseFloat(gradeText.replace('%', ''));
            }

                // if grade is a fraction
            else if (gradeText.includes(" / ")) {
                let [numerator, denominator] = gradeText.split(" / ").map(Number);
                gradeValue = denominator ? (numerator / denominator) * 100 : 0;
            }

                // if grade is a letter
            else if (gradeText.includes("A+")) {
                gradeValue = 95;
            }

                // When hovering over grade
            const markSeen = () => {
                if (!confettiStorageKey) return;
                confettiSeen[confettiStorageKey] = Date.now();
                try {
                    localStorage.setItem(CONFETTI_STORAGE_KEY, JSON.stringify(confettiSeen));
                } catch (e) {}
            };

            const shouldTriggerFirstOpen = !!confettiStorageKey && gradeValue >= minConfettiGrade && !confettiSeen[confettiStorageKey];

            if (shouldTriggerFirstOpen && !autoTriggered) {
                autoTriggered = true;
                confettiRunning = true;
                const gradeRect = firstGradeDiv.getBoundingClientRect();
                const gradeOriginX = (gradeRect.left + gradeRect.width / 2) / window.innerWidth;
                const gradeOriginY = (gradeRect.top + gradeRect.height / 2) / window.innerHeight;
                const burstCount = 6;
                const particlesPerBurst = 70;
                const burstPromises = [];

                for (let i = 0; i < burstCount; i++) {
                    burstPromises.push(window.confetti({
                        particleCount: particlesPerBurst,
                        spread: 360,
                        startVelocity: 12 + Math.random() * 50,
                        ticks: 250,
                        scalar: 1.4,
                        decay: 0.92,
                        disableForReducedMotion: true,
                        origin: { x: gradeOriginX, y: gradeOriginY }
                    }));
                }

                Promise.allSettled(burstPromises).finally(() => {
                    confettiRunning = false;
                });
                markSeen();
            }

            firstGradeDiv.addEventListener('click', () => {
                if (shouldTriggerFirstOpen) {
                    triggerConfetti(firstGradeDiv);
                    markSeen();
                }
            });

            firstGradeDiv.addEventListener('mouseenter', () => {
                if (gradeValue >= minConfettiGrade && !confettiRunning) {
                    triggerConfetti(firstGradeDiv);
                    if (!confettiSeen[confettiStorageKey]) {
                        markSeen();
                    }
                }
            });
        };
        confettiGrades.onerror = () => {
            console.error("Failed to load confetti script from", (FILE_URL + "/confetti/confetti.js"));
        };
        document.head.appendChild(confettiGrades);
    }
}

function feedback() {
    // Add "Click to view feedback" button for junior school & Y12 feedback as overall grades do not show
    for (const subject of document.querySelectorAll(".activity-list")) {
        if (!subject.querySelector(".no-margin")) { continue; }
        if (!subject.querySelector(".flex-grade")) { continue; }

        if (SHOW_FEEDBACKS.some(w => subject.querySelector(".no-margin").innerText.includes(w))) {
            subject.querySelector(".flex-grade").innerHTML += `<div class="grade gradient-10-bg no-margin"><span>Click to view feedback</span></div>`;
        }
    }
    // Remove grade summary pages for years where there are none to show (Junior school and Yr12)
    const studentyear = parseInt(document.querySelector(".card a p.meta")?.innerText.replace(/\D/g, ''));
    if (!isNaN(studentyear)) {
        const currentyear = new Date().getFullYear()
        let maxvalidyear = currentyear
        let minvalidyear = currentyear - (studentyear - 12 + 5)

        if (studentyear <= 6 || studentyear > 12) { maxvalidyear += 1; minvalidyear = maxvalidyear }
        if (studentyear == 12) { maxvalidyear -= 1 }
        if (minvalidyear < 2021) { minvalidyear = 2021 }

        for (summary of document.querySelectorAll("select#context-selector-semester option[value]")) {
            if (summary.innerText.includes("Summary") && !(parseInt(summary.value) >= minvalidyear && parseInt(summary.value) <= maxvalidyear)) {
                summary.style.display = "none"
            }
        }
    }
    // Add colour to feedback classes
    // ~ Desktop
    for (const subject of document.querySelectorAll("ul.activity-list")) {
        const subjectrawcodes = subject.querySelector(".subject-group span.meta")?.innerText.replace("), (", ",")
        if (!subjectrawcodes) continue;
        if (REGEXP.exec(subjectrawcodes)[1]) {
            const subjectcodes = REGEXP.exec(subjectrawcodes)[1]?.split(",")
            for (const subjectcode of subjectcodes) {
                const colour = extConfig.theme[subjectcode]?.color
                if (!colour) { continue; }
                subject.style.borderLeft = "7px solid " + colour
                subject.style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
                subject.children[0].style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
                subject.children[1].style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
            }
        }
    }

    // Add confetti to grades over 90%
    confettiGrades()
}

function assessments() {
    // Add confetti to grades over 90%
    confettiGrades()

    let subheaders = document.querySelectorAll(".subheader");
    for (e of subheaders) {
        if (!["SUBMIT RESPONSE", "SUBMISSION HISTORY"].includes(e.innerText)) continue

        let matches = document.querySelector(".breadcrumb")?.innerText.match(REGEXP);
        let matches2 = document.querySelector(".breadcrumb")?.innerText.match(REGEXP2);
        let match = matches ? matches[0] : matches2[0];

        if (7 <= parseInt(match.slice(1, 3)) && parseInt(match.slice(1, 3)) <= 11) {
            const rows = document.querySelectorAll(".row");
            rows[rows.length - 1].insertAdjacentHTML("beforeend", `<div class="small-12 island">
                <section style="text-align: center; padding-bottom: 10px">
                    <img src="${FILE_URL}/achievement/achievement.webp">
                </section>
            </div>`)
        }
        break
    }

    // Print Rubric
    const markable = document.querySelector("table.markable") || document.querySelector(".markable");
    if (!markable) return;

    if (!document.querySelector("#print-rubric-button-landscape")) {
        markable.insertAdjacentHTML("beforebegin", `
            <a id="print-rubric-button-landscape" class="button show-for-landscape print-rubric-btn" style="margin-top: 0; float: right; display: inline-block">Print Rubric</a>
            <a id="print-rubric-button-portrait" class="button show-for-portrait print-rubric-btn" style="margin-top: 10px; display: inline-block">Print Rubric</a>
        `);
    }

    function buildRubricPrintHtml(markableEl, details) {
        // Determine if we should use landscape or portrait based on table dimensions
        let orientation = 'landscape'; // default
        
        // Count columns and rows to determine orientation
        const table = markableEl.querySelector('table');
        if (table) {
            const numRows = table.querySelectorAll('tr').length;
            const numCols = table.querySelector('tr')?.querySelectorAll('th, td').length || 0;
            
            // If more rows than columns (tall table), use portrait
            if (numRows > numCols * 1.5) {
                orientation = 'portrait';
            }
        }
        
        return `
        <!DOCTYPE html>
        <html>
            <head>
            <meta charset="utf-8">
            <title>${details.title} - Rubric</title>
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
                @page {
                    size: ${orientation};
                    margin: 15mm;
                }
                html,body {
                    font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
                    line-height:1.35;
                    color:#222;
                }
                body {
                    margin:0;
                    padding:0;
                }
                h1 {
                    font-size: 1.5em;
                    margin:0 0 .5em;
                }
                h2,h3,h4 {
                    margin:1.2em 0 .5em;
                    line-height:1.2;
                }
                .assessment-details ul {
                    list-style-type: none;
                    padding: 0;
                    margin-bottom: 20px;
                }
                .assessment-details ul li {
                    margin-bottom: 5px;
                }
                table {
                    width:100%;
                    border-collapse:collapse;
                    margin:12px 0;
                    font-size:13px;
                }
                th,td {
                    border:1px solid #cfcfcf;
                    padding:6px 8px;
                    vertical-align:top;
                    background:#fff;
                }
                th {
                background:#f5f5f5;
                }
                tr {
                    page-break-inside: avoid;
                }
                .print-meta {
                    font-size:11px;
                    color:#555;
                    margin:10px 0;
                }
                .markable table {
                    page-break-inside:avoid;
                }
                td, td * {
                    color:#222 !important;
                }
            </style>
            </head>
        <body>
            <div class="assessment-details">
                <h1>${details.title}</h1>
                <ul>
                    <li><strong>Due:</strong> ${details.due}</li>
                    <li><strong>Weighting:</strong> ${details.weighting}</li>
                </ul>
            </div>
            ${markableEl.outerHTML}
            <script>
                window.addEventListener('load', function(){
                    setTimeout(function(){ 
                        try { window.print(); } catch(e) {}
                    }, 50);
                });
                window.onafterprint = function(){
                    setTimeout(function(){
                        try { window.close(); } catch(e) {}
                    }, 100);
                };
            </script>
        </body>
        </html>
        `;
        }

        function openRubricPrint() {
            const source = document.querySelector("table.markable") || document.querySelector(".markable");
            if (!source) return;

            const clone = source.cloneNode(true);

            clone.querySelectorAll(".hide-on-print").forEach(e => e.remove());

            const details = {
                title: document.querySelector(".small-12.columns h1")?.innerText || 'Assessment',
                due: document.querySelector(".small-12.columns .icon-calendar span")?.title || 'N/A',
                weighting: document.querySelector(".small-12.columns .icon-due-work")?.innerText.match(/Weighting:\s*(\d+)/)?.[1] || 'N/A'
            };

            const html = buildRubricPrintHtml(clone, details);
            const blob = new Blob([html], { type: "text/html" });
            const url = URL.createObjectURL(blob);

            const w = window.open(url, "_blank");
            if (!w) return;
        }

        document.addEventListener("click", (e) => {
            if (e.target && e.target.classList.contains("print-rubric-btn")) {
                openRubricPrint();
            }
        });
}

function eDiary() {
    const page = document.querySelector(".fc-button-group .fc-button-active").innerText

    if (page == "List") {
        colourEDiaryList()
    } else {
        document.querySelectorAll(".fc-timegrid-event, .fc-daygrid-event").forEach(event => {
            const subjectcode = REGEXP.exec(event.innerText)
            if (!subjectcode) return;
            const colour = extConfig.theme[subjectcode[1]]?.color
            if (!colour) return;
            const textcol = getTextColor(rgbToHex(...colour.replace(/[^\d\s]/g, '').split(' ').map(Number)).toUpperCase())
            event.style.backgroundColor = colour
            event.querySelectorAll("*").forEach(e => { e.style.color = textcol })
        })
    }
    if (page == "Month") {
        for (const event of document.querySelectorAll("div.fc-popover-body .fc-daygrid-event:not([recoloured])")) {
            const subjectcode = REGEXP.exec(event.innerText)
            if (!subjectcode) continue;
            const colour = extConfig.theme[subjectcode[1]]?.color
            if (!colour) continue;
            const textcol = getTextColor(rgbToHex(...colour.replace(/[^\d\s]/g, '').split(' ').map(Number)).toUpperCase())
            event.style.backgroundColor = colour
            event.querySelectorAll("*").forEach(e => { e.style.color = textcol })
            event.setAttribute("recoloured", 1)
        }
    }
}
async function mainPage() {
    const timetableHeader = document.querySelector("h2[data-timetable-header]");
    if (timetableHeader) {
        fetch("https://services.stmichaels.vic.edu.au/dwi.cfm?otype=json")
            .then(r => r.json())
            .then(r => {
                let dayWeekText;
                if (r.D === "0" && r.W === "0" && r.text) {
                    dayWeekText = r.text;
                } else {
                    dayWeekText = `Day ${r.D} Week ${r.W}`;
                }

                if (document.querySelector(".island")) {
                    document.querySelector(".island").insertAdjacentHTML("afterbegin", `<h2 class="subheader">${dayWeekText}</h2>`);
                }

                timetableHeader.style.display = "none";
            })
            .catch(error => {
                console.error("Failed to fetch services dwi info", error);
                timetableHeader.style.display = "block";
            });
    } else {
        fetch("https://services.stmichaels.vic.edu.au/dwi.cfm?otype=json")
            .then(r => r.json())
            .then(r => {
                let dayWeekText;
                if (r.D === "0" && r.W === "0" && r.text) {
                    dayWeekText = r.text;
                } else {
                    dayWeekText = `Day ${r.D} Week ${r.W}`;
                }
                document.querySelector(".island")?.insertAdjacentHTML("afterbegin", `<h2 class="subheader">${dayWeekText}</h2>`);
            });
    }

    // compact timetable
    if (extConfig.settings.compacttimetable) {
        // Timetable - remove any blank spots such as "After School Sport" if there is nothing there
        const heading = document.querySelectorAll(".timetable th, .show-for-small-only th")
        const body = document.querySelectorAll(".timetable td, .show-for-small-only td")
        for (let index = 0; index < heading.length; index++) {
            if (!TIMETABLE_WHITELIST.includes(heading[index].childNodes[0].textContent.trim()) && !body[index].textContent.trim()) {
                heading[index].remove()
                body[index].remove()
            }
        }
    }

    // Hide papercut component if not on school intranet
    try {
        await fetch("https://print.stmichaels.vic.edu.au/js/refresh.js", { mode: 'no-cors' })
    } catch (error) {
        if (error.name === 'TypeError') {
            const papercut = document.querySelector(".Component_Dashboard_PapercutController");
            if (papercut) papercut.style.display = "none";
        }
    }
 
    // ptv stuff
    (document.querySelector(".awardsComponent") || document.querySelector("#component68"))?.insertAdjacentHTML("afterend", `
    <style>
        .PTVIcon .line-pill .route-lock-up {
            display: inline-block;
            padding-right: 5px;
            padding-left: 2px;
            height: 28px;
            border: 2px solid;
            border-radius: 100px;
            display: -webkit-inline-box; display: -webkit-inline-flex; display: -ms-inline-flexbox; display: inline-flex;
            -webkit-box-align: center; -webkit-align-items: center; -ms-flex-align: center; align-items: center;
            box-sizing: border-box;
        }
        .PTVIcon .line-pill .route-lock-up span {
            -webkit-box-flex: 1; -webkit-flex: 1 0 auto; -ms-flex: 1 0 auto; flex: 1 0 auto;
            padding-right: 3px;
            display: -webkit-box; display: -webkit-flex; display: -ms-flexbox; display: flex;
            -webkit-box-align: center; -webkit-align-items: center; -ms-flex-align: center; align-items: center;
            height: 100%;
        }
        .PTVIcon .line-pill .route-lock-up .icon {
            width: 21px;
            height: 21px;
        }
        .PTVIcon .direction-title {
            font-weight: 700;
            font-size: 13px;
            padding-left: 3px;
            margin: 0;
        }
        .PTVIcon.time .line-pill .route-lock-up {
            border: 0;
            padding: 0 9px 0 5px;
            border-radius: 100px;
            -webkit-box-align: center; -webkit-align-items: center; -ms-flex-align: center; align-items: center;
            font-weight: 600;
            -webkit-box-sizing: content-box; box-sizing: content-box;
            text-align: left;
        }

        .PTVIcon.tram .route-lock-up {
            border-color: #78be20 !important;
        }
        .PTVIcon.tram .icon {
            background-image: url("${FILE_URL}/ptv/tram.png");
            background-image: url("${FILE_URL}/ptv//tram.svg");
        }

        .PTVIcon.train .route-lock-up {
            border-color: #0072ce !important;
        }
        .PTVIcon.train .icon {
            background-image: url("${FILE_URL}/ptv/train.png");
            background-image: url("${FILE_URL}/ptv/train.svg");
        }
    </style>
    <div class="component-container">
        <div class="row">
            <div class="small-12 island">
                <h2 class="subheader">Public Transport Nearby</h2>
                <section id="ptvDepartures"></section>
            </div>
        </div>
    </div>`)

    let ptvUpdating;
    let ptvExpires;
    async function updateDepartures() {
        if (PTVDepatureUpdate === false) return;
        let departureHTML = ""; ptvUpdating = true;
        const ptvinfo = await (await fetch(`${THEME_API}/ptv/schedule`)).json();
        ptvExpires = ptvinfo.expires
        for (const schedule of ptvinfo.schedule.sort((a, b) => { return a.route == b.route ? 0 : a.route < b.route ? 1 : -1})) {
            const scheduled_time = new Date(schedule.departures[0]?.scheduled_time);
            const seconds_diff = Math.ceil((schedule.departures[0]?.scheduled_time - new Date().getTime())/1000)

            departureHTML += `
                <li style="border-left: 15px solid ${schedule.colour};">
                    <div class="card small-12" data-equalizer style="position: relative; padding-bottom: 8px;">
                        <div>
                            <div style="display: inline; float: left" class="PTVIcon ${schedule.type == 0 ? "train" : "tram"}">
                                <span class="line-pill">
                                    <div class="route-lock-up">
                                        <i class="icon"></i>
                                        <p class="direction-title">${schedule.route}</p>
                                    </div>
                                </span>
                            </div>
                            <div style="display: inline"><h3 style="padding-left: 10px"><a href="https://transport.vic.gov.au/route/${schedule.route_id}" target="_blank" rel="noopener noreferrer" class="title">${schedule.prefix}to ${schedule.name}</a></h3></div>
                        </div>
                        ${schedule.departures.length == 0 ? `<p style="margin-top: 10px">No more scheduled departures today</p>` : `
                            <p style="margin-top: 10px">
                                Scheduled <strong>${scheduled_time.toLocaleString("en-AU", { hour: "numeric", minute: "2-digit" })}</strong>${schedule.departures.length > 1 ? ", " : ""}
                                ${schedule.departures.slice(1, 4).map(e => new Date(e.scheduled_time).toLocaleString("en-AU", { hour: "numeric", minute: "2-digit" })).join(", ")}
                                <span class="meta" style="margin-left: 10px">${schedule.departures[0].platform !== null ? "Platform " + schedule.departures[0].platform : "&nbsp"}
                            </p>
                            <div style="position: absolute; top: 50%; right: 15px; transform: translate(0, -50%);" class="PTVIcon time">
                                <span class="line-pill">
                                    <div class="route-lock-up" style="background: rgba(${seconds_diff < 20 ? "0, 206, 37, 0.25" : "0, 114, 206, " + (0.35 - (seconds_diff/900 > 1 ? 1 : seconds_diff/900)*0.30)});">
                                        <p class="direction-title" time="${scheduled_time}">${seconds_diff < 20 ? "Now" : (seconds_diff < 3600 ? `${Math.ceil(seconds_diff/60)} ${Math.ceil(seconds_diff/60) == 1 ? "min" : "mins"}` : `${Math.ceil(seconds_diff/3600)} ${Math.ceil(seconds_diff/3600) == 1 ? "hour" : "hours"}`)}</p>
                                    </div>
                                </span>
                            </div>
                        `}
                    </div>
                </li>
            `
        }
        document.getElementById("ptvDepartures").innerHTML = `<ul class="information-list">${departureHTML}</ul>`
        ptvUpdating = false;
    }
    window.addEventListener("focus", function (e) { PTVDepatureUpdate = true}, false);
    window.addEventListener("blur", function (e) { PTVDepatureUpdate = false }, false);
    function updateDepartureTimes() {
        if (ptvUpdating) return
        if (ptvExpires < new Date().getTime()) return updateDepartures();
        for (const timeElem of document.querySelectorAll(".direction-title[time]")) {
            seconds_diff = Math.ceil((new Date(timeElem.getAttribute("time")) - new Date().getTime())/1000)
            if (seconds_diff < 0) return updateDepartures()
            timeElem.innerText = `${seconds_diff < 20 ? "Now" : (seconds_diff < 3600 ? `${Math.ceil(seconds_diff/60)} ${Math.ceil(seconds_diff/60) == 1 ? "min" : "mins"}` : `${Math.ceil(seconds_diff/3600)} ${Math.ceil(seconds_diff/3600) == 1 ? "hour" : "hours"}`)}`
            timeElem.parentNode.style.background = `rgba(${seconds_diff < 20 ? "0, 206, 37, 0.25" : "0, 114, 206, " + (0.35 - (seconds_diff/900 > 1 ? 1 : seconds_diff/900)*0.30)})`
        }
    }
    updateDepartures();
    setInterval(updateDepartures, 60000)
    setInterval(updateDepartureTimes, 1000)

    // Timetable (mobile) - Make background white
    document.querySelectorAll(".show-for-small-only").forEach(el => { el.style.backgroundColor = "#FFF"; })

    // eDiary list recolour
    colourEDiaryList()

    // Add "My Learning" news tab
    myLearningTab();

}

function timetable() {
    document.querySelector("h1[data-timetable-title]").style.display = "inline-block"
    document.querySelector("h1[data-timetable-title]").insertAdjacentHTML("afterend", `
        <a href="/settings/notifications" class="button show-for-landscape" style="margin-top: 10px; margin-left: 10px; float: right; display: inline-block">Customise Timetable</a>
        <a href="/settings/notifications" class="button show-for-portrait" style="margin-top: 10px; margin-left: 10px; display: inline-block">Customise Timetable</a>
        <a class="button show-for-landscape schol-print-timetable" style="margin-top: 10px; margin-left: 10px; float: right; display: inline-block">Print</a>
        <a class="button show-for-landscape schol-export-timetable" style="margin-top: 10px; margin-left: 10px; float: right; display: inline-block">Export to Calendar</a>
    `)

    const TIMETABLE_EXPORT_MODAL_FADE_MS = 180;

    const closeTimetableExportModal = (immediate = false) => {
        const overlay = document.querySelector(".reveal-modal-bg[data-schol-export-modal]");
        const modal = document.querySelector(".reveal-modal[data-schol-export-modal]");

        if (!overlay && !modal) return;

        if (immediate) {
            overlay?.remove();
            modal?.remove();
            return;
        }

        if (overlay) {
            overlay.style.opacity = "0";
        }
        if (modal) {
            modal.dataset.closing = "1";
            modal.style.opacity = "0";
            modal.style.transform = "translateY(8px)";
        }

        setTimeout(() => {
            overlay?.remove();
            modal?.remove();
        }, TIMETABLE_EXPORT_MODAL_FADE_MS);
    };

    const openTimetableExportModal = exportUrl => {
        closeTimetableExportModal(true);

        const overlay = document.createElement("div");
        overlay.className = "reveal-modal-bg";
        overlay.dataset.scholExportModal = "1";
        overlay.style.display = "block";
        overlay.style.opacity = "0";
        overlay.style.transition = `opacity ${TIMETABLE_EXPORT_MODAL_FADE_MS}ms ease`;

        const modal = document.createElement("div");
        modal.className = "reveal-modal small open";
        modal.dataset.scholExportModal = "1";
        modal.setAttribute("data-reveal", "");
        modal.setAttribute("aria-hidden", "false");
        modal.setAttribute("role", "dialog");
        modal.id = `reveal-modal-${crypto.randomUUID()}`;
        modal.tabIndex = 0;
        modal.style.display = "block";
        modal.style.top = "100px";
        modal.style.opacity = "0";
        modal.style.visibility = "visible";
        modal.style.transform = "translateY(8px)";
        modal.style.transition = `opacity ${TIMETABLE_EXPORT_MODAL_FADE_MS}ms ease, transform ${TIMETABLE_EXPORT_MODAL_FADE_MS}ms ease`;

        const description = document.createElement("p");
        description.textContent = "Use the following address to subscribe your favourite calendar application to a live feed.";

        const textarea = document.createElement("textarea");
        textarea.readOnly = true;
        textarea.rows = 6;
        textarea.value = exportUrl;

        const actionWrap = document.createElement("div");
        actionWrap.className = "component-action";
        const actionSection = document.createElement("section");
        const copyButton = document.createElement("button");
        copyButton.textContent = "Copy to Clipboard";
        actionSection.appendChild(copyButton);
        actionWrap.appendChild(actionSection);

        const closeButton = document.createElement("a");
        closeButton.className = "close-reveal-modal";
        closeButton.setAttribute("aria-label", "Close");
        closeButton.textContent = "×";

        const closeModal = () => {
            if (modal.dataset.closing === "1") return;
            closeTimetableExportModal();
        };
        overlay.addEventListener("click", closeModal);
        closeButton.addEventListener("click", closeModal);

        copyButton.addEventListener("click", async () => {
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(exportUrl);
                } else {
                    textarea.focus();
                    textarea.select();
                    document.execCommand("copy");
                }
                copyButton.textContent = "Copied";
                setTimeout(() => {
                    copyButton.textContent = "Copy to Clipboard";
                }, 1500);
            } catch (error) {
                console.error("Failed to copy timetable export URL", error);
                textarea.focus();
                textarea.select();
            }
        });

        modal.append(description, textarea, actionWrap, closeButton);
        document.body.append(overlay, modal);
        requestAnimationFrame(() => {
            overlay.style.opacity = "1";
            modal.style.opacity = "1";
            modal.style.transform = "translateY(0)";
            textarea.focus();
            textarea.select();
        });
    };

    const fetchTimetableExportUrl = async () => {
        const response = await fetch("/calendar/week", {
            credentials: "include"
        });
        if (!response.ok) {
            throw new Error(`Failed to load calendar page (${response.status})`);
        }

        const html = await response.text();
        const tokenMatch = html.match(/token:\s*'([^']+)'/);
        if (!tokenMatch) {
            throw new Error("Calendar export token not found");
        }

        return `${window.location.origin}/calendar/export.php?export=timetable&event_type=&token=${tokenMatch[1]}`;
    };

    document.querySelectorAll(".schol-export-timetable").forEach(btn => {
        btn.addEventListener("click", async () => {
            try {
                const exportUrl = await fetchTimetableExportUrl();
                openTimetableExportModal(exportUrl);
            } catch (error) {
                console.error("Failed to open timetable export modal", error);
                alert("Unable to load the timetable export link right now.");
            }
        });
    });

    // Capture original table before enhanced timetable may replace it
    const _printSourceTable = document.querySelector("table.timetable");

    document.querySelectorAll(".schol-print-timetable").forEach(btn => {
        btn.addEventListener("click", () => {
            const title = document.querySelector("h1[data-timetable-title]")?.innerText || "Timetable";
            const tbl = _printSourceTable;
            if (!tbl) return;

            const subjCell = (subj) => {
                if (!subj || !subj.textContent.trim()) return '<td></td>';
                const bg = subj.style.backgroundColor || '';
                const fg = subj.style.color || '#000';
                const lines = subj.innerText.trim().split('\n').map(l => l.trim()).filter(Boolean);
                const content = lines.map((l, i) => `<div class="${i === 0 ? 'subj-name' : 'subj-detail'}">${l}</div>`).join('');
                return `<td style="background:${bg};color:${fg}">${content}</td>`;
            };

            const dayHeaders = Array.from(tbl.querySelectorAll("thead th")).slice(1).map(th => th.innerText.trim());
            const periodRows = Array.from(tbl.querySelectorAll("tbody tr")).filter(r => r.querySelector("th"));

            const emptyDayCells = dayHeaders.map(() => '<td></td>').join('');
            let recessInserted = false;
            const bodyRows = periodRows.map(row => {
                const thLines = (row.querySelector("th")?.innerText || '').trim().split('\n').map(l => l.trim()).filter(Boolean);
                const rawName = thLines[0] || '';
                const periodTime = thLines.slice(1).join(' ');

                if (/after\s*school/i.test(rawName)) return '';
                const displayName = /lunch/i.test(rawName) ? 'Lunch' : rawName;

                const cells = Array.from(row.querySelectorAll("td")).map(td => subjCell(td.querySelector(".timetable-subject"))).join('');
                const timeHtml = periodTime ? `<div class="period-time">${periodTime}</div>` : '';
                const periodColClass = `period-col${displayName === 'Lunch' ? ' lunch-col' : ''}`;
                const rowHtml = `<tr><th class="${periodColClass}"><div class="period-name">${displayName}</div>${timeHtml}</th>${cells}</tr>`;

                if (!recessInserted && /period\s*3/i.test(rawName)) {
                    recessInserted = true;
                    return `<tr><th class="period-col recess-col"><div class="period-name">Recess</div><div class="period-time">10:40am – 11:05am</div></th>${emptyDayCells}</tr>${rowHtml}`;
                }
                return rowHtml;
            }).filter(Boolean).join('');

            const headerRow = `<tr><th></th>${dayHeaders.map(d => `<th>${d}</th>`).join('')}</tr>`;

            const win = window.open('', '_blank');
            win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
                <style>
                @page { size: A4 landscape; margin: 10mm; }
                * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                body { margin: 0; padding: 6px; background: #fff; font-family: Arial, sans-serif; color: #000; }
                h1 { font-size: 12pt; margin: 0 0 6px 0; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                th { background: #eee; font-size: 8pt; font-weight: bold; text-align: center; border: 1px solid #bbb; padding: 4px 3px; }
                td { border: 1px solid #ddd; padding: 4px; vertical-align: top; }
                .period-col { width: 68px; font-size: 7pt; }
                .recess-col { background: #f5f5f5 !important; color: #888; }
                .lunch-col { background: #f5f5f5 !important; color: #888; }
                .period-name { font-weight: bold; }
                .period-time { font-size: 6.5pt; opacity: 0.65; margin-top: 2px; }
                .subj-name { font-size: 7.5pt; font-weight: bold; margin-bottom: 1px; }
                .subj-detail { font-size: 7pt; opacity: 0.85; }
                .subj-time { font-size: 6.5pt; opacity: 0.65; margin-top: 2px; }
                </style>
                </head><body>
                <h1>${title}</h1>
                <table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>
                </body></html>`);
            win.document.close();
            setTimeout(() => { win.print(); win.close(); }, 400);
        });
    });

    // Add custom styles for the enhanced timetable
    if (!document.getElementById("schol-timetable-styles")) {
        const style = document.createElement("style");
        style.id = "schol-timetable-styles";
        style.innerHTML = `
            .timetable-enhanced-wrapper {
                overflow-y: hidden !important;
                scrollbar-width: thin; /* Firefox */
            }
            .timetable-enhanced-wrapper::-webkit-scrollbar:vertical {
                display: none !important;
                width: 0 !important;
            }
            .timetable-enhanced-wrapper::-webkit-scrollbar:horizontal {
                height: 8px !important;
                display: block !important;
            }
            .timetable-enhanced-wrapper::-webkit-scrollbar-thumb {
                background: #ccc;
                border-radius: 4px;
            }
            .timetable-enhanced-wrapper .timetable td .timetable-subject-active::before {
                border-top: 0 !important;
                border: 0 transparent !important;
            }
            .timetable-subject-active {
                border: 0 transparent !important;
            }
            @keyframes scholActivePulse {
                0% { box-shadow: inset 0 0 0 3px rgba(0, 114, 206, 0.35); outline-color: rgba(0, 114, 206, 0.45); }
                50% { box-shadow: inset 0 0 14px 3px rgba(0, 114, 206, 0.9); outline-color: rgba(0, 114, 206, 1); }
                100% { box-shadow: inset 0 0 0 3px rgba(0, 114, 206, 0.35); outline-color: rgba(0, 114, 206, 0.45); }
            }
        `;
        document.head.appendChild(style);
    }


    if (extConfig.settings.compacttimetable) {
        const rows = document.querySelectorAll(".timetable tbody tr")
        for (const row of rows) {
            if (!TIMETABLE_WHITELIST.includes(row.querySelector("th").childNodes[0].textContent.trim())) {
                hassubject = false
                for (const cell of row.querySelectorAll("td")) {
                    if (cell.innerText !== "\n" && cell.children[0].children.length > 0) { hassubject = true; break; }
                }
                if (!hassubject) {
                    row.style.display = "none";
                }
            }
        }
        // ~ Mobile
        const heading = document.querySelectorAll(".show-for-small-only th")
        const body = document.querySelectorAll(".show-for-small-only td")
        for (let index = 0; index < heading.length; index++) {
            if (!TIMETABLE_WHITELIST.includes(heading[index].childNodes[0].textContent.trim()) && !body[index].textContent.trim()) {
                heading[index].remove()
                body[index].remove()
            }
        }
    }

    // Highlight current day on mobile timetable
    if (window.innerWidth <= 640) {
        fetch("https://services.stmichaels.vic.edu.au/dwi.cfm?otype=json")
            .then(r => {
                return r.json();
            })
            .then(r => {
                const currentDay = r.D;
                // find "Day ..." in h2.subheaders
                const headers = document.querySelectorAll("h2.subheader");
                for (let header of headers) {
                    const text = header.textContent.trim();
                    const match = text.match(/^Day\s*(\d+)$/);
                    if (match) {
                        if (parseInt(match[1]) === parseInt(currentDay)) {
                            header.style.setProperty("color", "var(--accent-foreground)", "important");
                            header.style.setProperty("font-weight", "600", "important");
                            break; // stop searching after finding the current day
                        }
                    }
                }
            }).catch(error => {
                console.error("Error fetching dwi data:", error);
            });
    }

    // Mobile timetable time fixes
    if (window.innerWidth <= 640) {
        const timetable = document.querySelector(".timetable-small");
        if (timetable) {
            for (const table of timetable.querySelectorAll("table.no-hover")) {
                const dayText = table.previousElementSibling?.innerText;
                for (const row of table.querySelectorAll("tr")) {
                    const periodText = row.querySelector("th")?.innerText;
                    const cell = row.querySelector("td > div > div.timetable-subject");
                    
                    if (cell) {
                        console.log(dayText, periodText, cell.innerText);
                    }
                }
            }
        }
    }

    // Desktop timetable time fixes
    if (window.innerWidth > 640) {
        if (!extConfig?.settings?.enhancedtimetable) return;
        const originalTable = document.querySelector("table.timetable");
        if (originalTable) {
            
            const getStudentYear = () => {
                if (typeof schoolboxUser !== 'undefined' && schoolboxUser.yearLevel) return schoolboxUser.yearLevel;
                return 0;
            }
            const studentYear = getStudentYear();

            const days = []; 
            const colHeaders = Array.from(originalTable.querySelectorAll("thead th"));
            
            // Initialize days
            for (let i = 1; i < colHeaders.length; i++) {
                days.push({ 
                    header: colHeaders[i].innerText.trim(), 
                    periods: {},
                    dayNum: parseInt(colHeaders[i].innerText.replace(/\D/g, '') || "0")
                });
            }
            
            // Map rows to original period names
            const rows = originalTable.querySelectorAll("tbody tr");
            rows.forEach(row => {
                const rowHeader = row.querySelector("th")?.innerText.trim().split("\n")[0]; 
                if (!rowHeader) return;
                
                const cells = row.querySelectorAll("td");
                cells.forEach((cell, index) => {
                    if (days[index]) {
                        days[index].periods[rowHeader] = cell.innerHTML;
                    }
                });
            });

            // Times in minutes from 00:00
            const timeToMin = (h, m) => h*60 + m;
            
            const getPeriodTimes = (dayNum, periodName, year) => {
                 const cycleDay = (dayNum - 1) % 5; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri
                
                let start = 0, end = 0;
                
                if (cycleDay === 0) { // Monday
                    if (periodName.includes(PERIODS.P1)) { start = timeToMin(8,30); end = timeToMin(9,35); }
                    else if (periodName.includes(PERIODS.P2)) { start = timeToMin(9,35); end = timeToMin(10,40); }
                    else if (periodName.includes(PERIODS.P3)) { start = timeToMin(11,5); end = timeToMin(12,15); }
                    else if (periodName.includes(PERIODS.P4)) { start = timeToMin(12,15); end = timeToMin(13,25); }
                    else if (periodName.includes("Lunch (Yr 12 Period 5)")) {
                        start = timeToMin(14,5); end = timeToMin(14,25);
                    }
                    else if (periodName.includes(PERIODS.LUNCH)) { 
                        // Lunch Options
                        start = timeToMin(13,25);
                        end = timeToMin(14,5);
                    }
                    else if (periodName.includes(PERIODS.P5_6_MERGED)) { // merged P5+P6 on Monday
                    start = timeToMin(14,5); end = timeToMin(15,30);
                    }
                    else if (periodName.includes(PERIODS.P5) && periodName.includes("House")) {
                        // Mon House Period logic - 20 minute house period should be visible for all years
                        start = timeToMin(14,5); end = timeToMin(14,25);
                    }
                    else if (periodName.includes(PERIODS.P5) && !periodName.includes("House")) {
                        // Standard Period 5 on Monday is 14:05-14:25
                        start = timeToMin(14,5); end = timeToMin(14,25);
                    }
                    else if (periodName.includes(PERIODS.P6)) {
                        // Period 6 remains 14:25-15:30
                        start = timeToMin(14,25); end = timeToMin(15,30);
                    }
                 } else { // Tue - Fri
                    if (periodName.includes(PERIODS.P1)) { start = timeToMin(8,30); end = timeToMin(9,35); }
                    else if (periodName.includes(PERIODS.P2)) { start = timeToMin(9,35); end = timeToMin(10,40); }
                    else if (periodName.includes(PERIODS.P3)) { start = timeToMin(11,5); end = timeToMin(12,10); }
                    else if (periodName.includes(PERIODS.P4)) {
                        start = timeToMin(12,10);
                        let isEarly = false;
                        if (cycleDay === 1 && year === 7) isEarly = true; // Tue
                        if (cycleDay === 2 && year >= 10 && year <= 12) isEarly = true; // Wed
                        if (cycleDay === 3 && year >= 8 && year <= 9) isEarly = true; // Thu
                        end = isEarly ? timeToMin(12,45) : timeToMin(13,15);
                    }
                    else if (periodName.includes("Lunch (Yr 12 Period 5)")) { start = timeToMin(14,5); end = timeToMin(14,25); }
                    else if (periodName.includes(PERIODS.LUNCH)) { start = timeToMin(13,15); end = timeToMin(14,5); }
                    else if (periodName.includes(PERIODS.P5)) { start = timeToMin(14,5); end = timeToMin(14,25); }
                    else if (periodName.includes(PERIODS.P6)) { start = timeToMin(14,25); end = timeToMin(15,30); }
                }
                return { start, end };
            };
            
            // Build New DOM
            const pxPerMin = 2.2;
            const startTime = timeToMin(8,30);
            const endTime = timeToMin(15,30);
            const totalHeight = (endTime - startTime) * pxPerMin;

            // Wrapper Table
            const newTable = document.createElement("table");
            newTable.className = "timetable";
            newTable.style.width = "100%";
            newTable.style.tableLayout = "fixed";
            
            // Horizontal scroll support for screens
            const scrollWrapper = document.createElement("div");
            scrollWrapper.className = "timetable-enhanced-wrapper";
            scrollWrapper.style.position = "relative";
            scrollWrapper.style.overflowX = "auto";
            scrollWrapper.style.overflowY = "hidden";
            scrollWrapper.style.width = "100%";
            scrollWrapper.style.height = "auto"; 

            const updateTableWidth = () => {
                if (window.innerWidth < 1600) {
                    newTable.style.minWidth = "1300px";
                } else {
                    newTable.style.minWidth = "auto";
                }
            };
            
            updateTableWidth();
            window.addEventListener("resize", updateTableWidth);
            
            const thead = document.createElement("thead");
            thead.innerHTML = `<tr><th style="width:60px"></th>${days.map(d => `<th style="color: var(--accent-foreground);">${d.header}</th>`).join("")}</tr>`;
            newTable.appendChild(thead);
            
            const tbody = document.createElement("tbody");
            const tr = document.createElement("tr");
            
            // Time Column
            const timeTd = document.createElement("td");
            timeTd.style.verticalAlign = "top";
            timeTd.style.padding = "0";
            timeTd.style.borderRight = "1px solid #ddd";
            const timeCol = document.createElement("div");
            timeCol.style.position = "relative";
            timeCol.style.height = totalHeight + "px";
            
            for (let t = startTime; t <= endTime; t += 30) {
                // Skip 8:30 and 3:30 labels
                if (t === startTime || t === endTime) continue;
                
                const label = document.createElement("div");
                let h = Math.floor(t/60);
                let m = t%60;
                let ampm = h >= 12 ? "pm" : "am";
                let disph = h > 12 ? h - 12 : h;
                label.innerText = `${String(disph).padStart(2, '0')}:${String(m).padStart(2, '0')}${ampm}`;
                
                label.style.position = "absolute";
                label.style.top = (t - startTime) * pxPerMin + "px";
                label.style.fontSize = "10px";
                label.style.width = "100%";
                label.style.textAlign = "right";
                label.style.paddingRight = "5px";
                label.style.transform = "translateY(-50%)";
                label.style.color = "var(--body-foreground, #888)"; // Use theme variable if available
                timeCol.appendChild(label);
            }
            timeTd.appendChild(timeCol);
            tr.appendChild(timeTd);
            
            // Day Cells
            days.forEach(day => {
            // If this day is a Monday (cycleDay===0) and Period 5 and Period 6 have identical content,
            // merge them into a single entry so it'll be rendered as one block spanning 14:05-15:30.
            try {
                const cycleDay = (day.dayNum - 1) % 5;
                if (cycleDay === 0) {
                    const keys = Object.keys(day.periods);
                    const p5Regex = new RegExp("\\b" + PERIODS.P5.replace(/\s+/g, "\\s*") + "\\b", "i");
                    const p6Regex = new RegExp("\\b" + PERIODS.P6.replace(/\s+/g, "\\s*") + "\\b", "i");
                    const p5Key = keys.find(k => p5Regex.test(k) && !/House/i.test(k));
                    const p6Key = keys.find(k => p6Regex.test(k));
                    if (p5Key && p6Key) {
                        const tmp1 = document.createElement('div'); tmp1.innerHTML = day.periods[p5Key] || '';
                        const tmp2 = document.createElement('div'); tmp2.innerHTML = day.periods[p6Key] || '';
                        const t1 = (tmp1.textContent || '').replace(/\s+/g, ' ').trim();
                        const t2 = (tmp2.textContent || '').replace(/\s+/g, ' ').trim();
                        if (t1 && t1 === t2) {
                            // Keep the P5 HTML (it's representative) but set a merged key.
                            day.periods[PERIODS.P5_6_MERGED] = day.periods[p5Key];
                            delete day.periods[p5Key];
                            delete day.periods[p6Key];
                        }
                    }
                }
            } catch (e) {
                console.error('Error while attempting to merge P5+P6:', e);
            }
                const td = document.createElement("td");
                td.setAttribute("data-day", day.dayNum);
                td.style.verticalAlign = "top";
                td.style.padding = "0";
                td.style.position = "relative";
                td.style.height = totalHeight + "px";
                
                // Add a slightly visible line between week 1 (Day 5) and week 2 (Day 6)
                if (day.dayNum === 5) {
                    td.style.borderRight = "1px solid #ccc";
                }
                
                // Grid lines
                for (let t = startTime; t <= endTime; t += 30) {
                    const line = document.createElement("div");
                    line.style.position = "absolute";
                    line.style.top = (t - startTime) * pxPerMin + "px";
                    line.style.left = "0";
                    line.style.right = "0";
                    line.style.borderTop = "1px solid #f9f9f9";
                    line.style.zIndex = "0";
                    td.appendChild(line);
                }
                
                const periodEntries = Object.entries(day.periods);
                // Compute latest end time for the day to detect "last" period more reliably
                const _periodEndTimes = periodEntries.map(e => {
                    try { return getPeriodTimes(day.dayNum, e[0], studentYear).end; } catch { return 0; }
                });
                const dayMaxEnd = _periodEndTimes.length ? Math.max(..._periodEndTimes) : 0;
                const skipStartTimeFor = new Set(); // Track periods that share end time with previous
                
                for (let entryIdx = 0; entryIdx < periodEntries.length; entryIdx++) {
                    const entry = periodEntries[entryIdx];
                    const periodName = entry[0];
                    const html = entry[1];
                    const times = getPeriodTimes(day.dayNum, periodName, studentYear);
                    if (times.start === 0 && times.end === 0) continue;
                    
                    const tmpTextCheck = document.createElement("div");
                    tmpTextCheck.innerHTML = html;
                    if (!tmpTextCheck.textContent.trim()) continue;
                    
                    const isLunch = periodName.includes(PERIODS.LUNCH);
                    const durationMin = times.end - times.start;
                    const isShortPeriod = durationMin < 30;
                    const periodHeightPx = durationMin * pxPerMin;
                    const isVeryShortPeriod = periodHeightPx <= 48;
                    
                    const pDiv = document.createElement("div");
                    pDiv.className = "timetable-period-absolute";
                    pDiv.setAttribute("data-start", times.start);
                    pDiv.setAttribute("data-end", times.end);
                    pDiv.style.position = "absolute";
                    pDiv.style.top = (times.start - startTime) * pxPerMin + "px";
                    pDiv.style.height = (times.end - times.start) * pxPerMin + "px";
                    pDiv.style.left = "0";
                    pDiv.style.right = "0";
                    pDiv.style.overflow = "hidden";
                    pDiv.style.zIndex = "1";
                    pDiv.style.padding = "2px";
                    pDiv.innerHTML = html;
                    
                    // Add time labels for non-lunch periods
                    if (!isLunch) {
                        // Check if this period had its start time skipped (shared with previous period's end)
                        const hasSharedStartTime = skipStartTimeFor.has(entryIdx);
                        
                        // Check if next period starts exactly when this ends
                        const nextEntry = periodEntries[entryIdx + 1];
                        let nextTimes = null;
                        if (nextEntry) {
                            const nextPeriodName = nextEntry[0];
                            nextTimes = getPeriodTimes(day.dayNum, nextPeriodName, studentYear);
                        }
                        
                        const isBackToBack = nextTimes && nextTimes.start === times.end && !nextEntry[0].includes(PERIODS.LUNCH);
                        const isShort = isShortPeriod;
                        
                        // Only add start time if it wasn't shared with previous period's end and isn't 8:30
                        if (!hasSharedStartTime && times.start !== startTime) {
                            const startTimeLabel = document.createElement("div");
                            let h = Math.floor(times.start/60);
                            let m = times.start%60;
                            let ampm = h >= 12 ? "pm" : "am";
                            let disph = h > 12 ? h - 12 : h;
                            startTimeLabel.innerText = `${String(disph).padStart(2, '0')}:${String(m).padStart(2, '0')}${ampm}`;
                            startTimeLabel.classList.add("timetable-time-label");
                            startTimeLabel.style.position = "absolute";
                            startTimeLabel.style.top = "0";
                            startTimeLabel.style.left = "0";
                            startTimeLabel.style.right = "0";
                            startTimeLabel.style.fontSize = isVeryShortPeriod ? "7px" : (isShort ? "8px" : "9px");
                            startTimeLabel.style.padding = isShort ? "0 2px" : "1px 2px";
                            startTimeLabel.style.lineHeight = isVeryShortPeriod ? "1" : (isShort ? "1.1" : "normal");
                            startTimeLabel.style.backgroundColor = "rgba(0,0,0,0.3)";
                            startTimeLabel.style.color = "#fff";
                            startTimeLabel.style.textAlign = "center";
                            startTimeLabel.style.zIndex = "10";
                            startTimeLabel.style.fontWeight = "bold";
                            pDiv.appendChild(startTimeLabel);
                        }
                        
                        if (isBackToBack && times.end !== endTime && times.end !== startTime) {
                            // Create shared time label in the middle between periods
                            const midSize = 14; // Height of time label
                            const sharedLabel = document.createElement("div");
                            let h = Math.floor(times.end/60);
                            let m = times.end%60;
                            let ampm = h >= 12 ? "pm" : "am";
                            let disph = h > 12 ? h - 12 : h;
                            sharedLabel.innerText = `${String(disph).padStart(2, '0')}:${String(m).padStart(2, '0')}${ampm}`;
                            sharedLabel.classList.add("timetable-time-label");
                            sharedLabel.style.position = "absolute";
                            sharedLabel.style.top = (times.end - startTime) * pxPerMin - midSize/2 + "px";
                            sharedLabel.style.left = "0";
                            sharedLabel.style.right = "0";
                            sharedLabel.style.fontSize = "9px";
                            sharedLabel.style.padding = "1px 2px";
                            sharedLabel.style.backgroundColor = "rgba(0,0,0,0.3)";
                            sharedLabel.style.color = "#fff";
                            sharedLabel.style.textAlign = "center";
                            sharedLabel.style.zIndex = "10";
                            sharedLabel.style.fontWeight = "bold";
                            sharedLabel.style.width = "100%";
                            td.appendChild(sharedLabel);
                            
                            // Mark next period to skip its start time label
                            skipStartTimeFor.add(entryIdx + 1);
                        } else if (!isShort && times.end !== endTime) {
                            // Add end time label only if not back-to-back and not 3:30
                            const endTimeLabel = document.createElement("div");
                            let h = Math.floor(times.end/60);
                            let m = times.end%60;
                            let ampm = h >= 12 ? "pm" : "am";
                            let disph = h > 12 ? h - 12 : h;
                            endTimeLabel.innerText = `${String(disph).padStart(2, '0')}:${String(m).padStart(2, '0')}${ampm}`;
                            endTimeLabel.classList.add("timetable-time-label");
                            endTimeLabel.style.position = "absolute";
                            endTimeLabel.style.bottom = "0";
                            endTimeLabel.style.left = "0";
                            endTimeLabel.style.right = "0";
                            endTimeLabel.style.fontSize = "9px";
                            endTimeLabel.style.padding = "1px 2px";
                            endTimeLabel.style.backgroundColor = "rgba(0,0,0,0.3)";
                            endTimeLabel.style.color = "#fff";
                            endTimeLabel.style.textAlign = "center";
                            endTimeLabel.style.zIndex = "10";
                            endTimeLabel.style.fontWeight = "bold";
                            pDiv.appendChild(endTimeLabel);
                        }
                    }
                    
                    // Ensure direct children (wrappers) are full height/flex containers
                    Array.from(pDiv.children).forEach(c => {
                        if (!(c.classList && c.classList.contains("timetable-time-label"))) {
                            c.style.height = "100%";
                            c.style.display = "flex";
                            c.style.flexDirection = "column";
                        }
                    });

                    // Force subject divs to fill height and add rounded corners
                    for (const s of pDiv.querySelectorAll(".timetable-subject")) {
                        if (s.parentElement !== pDiv) {
                            s.style.flex = "1"; 
                            s.style.height = "auto";
                        } else {
                            s.style.width = "100%";
                            // If direct child, height 100% was set by children loop
                        }
                        s.style.marginBottom = "0";
                        s.style.marginTop = "0";
                        const compactTopPadding = isShortPeriod ? (isVeryShortPeriod ? 7 : Math.max(9, Math.min(12, Math.floor(periodHeightPx * 0.25)))) : 22;
                        const compactBottomPadding = isShortPeriod ? (isVeryShortPeriod ? 2 : Math.max(3, Math.min(6, Math.floor(periodHeightPx * 0.12)))) : 16;
                        s.style.paddingTop = `${compactTopPadding}px`;
                        s.style.paddingBottom = `${compactBottomPadding}px`;
                        s.style.boxSizing = "border-box";
                        s.style.borderRadius = "2px";
                        s.style.overflow = "hidden";
                        
                        // Fix inner div layout if needed
                        const innerDiv = Array.from(s.children).find(child => child.tagName === "DIV" && !(child.classList && child.classList.contains("schol-sport-spacer")));
                        if (innerDiv) {
                            innerDiv.style.borderRadius = "5px";
                            innerDiv.style.height = "100%";
                            innerDiv.style.width = "100%";
                        }

                        // Re-apply theme color and contrast fix to ensure readability in enhanced layout
                        const matchText = (innerDiv ? innerDiv.textContent : s.textContent) || "";
                        const subjectcodesMatch = REGEXP.exec(matchText);
                        if (subjectcodesMatch) {
                            const subjectcodes = subjectcodesMatch[1].split(",");
                            for (const subjectcode of subjectcodes) {
                                const theme = extConfig.theme[subjectcode.trim()];
                                if (theme && theme.color) {
                                        // Apply the background directly with !important so Schoolbox's
                                        // contrast checker reads the correct final background colour.
                                        s.style.setProperty('background-color', theme.color, 'important');
                                        // Persist desired colours for later enforcement
                                        s.dataset.scholBg = theme.color;
                                        
                                        // Use the more robust brightness detection
                                        const finalTextCol = getTextColor(theme.color);
                                        const isDarkText = finalTextCol === '#000000';
                                        const textShadow = isDarkText ? '' : '';
                                        
                                        s.style.setProperty('color', finalTextCol, 'important');
                                        s.dataset.scholFg = finalTextCol;
                                        // Ensure the primary inner wrapper visually shares the same background
                                        // so computed styles for children (and contrast checks) resolve correctly.
                                        if (innerDiv) {
                                            innerDiv.style.setProperty('background-color', theme.color, 'important');
                                            innerDiv.dataset.scholBg = theme.color;
                                            innerDiv.dataset.scholFg = finalTextCol;
                                        }
                                        // Apply to all children including the innerDiv and its children
                                        s.querySelectorAll("div, div *, span, p").forEach(child => {
                                            if (child.classList && child.classList.contains("schol-sport-spacer")) return;
                                            // Propagate background to descendants so the contrast checker
                                            // evaluates text against the themed background instead of transparent/white.
                                            child.style.setProperty('background-color', theme.color, 'important');
                                            if (child.tagName !== 'A') {
                                            child.style.setProperty('color', finalTextCol, 'important');
                                                // If it's the description div, give it a subtle background for contrast
                                            if (child === innerDiv) {
                                                child.style.setProperty('border-radius', '3px', 'important');
                                                child.style.setProperty('padding', '2px', 'important');
                                            }
                                            }
                                            // Persist intended colours for observer-based enforcement
                                            child.dataset.scholBg = theme.color;
                                            child.dataset.scholFg = finalTextCol;
                                        });
                                        
                                        // Link color: match computed text colour to maximise contrast
                                        s.querySelectorAll("a").forEach(a => {
                                            // Ensure links inherit the same background so Schoolbox
                                            // contrast checks compare like-for-like colours.
                                            a.style.setProperty('background-color', theme.color, 'important');
                                            a.style.setProperty('color', finalTextCol, 'important');
                                            a.style.setProperty('text-decoration', 'none', 'important');
                                            a.dataset.scholBg = theme.color;
                                            a.dataset.scholFg = finalTextCol;
                                        });
                                        break; // Only use first matching theme
                                    }
                                }
                            }
                        }
                    
                    // If this is the last period of Tue/Wed/Thu and it's a Sport class,
                    // create an L-shape: Right-Half Top (Extension) + Full-Width Bottom (Base).
                    let lShapeBg = null;
                    try {
                        const cycleDay = (day.dayNum - 1) % 5;
                        const isLastEntry = times.end === dayMaxEnd;
                        // Determine if Sport
                        const tmpForSport = document.createElement('div'); tmpForSport.innerHTML = html || '';
                        const plainText = (tmpForSport.textContent || '').toLowerCase();
                        const isSport = /\bsport\b/i.test(plainText);

                        if (isLastEntry && isSport && (cycleDay === 1 || cycleDay === 2 || cycleDay === 3)) {
                            const start45 = timeToMin(12, 45);
                            
                            // Extract background color
                            let bg = 'rgba(0,0,0,0.1)';
                            const colorMatch = /background(?:-color)?:\s*([^;!"]+)/i.exec(html);
                            if (colorMatch) bg = colorMatch[1];
                            
                            // Helper to create absolute bg blocks
                            const createBlock = (cssParams) => {
                                const d = document.createElement('div');
                                d.style.position = 'absolute';
                                d.style.background = bg;
                                d.style.zIndex = '2'; // Above other subjects (z=1), behind Sport pDiv (z=3)
                                for (let p in cssParams) d.style[p] = cssParams[p];
                                return d;
                            };

                            const stemLabel = (timeVal) => {
                                const lbl = document.createElement("div");
                                let h = Math.floor(timeVal/60);
                                let m = timeVal%60;
                                let disph = h > 12 ? h - 12 : h;
                                lbl.innerText = `${disph}:${String(m).padStart(2, '0')}`;
                                lbl.classList.add("timetable-time-label");
                                lbl.style.position = "absolute";
                                lbl.style.top = "0";
                                lbl.style.left = "0";
                                lbl.style.right = "0";
                                lbl.style.fontSize = "8px"; // slightly smaller for 30% width
                                lbl.style.letterSpacing = "-0.2px";
                                lbl.style.padding = "2px 0";
                                lbl.style.backgroundColor = "rgba(0,0,0,0.3)";
                                lbl.style.color = "#fff";
                                lbl.style.textAlign = "center";
                                lbl.style.zIndex = "10";
                                lbl.style.fontWeight = "bold";
                                lbl.style.borderTopLeftRadius = "4px";
                                lbl.style.borderTopRightRadius = "4px";
                                return lbl;
                            };


                            const ext_Y_start = times.start < start45 ? times.start : start45;
                            const ext_Y_end = times.start < start45 ? start45 : times.start;
                            
                            td.querySelectorAll('.timetable-period-absolute').forEach(prevDiv => {
                                if (prevDiv === pDiv) return;
                                const pStart = parseInt(prevDiv.getAttribute('data-start'));
                                const pEnd = parseInt(prevDiv.getAttribute('data-end'));
                                
                                const overlapS = Math.max(pStart, ext_Y_start);
                                const overlapE = Math.min(pEnd, ext_Y_end);
                                
                                if (overlapS < overlapE) {
                                    const overlapH = (overlapE - overlapS) * pxPerMin;
                                    const marginTop = (overlapS - pStart) * pxPerMin;
                                    
                                    const subjDiv = prevDiv.querySelector('.timetable-subject');
                                    if (subjDiv) {
                                        const offsetSpacer = document.createElement('div');
                                        offsetSpacer.className = 'schol-sport-spacer';
                                        offsetSpacer.style.float = 'right';
                                        offsetSpacer.style.width = '0';
                                        offsetSpacer.style.height = `${marginTop}px`;
                                        offsetSpacer.style.pointerEvents = 'none';

                                        const collisionSpacer = document.createElement('div');
                                        collisionSpacer.className = 'schol-sport-spacer';
                                        collisionSpacer.style.float = 'right';
                                        collisionSpacer.style.clear = 'right';
                                        collisionSpacer.style.width = '30%';
                                        collisionSpacer.style.height = `${overlapH + 5}px`;
                                        collisionSpacer.style.pointerEvents = 'none';

                                        subjDiv.dataset.sportCollisionLayout = 'true';
                                        subjDiv.style.display = 'block';
                                        subjDiv.prepend(collisionSpacer);
                                        subjDiv.prepend(offsetSpacer);
                                    }
                                    
                                    // Hide right-half background of overridden subjects so it doesn't leak out 
                                    // (though setting Sport bg z-index=2 already covers it visually)
                                }
                            });

                            if (times.start < start45) {
                                // CASE A: Period starts EARLY (e.g. 12:10).
                                // Shape: Top-Right Half (12:10-12:45) + Bottom Full (12:45-End).
                                
                                // 1. Make pDiv transparent so we can see our custom bg blocks
                                // We iterate children and force bg transparent
                                setTimeout(() => { // Delay to override applied styles
                                    pDiv.querySelectorAll('.timetable-subject, .timetable-subject > div, a').forEach(el => {
                                        el.style.setProperty('background-color', 'transparent', 'important');
                                        el.style.setProperty('box-shadow', 'none', 'important');
                                        el.style.setProperty('border', 'none', 'important');
                                    });
                                    // Remove the default time label span across whole block since it doesn't fit the L stem
                                    const defaultLabel = pDiv.querySelector('.timetable-time-label');
                                    if (defaultLabel && (defaultLabel.style.top === '0px' || defaultLabel.style.top === '0')) {
                                        defaultLabel.style.display = 'none';
                                    }
                                }, 0);
                                
                                // 2. Create Background Blocks
                                // Top Block (Right Half)
                                const topH = (start45 - times.start) * pxPerMin;
                                const topTop = (times.start - startTime) * pxPerMin;
                                const topBlock = createBlock({
                                    top: (topTop + 2) + 'px',   // +2px padding to match native subject boxes
                                    left: '70%',
                                    right: '2px',               // Inset 2px to perfectly align with native subjects margin
                                    height: (topH - 2 + 1) + 'px', // +1px stretch down into bottom block to seal the gap
                                });
                                // Attach custom right-aligned stem label
                                topBlock.appendChild(stemLabel(times.start));

                                // Bottom Block (Full Width)
                                const botH = (times.end - start45) * pxPerMin;
                                const botTop = (start45 - startTime) * pxPerMin;
                                const botBlock = createBlock({
                                    top: botTop + 'px',         // Perfect alignment with 12:45 (seamless with topBlock overlap)
                                    left: '2px',                // Standard padding
                                    width: 'calc(100% - 4px)',  // Standard inner width
                                    height: (botH - 2) + 'px',  // Standard padding
                                    borderRadius: '4px 0 4px 4px'
                                });
                                // Add shoulder radius to bottom block (Top-Left)
                                botBlock.style.borderTopLeftRadius = '4px'; 
                                botBlock.style.borderTopRightRadius = '0';

                                td.appendChild(topBlock);
                                td.appendChild(botBlock);
                                
                                // 3. Text Wrapping
                                // Inject a float:left spacer into the content to push text to right for the top section
                                const subjectDiv = pDiv.querySelector('.timetable-subject');
                                if (subjectDiv) {
                                    const spacer = document.createElement('div');
                                    spacer.className = 'schol-sport-spacer';
                                    spacer.style.float = 'left';
                                    spacer.style.width = '70%';
                                    spacer.style.height = `${topH}px`;
                                    spacer.style.pointerEvents = 'none';

                                    subjectDiv.dataset.sportCollisionLayout = 'true';
                                    subjectDiv.style.display = 'block'; 
                                    subjectDiv.prepend(spacer);
                                }
                                
                            } else {
                                // CASE B: Period starts LATE (e.g. 14:05).
                                // Shape: Extension (12:45-Start, Right Half) + Base (pDiv, Full).
                                
                                // 1. Create Extension Block
                                const extH = (times.start - start45) * pxPerMin;
                                const extTop = (start45 - startTime) * pxPerMin;
                                const extBlock = createBlock({
                                    top: (extTop + 2) + 'px',       // Start with standard +2 offset
                                    left: '70%',                    // Span right edge 30%
                                    right: '2px',                   // Inner padding on right
                                    height: (extH + 1) + 'px',      // Drop perfectly into the Base's +2px offset padding, 1px overlap seals gap
                                    borderRadius: '4px 4px 0 4px'
                                });
                                extBlock.appendChild(stemLabel(start45));
                                td.appendChild(extBlock);
                                
                                // 2. Modify pDiv (Base) to join nicely
                                // Remove Top-Right radius to join with extension
                                setTimeout(() => {
                                    const subjectDiv = pDiv.querySelector('.timetable-subject');
                                    if (subjectDiv) {
                                        subjectDiv.style.borderTopRightRadius = '0';
                                    }
                                }, 0);
                            }
                        }
                    } catch (e) {
                        console.error('Sport L-shape render failed', e);
                    }

                    td.appendChild(pDiv);
                }
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
            newTable.appendChild(tbody);
            
            originalTable.replaceWith(scrollWrapper);
            scrollWrapper.appendChild(newTable);
            
            // Ensure any parent components don't restrict height and force scrolling
            let parent = scrollWrapper.parentElement;
            while (parent && parent !== document.body) {
                if (getComputedStyle(parent).overflowY === 'auto' || getComputedStyle(parent).overflowY === 'scroll') {
                    parent.style.overflowY = 'visible';
                    parent.style.height = 'auto';
                    parent.style.maxHeight = 'none';
                }
                parent = parent.parentElement;
            }

            // Smart text fitting logic
            newTable.querySelectorAll(".timetable-subject").forEach(subjectDiv => {
                const hasSportCollisionLayout = subjectDiv.dataset.sportCollisionLayout === 'true';
                const getContentNodes = () => Array.from(subjectDiv.children).filter(child => !(child.classList && child.classList.contains("schol-sport-spacer")));
                const getContentRoot = () => getContentNodes().find(child => child.tagName === "DIV") || getContentNodes()[0] || null;
                // Reset styles to optimize space
                subjectDiv.style.display = hasSportCollisionLayout ? "flow-root" : "flex";
                subjectDiv.style.flexDirection = hasSportCollisionLayout ? "" : "column";
                subjectDiv.style.justifyContent = hasSportCollisionLayout ? "" : "center";
                // Preserve top/bottom padding reserved for time labels; only set horizontal padding
                subjectDiv.style.paddingLeft = "2px";
                subjectDiv.style.paddingRight = "2px";
                subjectDiv.style.boxSizing = "border-box";
                subjectDiv.style.textAlign = "center";
                subjectDiv.style.overflow = "hidden";
                subjectDiv.style.height = "100%";
                subjectDiv.style.whiteSpace = "normal"; // Allow full words to wrap
                subjectDiv.style.wordBreak = "normal"; // Prevent mid-word breaks
                subjectDiv.style.overflowWrap = "normal"; // Prevent mid-word breaks

                if (hasSportCollisionLayout) {
                    subjectDiv.querySelectorAll(".schol-sport-spacer").forEach(spacer => spacer.remove());
                    subjectDiv.style.paddingRight = "10%";
                }

                const contentRoot = getContentRoot();
                if (contentRoot && hasSportCollisionLayout) {
                    contentRoot.style.display = "block";
                    contentRoot.style.width = "100%";
                }
                
                // Remove default margins from children
                Array.from(subjectDiv.children).forEach(c => {
                    if (c.classList && c.classList.contains("schol-sport-spacer")) return;
                    c.style.margin = "0";
                    c.style.lineHeight = "1.1"; // Slightly tighter line height
                    c.style.whiteSpace = "normal";
                });

                const link = subjectDiv.querySelector("a");
                if (link) {
                    link.style.fontWeight = "bold";
                    link.style.display = "block"; 
                    link.style.whiteSpace = "normal";
                    link.style.overflowWrap = "normal";
                    link.style.wordBreak = "keep-all";
                    link.style.color = "inherit";
                    if (hasSportCollisionLayout) {
                        link.style.letterSpacing = "-0.2px";
                    }
                }

                const hasOverflow = () => {
                    if (!hasSportCollisionLayout) {
                        return subjectDiv.scrollHeight > subjectDiv.clientHeight || subjectDiv.scrollWidth > subjectDiv.clientWidth;
                    }

                    const measurableNodes = getContentNodes();
                    if (!measurableNodes.length) return false;

                    const contentBottom = measurableNodes.reduce((maxBottom, node) => {
                        const nodeBottom = node.offsetTop + node.offsetHeight;
                        return Math.max(maxBottom, nodeBottom);
                    }, 0);

                    return contentBottom > subjectDiv.clientHeight;
                };
                const visibleContentNodes = () => Array.from(subjectDiv.children).filter(child => {
                    if (child.classList && child.classList.contains("schol-sport-spacer")) return false;
                    return child.textContent.replace(/\s+/g, '').length > 0;
                });

                const dropSecondaryContent = () => {
                    const visibleNodes = visibleContentNodes();
                    const minKeep = hasSportCollisionLayout ? 2 : 1;
                    if (visibleNodes.length <= minKeep) return false;
                    visibleNodes.slice(minKeep).forEach(node => node.remove());
                    return true;
                };

                // Iteratively shrink font size to fit
                let fontSize = 12;

                // More consistent font sizes based on height
                if (subjectDiv.clientHeight >= 120) fontSize = 16;
                else if (subjectDiv.clientHeight >= 80) fontSize = 14;
                else fontSize = 12; // Default for small boxes like House Period

                subjectDiv.style.fontSize = `${fontSize}px`;
                
                // We allow valid font sizes down to 8px (9px for sport collision) for extreme cases
                // Check both height and width overflow
                const longestWordLength = Math.max(...(link?.textContent || subjectDiv.textContent || "").split(/\s+/).map(w => w.length), 0);
                const minFontSize = hasSportCollisionLayout ? (longestWordLength > 12 ? 12 : 15) : 8;
                while (hasOverflow() && fontSize > minFontSize) {
                    fontSize -= 0.5;
                    subjectDiv.style.fontSize = `${fontSize}px`;
                }

                // If still overflowing or very small box, remove redundant info
                if (hasOverflow() || subjectDiv.clientHeight < 50) {
                    subjectDiv.innerHTML = subjectDiv.innerHTML
                    .replace(/\s*\([^)<>]*\)/g, '') // Remove (subject code)
                    .replace(/\s*\[[^\]<>]*\]/g, '') // Remove [subject code]
                    .replace(/<br[^>]*\/?>/gi, '') // Remove all br tags (including with attributes)
                    .replace(/^\s*[\r\n]/gm, '');
                    
                    // Re-check size after removal
                    while (hasOverflow() && fontSize > Math.max(minFontSize - 1, 7)) {
                        fontSize -= 0.5;
                        subjectDiv.style.fontSize = `${fontSize}px`;
                    }
                }

                if (hasOverflow()) {
                    dropSecondaryContent();
                    while (hasOverflow() && fontSize > Math.max(minFontSize - 2, 6)) {
                        fontSize -= 0.5;
                        subjectDiv.style.fontSize = `${fontSize}px`;
                    }
                }
                
                // If still overflowing, apply scale transform as a last resort
                if (hasOverflow()) {
                    const vScale = subjectDiv.clientHeight / subjectDiv.scrollHeight;
                    const hScale = subjectDiv.clientWidth / subjectDiv.scrollWidth;
                    const scale = Math.min(vScale, hScale) * 0.95;
                    const wrapper = document.createElement('div');
                    wrapper.style.transform = `scale(${Math.max(scale, 0.5)})`;
                    wrapper.style.transformOrigin = 'center center';
                    wrapper.style.width = '100%';
                    wrapper.style.maxHeight = '100%';
                    wrapper.style.display = 'flex';
                    wrapper.style.flexDirection = 'column';
                    wrapper.style.alignItems = 'center';
                    wrapper.style.justifyContent = 'center';
                    wrapper.style.overflow = 'hidden';
                    
                    while (subjectDiv.firstChild) {
                        wrapper.appendChild(subjectDiv.firstChild);
                    }
                    subjectDiv.appendChild(wrapper);
                }
            });
            
            let currentDayNum = 0;
            fetch("https://services.stmichaels.vic.edu.au/dwi.cfm?otype=json")
                .then(r => r.json())
                .then(r => {
                    currentDayNum = parseInt(r.D);
                    updateTimeLine();
                }).catch(() => {});

            const updateTimeLine = () => {
                const now = new Date();
                const mins = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() / 60);
                
                let line = document.getElementById("timetable-timeline");
                if (mins < startTime || mins > endTime) {
                    if (line) line.style.display = "none";
                } else {
                    if (!line) {
                        line = document.createElement("div");
                        line.id = "timetable-timeline";
                        line.style.cssText = "position: absolute; border-top: 2px solid #ff4d4d; z-index: 100; pointer-events: none; transition: top 1s linear;";
                        scrollWrapper.appendChild(line);
                    }
                    line.style.display = "block";
                    line.style.top = `${(newTable.tHead?.offsetHeight || 0) + ((mins - startTime) * pxPerMin)}px`;
                    line.style.left = `${60 - scrollWrapper.scrollLeft}px`;
                    line.style.width = `${Math.max(newTable.offsetWidth - 60, 0)}px`;
                }

                // Highlight active subject
                document.querySelectorAll(".timetable-subject-active").forEach(el => {
                    el.classList.remove("timetable-subject-active");
                    const subjectDiv = el.querySelector(".timetable-subject");
                    if (subjectDiv) {
                        subjectDiv.style.outline = "none";
                        subjectDiv.style.boxShadow = "none";
                        subjectDiv.style.animation = "";
                        subjectDiv.style.zIndex = "";
                    }
                });

                if (currentDayNum > 0) {
                    const todayCell = newTable.querySelector(`td[data-day="${currentDayNum}"]`);
                    if (todayCell) {
                        const periods = todayCell.querySelectorAll(".timetable-period-absolute");
                        periods.forEach(p => {
                            const start = parseInt(p.getAttribute("data-start"));
                            const end = parseInt(p.getAttribute("data-end"));
                            if (mins >= start && mins < end) {
                                p.classList.add("timetable-subject-active");
                                // Add a nice outline
                                const subjectDiv = p.querySelector(".timetable-subject");
                                if (subjectDiv) {
                                    subjectDiv.style.outline = "6px solid var(--accent-foreground, #0072ce)";
                                    subjectDiv.style.outlineOffset = "-6px";
                                    subjectDiv.style.animation = "scholActivePulse 2.5s ease-in-out infinite";
                                    subjectDiv.style.zIndex = "10";
                                }
                            }
                        });
                    }
                }
            };

            updateTimeLine();
            scrollWrapper.addEventListener("scroll", updateTimeLine, { passive: true });
            setInterval(updateTimeLine, 10000);

            // Observe and revert any Schoolbox auto-contrast overrides on colour
            try {
                const reapplyColours = (el) => {
                    if (!el || !el.dataset) return;
                    const fg = el.dataset.scholFg;
                    const bg = el.dataset.scholBg;
                    if (bg) el.style.setProperty('background-color', bg, 'important');
                    if (fg) el.style.setProperty('color', fg, 'important');
                };
                const mo = new MutationObserver((mutations) => {
                    for (const m of mutations) {
                        if (m.type === 'attributes' && (m.attributeName === 'style' || m.attributeName === 'class')) {
                            const t = m.target;
                            if (t && t.dataset && (t.dataset.scholFg || t.dataset.scholBg)) {
                                reapplyColours(t);
                            }
                        }
                    }
                });
                mo.observe(newTable, { subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
            } catch (e) {
                console.warn('Colour enforcement observer failed:', e);
            }
        }
    }
}

async function remoteAuth() {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(REMOTE_API);
            if (!response.ok) {
                throw new Error(`Server error (${response.status})`);
            } else {
                const result = await response.json();
                localStorage.setItem('userToken', result.token);
                resolve();
            }
        } catch (error) {
            reject(new Error('Network error'));
        }
    });
}
function postImage(image) {
    return new Promise( (resolve) => {
        fetch("https://learning.stmichaels.vic.edu.au/storage/asyncUpload.php", {
            method: "POST",
            body: image
        }).then(async r => { resolve(await r.json()) })
    });
}
async function getThemes() {
    return new Promise (( resolve ) => {
        fetch(THEME_API + "/themes")
        .then(r => r.json())
        .then(r => { resolve(r) })
    });
}


async function getConfig() {
    return new Promise(async (resolve, reject) => {
        try {
            if (!localStorage.getItem('userToken')) {
                await remoteAuth();
            }
            const response = await fetch(THEME_API + '/config', {
                headers: new Headers({
                    Authorization: 'Basic ' + localStorage.getItem('userToken'),
                }),
            });
            if (!response.ok) {
                if (response.status === 403) {
                    reject(new Error('Forbidden'));
                } else {
                    reject(new Error(`Server error (${response.status})`));
                }
            } else {
                const config = await response.json();
                resolve(config);
            }
        } catch (error) {
            reject(new Error('Network error'));
        }
    });
}
async function postConfig() {
    return new Promise (async ( resolve ) => {
        if (!localStorage.getItem("userToken")) { await remoteAuth(); }
        fetch(THEME_API + "/config", {
            method: "POST",
            headers: new Headers({
                "Authorization": "Basic " + localStorage.getItem("userToken"),
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({"config": extConfig, "sbu": schoolboxUser})
        }).then(r => { resolve() })
    });
}

if (!(localStorage.getItem("disableQOL") != undefined && typeof forceEnableQOL == "undefined" && !isExtension)) {

    // const splashList = [
    //     "Ducks are pretty cool",
    //     "More themes one day???",
    //     "Cubifying dogs, 50% loaded",
    //     "Good4u (subscribe)",
    //     "Boppity bibbity your breathing is now a concious activity",
    //     "Here you leave the world of today, and enter the world of yesterday, tomorrow, and fantasy ",
    //     ":D",
    //     "Hello there",
    //     "General kenobi",
    //     "Over 1.8k lines of code!",
    //     "We would like to contact your about your cars extended warranty",
    //     "As seen on TV!",
    //     "It's here!",
    //     "One of a kind!",
    //     "Mobile compatible!",
    //     "Exclusive!",
    //     "NP is not in P!",
    //     "Jeb_",
    //     "Also try services!",
    //     "There are no facts, only interpretations.",
    //     "Made with CSS!",
    //     "Made with JS!",
    //     "0% Sugar!"   
    // ];

    const splashList = [
        "Development Enabled"
    ]

    const splashIndex = Math.floor(Math.random() * splashList.length);
    const splashText = splashList[splashIndex];

    console.log("Schol Extensions Enabled. " + splashText);
}
