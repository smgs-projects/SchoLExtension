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
// Timetable rows NOT to remove if all blank
const TIMETABLE_WHITELIST = ["Period 1", "Period 2", "Period 3", "Period 4", "Period 5"]
// Conditions where "Click to view marks" will appear on feedback (uses str.includes())
const SHOW_FEEDBACKS = ["(00", "[00", "(01", "[01", "(02", "[02", "(03", "[03", "(04", "[04", "(05", "[05", "(06", "[06", "(12", "[12"];
// Theme API location
const THEME_API = "https://apps.stmichaels.vic.edu.au/scholext"
// SchoL Remote Service API Link
const REMOTE_API = "/modules/remote/" + btoa("https://apps.stmichaels.vic.edu.au/scholext/auth") + "/window"
// Link to image to show at the bottom of all due work items (levels of achievement table)
const ACHIEVEMENT_IMG = "/storage/image.php?hash=82df5e189a863cb13e2e988daa1c7098ef4aa9e1"
// List of valid pronouns
const VALID_PRONOUNS = {"hehim" : "He/Him", "sheher": "She/Her", "theythem": "They/Them", "other": "Ask Me"}
// List of valid image types for timetable themes
const IMAGE_TYPES = ['image/png', 'image/gif', 'image/bmp', 'image/jpeg'];
// Darkmode Theme location
const DARKMODE_CSS_URL = "https://services.stmichaels.vic.edu.au/_dmode/darkmode.css";

const DEFAULT_CONFIG = {
    "theme" : {},
    "themedefault" : {},
    "darkmodetheme" : "light",
    "settings" : {"colourduework":1,"compacttimetable":1},
    "pronouns" : {"selected":[],"show":[1,1,1]},
    "updated" : 0,
    "version" : 2
}

let PTVDepatureUpdate = true;
let extConfigSvr;
let extConfig;

// Try to push out darkmode early to prevent light mode flash
let darkmodeCSSDom;
function applyDark() {
    darkmodeCSSDom = document.createElement('link');
    darkmodeCSSDom.rel = "stylesheet";
    darkmodeCSSDom.href = DARKMODE_CSS_URL;

    document.styleSheets[1].disabled = false;
    darkmodeCSSDom.id = "darkmode-core";
    (document.head || document.body).appendChild(darkmodeCSSDom);

    // Custom text contrast checks
    const layer1Bg = [0, 0, 38];
    const wcagContrast = 4.5; // WCAG-recommended contrast ratio
    document
    .querySelectorAll(`span:not([style*="color:#000"]):not(td[style*="background-color"] span):not(span[style*="background-color"] > span):not(div[style*="background-color"] *)`)
    .forEach((e) => {
        let rgb = e.style.color
        .replace(/[^\d,]/g, "")
        .split(",")
        .slice(0, 3);

        // Check if there's enough contrast
        if (rgb.length === 3 && contrast(layer1Bg, rgb) < wcagContrast) {
            e.style.color = `rgb(${255 - rgb[0]},${255 - rgb[1]},${255 - rgb[2]})`;
        }
    });
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

// Check for extConfig existence early to get dark mode theme setting ASAP
// Also disable if being overrided by dev ScholExt 
if (!(localStorage.getItem("disableQOL") != undefined && typeof forceEnableQOL == "undefined") && localStorage.getItem("extConfig") !== null) {
    try {
        let earlyExtConfig = JSON.parse(localStorage.getItem("extConfig"));
        if (earlyExtConfig.darkmodetheme) updateTheme(earlyExtConfig.darkmodetheme);
    } catch {
        console.log("2345312");
    }
}



if (document.readyState === "complete" || document.readyState === "interactive") { load(); }
else { window.addEventListener('DOMContentLoaded', () => { load() }); }

async function load() {
    if (localStorage.getItem("disableQOL") != undefined && typeof forceEnableQOL == "undefined") return; // Allow disabling of QOL features (mainly for testing)
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

            // Alert the user that the server is down and that some functionality may not work as intended
            // This will only show once, if the user refreshes the page, it will not show again - this is to prevent spamming the user with toasts
            document.body.insertAdjacentHTML("beforeend", `<div id="scholext-fail-toaster" class="toast alert" data-toast></div>`)
            const failToaster = $('#scholext-fail-toaster');
            failToaster.toastActivate({text: 'Could not connect to SchoL Extension server. Custom timetable colours may not work correctly', css: 'alert'});
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
    if (window.location.pathname.startsWith("/search/user")) profilePage();
    if (window.location.pathname.startsWith("/search/user/") && window.location.pathname.endsWith(schoolboxUser.id)) await loadSettings();
    if (window.location.pathname.startsWith("/settings/messages")) await loadSettings();
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
                if (!REGEXP.exec(subject.innerText)) continue
                defaultTheme[REGEXP.exec(subject.innerText)[1]] = {color: subject.parentNode.style.backgroundColor, image: null, current: "color"}
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
    const whiteContrast = getContrast(bgColor, '#ffffff')
    const blackContrast = getContrast(bgColor, '#000000')
    return whiteContrast > blackContrast ? '#ffffff' : '#000000'
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
        const searchbar = document.createElement('input')
        searchbar.placeholder = "Type to search"
        searchbar.addEventListener('keyup', () => {
            if (document.activeElement === searchbar) {
                const text = searchbar.value.toLowerCase();
                const notifications = document.getElementById("msg-content").querySelectorAll("li")
                for (const notif of notifications) {
                    //Check if text contains other text, it is index since contains/includes did not work at that moment
                    if (notif.textContent.toLocaleLowerCase().trim().indexOf(text) == -1) {
                        notif.style.display = "none";
                    } else {
                        //To allow filter clearing
                        notif.style.display = "block";
                    }
                }
            }
        });
        document.getElementById("message-list").children[1].appendChild(searchbar)
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
            subject.parentNode.querySelectorAll("*:not(a)").forEach(e => { e.style.color = textcol })
            if (textcol != "#000000") subject.parentNode.querySelectorAll("a").forEach(e => e.style.color = "#b0e1ff" )

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
        "compacttimetable": ["Compact Timetable", "Remove empty items/rows from the timetable on the dashboard and timetable page"]
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
                    <legend><strong>Preferred Pronouns</strong></legend>
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
            <h2 class="subheader">Timetable Theme</h2>
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

            <div class="component-action" style="margin-top: 20px; margin-bottom: 20px;">
                <span style="font-size: 12px; color: #AAA;">
                    Additional features developed by Yuma (11M), Sebastien (12H), Max (11S), and Zac (OM2022).
                </span>
            </div>

            <ul class="meta" style="font-size: 12px">
                SchoL features and profile settings are managed by the School Leadership Team and the St Michael's ICT Steering Committee. Feedback and future suggestions for the improvement of SchoL can be directed to: <a href="mailto:scholfeedback@stmichaels.vic.edu.au">scholfeedback@stmichaels.vic.edu.au</a>. <!-- rip dead name remover :( -->
            </ul>
        </div>`)


    module_darkMode = `  
        <h2 class="subheader">Dark Mode</h2>
        <section>
            <fieldset class="content">
                <legend><strong>Dark Mode Theme Selector</strong></legend>
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
}
function assessments() {
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
                    <img src="${ACHIEVEMENT_IMG}">
                </section>
            </div>`)
        }
        break
    }
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
    if (!document.querySelector("h2[data-timetable-header]")) {
        fetch("https://services.stmichaels.vic.edu.au/dwi.cfm?otype=json")
        .then(r=>r.json())
        .then(r=>document.querySelector(".island").insertAdjacentHTML("afterbegin", `<h2 class="subheader">${r.text}</h2>`))
    }
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
    (document.querySelector(".awardsComponent") || document.querySelector("#component62394"))?.insertAdjacentHTML("afterend", `
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
            background-image: url("https://www.ptv.vic.gov.au/resources/themes/ptv-mpw/public/images/icons/tram.png");
            background-image: url("https://www.ptv.vic.gov.au/resources/themes/ptv-mpw/public/images/icons/tram.svg");
        }

        .PTVIcon.train .route-lock-up {
            border-color: #0072ce !important;
        }
        .PTVIcon.train .icon {
            background-image: url("https://www.ptv.vic.gov.au/resources/themes/ptv-mpw/public/images/icons/train.png");
            background-image: url("https://www.ptv.vic.gov.au/resources/themes/ptv-mpw/public/images/icons/train.svg");
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
                            <div style="display: inline"><h3 style="padding-left: 10px"><a class="title">${schedule.prefix}to ${schedule.name}</a></h3></div>
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
}

function timetable() {
    document.querySelector("h1[data-timetable-title]").style.display = "inline-block"
    document.querySelector("h1[data-timetable-title]").insertAdjacentHTML("afterend", `
        <a href="/settings/messages" class="button show-for-landscape" style="margin-top: 10px; float: right; display: inline-block">Customise Colours</a>
        <a href="/settings/messages" class="button show-for-portrait" style="margin-top: 10px; display: inline-block">Customise Colours</a>
    `)

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

const splashList = [
    "Ducks are pretty cool",
    "More themes one day???",
    "Cubifying dogs, 50% loaded",
    "Good4u (subscribe)",
    "Boppity bibbity your breathing is now a concious activity",
    "Here you leave the world of today, and enter the world of yesterday, tomorrow, and fantasy ",
    ":D",
    "Hello there",
    "General kenobi",
    "Over 1.8k lines of code!",
    "We would like to contact your about your cars extended warranty",
    "As seen on TV!",
    "It's here!",
    "One of a kind!",
    "Mobile compatible!",
    "Exclusive!",
    "NP is not in P!",
    "Jeb_",
    "Also try services!",
    "There are no facts, only interpretations.",
    "Made with CSS!",
    "Made with JS!",
    "0% Sugar!"   
];

const splashIndex = Math.floor(Math.random() * splashList.length);
const splashText = splashList[splashIndex];

console.log("Schol Extentions Enabled. " + splashText);