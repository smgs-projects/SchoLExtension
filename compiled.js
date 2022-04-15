// Random SchoL improvements that make it better maybe?™
// by Zac McWilliam and Sebastien Taylor
//         ____
//   _,.-'`_ o `;__,
//    _.-'` '---'  '
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
const THEME_API = "https://rcja.app/smgsapi"
// SchoL Remote Service API Link
const REMOTE_API = "/modules/remote/" + btoa("https://rcja.app/smgsapi/auth") + "/window"
// Link to image to show at the bottom of all due work items (levels of achievement table)
const ACHIEVEMENT_IMG = "/storage/image.php?hash=82df5e189a863cb13e2e988daa1c7098ef4aa9e1"
// List of settings with default values
let extSettings = {"themesync": 1, "settingsync": 1, "autoreload": 0, "colourduework": 1, "compacttimetable": 1, "deadnameremover": {"enabled": 1, "names": []}};

if (document.readyState === "complete" || document.readyState === "interactive") { load(); }
else { window.addEventListener('load', () => { load() }); }

async function load() {
    if (localStorage.getItem("disableQOL") != undefined && typeof forceEnableQOL == "undefined") return; // Allow disabling of QOL features (mainly for testing)
    if (typeof schoolboxUser == "undefined") return;
    try {
        extSettings = Object.assign({}, extSettings, JSON.parse(localStorage.getItem("extSettings")))
        JSON.parse(localStorage.getItem("timetableTheme"))
        JSON.parse(localStorage.getItem("defaultTheme"))
    } catch {
        // Clear localStorage items if JSON.parse fails (prevents errors if someone breaks localStorage)
        localStorage.removeItem("timetableTheme");
        localStorage.removeItem("lastTimetableCache");
        localStorage.removeItem("extSettings");
        localStorage.removeItem("userToken");
        localStorage.removeItem("lastUser");
        window.location.reload()
    }
    // Update outdated localStorage colours
    if (localStorage.getItem("timetableColours")) {
        let timetableColours = JSON.parse(localStorage.getItem("timetableColours"))
        let timetableTheme = {}
        for (subject in timetableColours) {
            timetableTheme[subject] = {color: timetableColours[subject], image: null, current: "color"}
        }
        localStorage.removeItem("timetableColours")
        localStorage.removeItem("timetableColoursDefault")
    }
    if (schoolboxUser.id != localStorage.getItem("lastUser")) {
        localStorage.removeItem("defaultTheme");
        localStorage.removeItem("timetableTheme");
        localStorage.removeItem("lastTimetableCache");
        localStorage.removeItem("extSettings");
        localStorage.removeItem("userToken");
        localStorage.removeItem("lastUser");
    }
    if (localStorage.getItem("lastTimetableCache") && localStorage.getItem("lastTimetableCache") < 8.64e+7) {
        localStorage.removeItem("lastTimetableCache")
    }
    
    let timetableTheme = JSON.parse(localStorage.getItem("timetableTheme"))
    if (!localStorage.getItem("lastTimetableCache") || !localStorage.getItem("defaultTheme") || !timetableTheme) {
        if (!timetableTheme) timetableTheme = {}
        remoteAuth();
        fetch('/timetable').then(r => r.text()).then(result => {
            let defaultTheme = {}
            let parser = new DOMParser();
            const timetable = parser.parseFromString(result, 'text/html')
            for (const subject of timetable.querySelectorAll(".timetable-subject[style*='background-color'] div")) {
                if (!REGEXP.exec(subject.innerText)) continue
                defaultTheme[REGEXP.exec(subject.innerText)[1]] = {color: subject.parentNode.style.backgroundColor, image: null, current: "color"}
            }
            localStorage.setItem("defaultTheme", JSON.stringify(defaultTheme))
            for (const subject in defaultTheme) {
                if (!timetableTheme[subject]) {
                    timetableTheme[subject] = defaultTheme[subject]
                }
            }
            localStorage.setItem("timetableTheme", JSON.stringify(timetableTheme))
            localStorage.setItem("lastTimetableCache", Date.now()) // For recaching
            localStorage.setItem("lastUser", schoolboxUser.id) // For recaching if user switch
        })
    }

    allPages()
    if (window.location.pathname == "/") mainPage();
    if (window.location.pathname == "/learning/classes") classesPage();
    if (window.location.pathname.startsWith("/calendar")) setInterval(eDiary, 500);
    if (window.location.pathname.startsWith("/learning/due")) setInterval(dueWork, 500);
    if (window.location.pathname.startsWith("/learning/grades")) feedback();
    if (window.location.pathname.startsWith("/learning/assessments/")) assessments();
    if (window.location.pathname.startsWith("/timetable")) timetable();
    if (window.location.pathname.startsWith("/search/user/") && window.location.pathname.endsWith(schoolboxUser.id)) await loadSettings();
    if (window.location.pathname.startsWith("/settings/messages")) await loadSettings();
    if (extSettings.deadnameremover.enabled) deadNameRemover();
    await themeSync();
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
    // Add Timetable link to profile dropdown (only if timetable exists in navbar already)
    let tt_links = document.querySelectorAll(".icon-timetable")
    for (e of tt_links) {
        if (e.innerText.includes("Timetable")) {
            document.querySelector("#profile-options .icon-staff-students").insertAdjacentHTML("afterend", `<li><a href="/timetable" class="icon-timetable">Timetable</a></li>`)
            break
        }
    }
    colourSidebar();
    colourTimetable();
    colourDuework();
    setTimeout(colourDuework, 1000) // Some pages require extra loading time
}

function replaceDeadNames(element, dead, preferred) {
    for (let node of element.childNodes) {
        if (["SCRIPT", "STYLE"].includes(node.nodeName)) continue;
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                replaceDeadNames(node, dead, preferred);
                break;
            case Node.TEXT_NODE:
                for (let i=0; i<dead.length; i++) {
                    node.textContent = node.textContent.replace(new RegExp(dead[i], "g"), preferred[i]);
                }
                break;
            case Node.DOCUMENT_NODE:
                replaceDeadNames(node, dead, preferred);
        }
    }
}

function deadNameRemover() {
    let deadnames = extSettings.deadnameremover.names.map(e => { return e[0] })
    let preferrednames = extSettings.deadnameremover.names.map(e => { return e[1] })
    replaceDeadNames(document.body, deadnames, preferrednames)
}

function colourSidebar() {
    for (const subjectlink of document.querySelectorAll("#side-menu-mysubjects li a")) {
        //Uses the link that it leads to, since that is the only way to get it out of the text
        let theme = JSON.parse(localStorage.getItem("timetableTheme"))[subjectlink.href.split("/")[subjectlink.href.split("/").length - 1]]
        if (!theme) continue
        subjectlink.style.backgroundColor = theme.color.replace("rgb", "rgba").replace(")", ", 10%)")
        subjectlink.style.borderLeft = "7px solid " + theme.color
    }
}

function colourDuework() {
    if (extSettings.colourduework) {
        let dueworkitems = document.querySelectorAll(".Schoolbox_Learning_Component_Dashboard_UpcomingWorkController li")
        if (!dueworkitems.length) { dueworkitems = document.querySelectorAll("#report_content li") }
        
        for (const duework of dueworkitems) {
            const subjects = REGEXP.exec(duework.querySelector("a:not(.title)").innerText)[1]?.split(",")
            for (const subject of subjects) {
                const colour = JSON.parse(localStorage.getItem("timetableTheme"))[subject]?.color
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
            const theme = JSON.parse(localStorage.getItem("timetableTheme"))[subjectcode]
            if (!theme) continue
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
            const colour = JSON.parse(localStorage.getItem("timetableTheme"))[subject]?.color
            if (!colour) continue
            card.querySelector("div.card-class-image").style.borderBottom = `10px solid ${colour}`
        }
    }
}
async function loadSettings() {
    let tablerows = "";
    let userthemes = JSON.parse(localStorage.getItem("timetableTheme"))
    for (const subject in userthemes) {
        const rgbvalue = userthemes[subject]["color"]
        const hexvalue = rgbToHex(...rgbvalue.replace(/[^\d\s]/g, '').split(' ').map(Number))
        tablerows += `<tr role="row" class="subject-color-row" style="background-color: ${rgbvalue.replace("rgb", "rgba").replace(")", ", 10%)")}; ${userthemes[subject].current === "image" ? "background-image: url(" + userthemes[subject]["image"] +");" : ""} background-size: 100% 100%; border-left: 7px solid ${rgbvalue}">
            <td>${subject}</td>
            <td>
                <input type="color" style="display: ${userthemes[subject]["current"] === "image" ? "none" : ""}" value="${hexvalue}">
                <input type="url" pattern="https://.*" required placeholder="Enter Image URL" style="display: ${userthemes[subject]["current"] === "image" ? "" : "none"}" value="${userthemes[subject]["image"] === null ? "" : userthemes[subject]["image"]}">
                <p style="display: none; color: red" class="invalidurl">Not a valid URL</p>
            </td>
            <td style="text-align: center">
                <a id="settingsresset" data-target="delete" data-state="closed" class="icon-refresh" title="Reset" style="vertical-align: middle; line-height: 40px"></a>
            </td>
            <td style="text-align: center">
                <a data-target="delete" style="vertical-align: middle; line-height: 39px; display: ${userthemes[subject]["current"] === "image" ? "none" : ""}" data-state="closed" class="icon-image" title="Image">
                <a data-target="delete" style="vertical-align: middle; line-height: 39px; display: ${userthemes[subject]["current"] === "image" ? "" : "none"}" data-state="closed" class="icon-drag-drop" title="Colour">
            </td>
        </tr>`
    }
    if (Object.keys(userthemes).length < 1) {
        tablerows += `<tr role="row" class="subject-color-row">
            <td colspan="3">There are no timetable subjects associated with your account</td>
        </tr>`
    }

    let themeoptions = ""
    const themes = await getThemes()
    if (themes) {
        themeoptions += `<option disabled selected>Click to select a theme</option>`
        for (const theme of themes) {
            themeoptions += `<option value='${theme.theme}'>${theme.name}</option>`
        }
    }

    const settings = {
        "themesync": ["Theme Syncronisation", "Sync timetable themes between devices"],
        "settingsync": ["Setting Syncronisation", "Sync settings between devices"],
        "autoreload": ["Auto Reload", "Automatically reload the page when your theme changes on another device"],
        "colourduework": ["Coloured Due Work", "Add colours to due work items based on the timetable"],
        "compacttimetable": ["Compact Timetable", "Remove empty items/rows from the timetable on the dashboard and timetable page"],
        "deadnameremover": ["Dead Name Remover", "Allows replacement all instances of dead names across the site (Client side per account only)"]
    }
    let settingselems = ""
    for (setting in settings) {
        settingselems += `<tr>
            <td><label for="toggle_${setting}">${settings[setting][0]}<p>${settings[setting][1]}</p></label></td>
            <td>
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
            <div class="component-action">
                <section>
                    <span style="line-height: 40px; font-size: 12px; color: #AAA; margin-left: 10px; margin-right: 10px">
                        Feature made by Zac McWilliam (12H) and Sebastien Taylor (11H). Let us know if you have suggestions/feedback!
                    </span>
                </section>
            </div>
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
                <fieldset class="content" id="deadnameremover" style="display: none">
                    <legend><strong>Dead Name Remover</strong></legend>
                    <div class="small-12 columns">
                        <p>Enter a dead name to replace across SchoL, the input boxes are CAse-sENSitiVE
                            <br>Use full names to prevent renaming other students <i style="color: #888">(eg. "Zac McWilliam" instead of "Zac" prevents all Zac's getting renamed)</i>
                        </p>
                    </div>
                    <div class="small-12 columns">
                        <ul class="information-list unsortable" id="deadnamelist"></ul>
                    </div>
                    <div class="small-12 columns">
                        <p class="meta"><strong>Note: </strong>Only you will see changes made here, it will not show for other students/staff</p>
                        <p class="meta">This is not guranteed to work everywhere, <a href="mailto:zmcwilliam@stmichaels.vic.edu.au, staylor@stmichaels.vic.edu.au">contact us</a> if you find any problems.</p>
                    </div>
                </fieldset>
                <div class="component-action">
                    <section>
                        <a class="button" id="settingsreset">Reset Settings</a>
                        <a class="button" style="color: #ff5555;" id="themereset">Reset Theme</a>
                    </section>
                </div>
            </section>
        </div>`)

    if (!localStorage.getItem("extSettings")) { localStorage.setItem("extSettings", JSON.stringify(extSettings)); }

    for (setting in settings) {
        toggle_setting = document.getElementById("toggle_" + setting)
        if (extSettings[setting]) { toggle_setting.setAttribute("checked", 1) }
        else { toggle_setting.removeAttribute("checked", 1) }

        toggle_setting.addEventListener("change", async function () {
            if (toggle_setting == "deadnameremover") {
                document.getElementById("deadnameremover").style.display = toggle_setting.checked ? "" : "none"
                extSettings.deadnameremover.enabled = toggle_setting.checked;
            } else { extSettings[setting] = toggle_setting.checked; }
            
            localStorage.setItem("extSettings", JSON.stringify(extSettings))
            await postTheme();
        })
    }

    document.getElementById("settingsreset").addEventListener("click", async function () {
        localStorage.setItem("extSettings", "{}");
        await postTheme();
        window.location.reload()
    })
    
    let elem_themereset = document.getElementById("themereset")
    let elem_currenttheme = document.getElementById("currenttheme")
    let elem_importtext = document.getElementById("importtext")
    let elem_importbtn = document.getElementById("importbtn")
    let elem_exportbtn = document.getElementById("exportbtn")
    let elem_themeselector = document.getElementById("context-selector-themes")
    let elem_deadnamelist = document.getElementById("deadnamelist")

    let deadnames = [];
    document.getElementById("deadnameremover").style.display = extSettings.deadnameremover.enabled ? "" : "none"
    function addDeadname() {
        let id = deadnames.length
        elem_deadnamelist.insertAdjacentHTML("beforeend", `<li id="deadname_${id}">
            <div class="actions-small-1">
                <div class="list-item">
                    <div class="small-12 medium-6 column">
                        <label><span class="hide-for-medium-up">Name to replace</span>
                        <input type="text" placeholder="Name to replace (Old)" id="deadnameold_${id}"></label>
                    </div>
                    <div class="small-12 medium-6 column">
                        <label><span class="hide-for-medium-up">Preferred name</span>
                        <input type="text" placeholder="Preferred name (New)" id="deadnamenew_${id}"></label>
                    </div>
                </div>
                <nav><a id="deadnamedel_${id}" class="icon-delete" title="Delete" style="vertical-align: middle; line-height: 63px; display: none"></a></nav>
            </div>
        </li>`)
        let elem_li = document.getElementById("deadname_" + id)
        let elem_old = document.getElementById("deadnameold_" + id)
        let elem_new = document.getElementById("deadnamenew_" + id)
        let elem_del = document.getElementById("deadnamedel_" + id)
        deadnames.push({deleted: 0, li: elem_li, old: elem_old, new: elem_new, del: elem_del})

        function getValidDeadnames() {
            let amt_deadnames = 0;
            let valid_deadnames = [];
            for (deadname of deadnames) {
                deadname.del.style.display = (deadname.old.value || deadname.new.value) ? "" : "none"
                if (!deadname.deleted) amt_deadnames += 1
                if (!deadname.old.value || !deadname.new.value || deadname.deleted) continue
                valid_deadnames.push([deadname.old.value, deadname.new.value])
            }
            extSettings.deadnameremover.names = valid_deadnames;
            localStorage.setItem("extSettings", JSON.stringify(extSettings))
            return [valid_deadnames, amt_deadnames]
        }
        let inputs = [elem_new, elem_old];
        inputs.forEach(item => { item.addEventListener("keyup", async function(evt) {
            const last = deadnames[deadnames.length - 1]
            let [valid_deadnames, total_deadnames] = getValidDeadnames();
            
            if (valid_deadnames.length == total_deadnames) {
                addDeadname()
            } else if (!last.old.value && !last.new.value && valid_deadnames.length != total_deadnames - 1) {
                last.li.style.display = "none"
                deadnames[deadnames.length - 1].deleted = 1
            }
        })})
        inputs.forEach(item => { item.addEventListener("change", async function(evt) {
            getValidDeadnames();
            await postTheme();
        })})
        elem_del.addEventListener("click", async function () {
            elem_li.style.display = "none"
            deadnames[id].deleted = 1
            
            let amt_deadnames = 0;
            for (deadname of deadnames) { if (!deadname.deleted) amt_deadnames += 1 }
            if (amt_deadnames == 0) addDeadname()
            
            getValidDeadnames();
            await postTheme();
        })
        return deadnames[id]
    }
    
    for (const deadname of extSettings.deadnameremover.names) {
        newitem = addDeadname()
        newitem.old.value = deadname[0]
        newitem.new.value = deadname[1]
        newitem.del.style.display = ""
    }
    if (deadnames.length == 0) {
        newitem = addDeadname()
        newitem.old.value = schoolboxUser.fullName;
        newitem.del.style.display = ""
    } else addDeadname()

    function updateThemeExport() {
        elem_currenttheme.value = Object.values(JSON.parse(localStorage.getItem("timetableTheme"))).map(e => {if (e["current"] === "color") {return e["color"]}})
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
        row.children[1].children[0].addEventListener("change", async function(e) {
            const rgbval = "rgb(" + hexToRgb(e.target.value) + ")" 
            row.style.borderLeft = "7px solid " + rgbval
            row.style.backgroundColor = rgbval.replace("rgb", "rgba").replace(")", ", 10%)")

            let timetableTheme = JSON.parse(localStorage.getItem("timetableTheme"))
            timetableTheme[subject].color = rgbval
            timetableTheme[subject].current = "color"
            localStorage.setItem("timetableTheme", JSON.stringify(timetableTheme))
            colourSidebar();
            updateThemeExport();
            await postTheme();
        })
        // Image picker input
        row.children[1].children[1].addEventListener("change", async function(e) {
            const url = e.target.value
            let valid_url = url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g) !== null && e.target.reportValidity()

            e.target.style.border = valid_url ? "solid green 2px" : "solid red 1px"
            row.querySelector(".invalidurl").style.display = valid_url ? "none" : ""
            let timetableTheme = JSON.parse(localStorage.getItem("timetableTheme"))
            timetableTheme[subject].image = valid_url ? url : null
            timetableTheme[subject].current = valid_url ? "image" : "color"
            row.style.backgroundImage = valid_url ? "url(" + url + ")" : ""
            row.style.backgroundSize = "100% 100%"
            localStorage.setItem("timetableTheme", JSON.stringify(timetableTheme))
            await postTheme();
            
            setTimeout(function() {
                e.target.style.border = ""
            }, 5000)
        })
        // Reset button
        row.children[2].children[0].addEventListener("click", async function () {
            let timetableTheme = JSON.parse(localStorage.getItem("timetableTheme"))
            let defaultColours = JSON.parse(localStorage.getItem("defaultTheme"))
            const rgbval = defaultColours[subject].color

            row.style.borderLeft = "7px solid " + rgbval
            row.style.backgroundColor = rgbval.replace("rgb", "rgba").replace(")", ", 10%)")
            row.style.backgroundImage = ""
            row.style.backgroundSize = "100% 100%"
            row.children[1].children[0].value = rgbToHex(...rgbval.replace(/[^\d\s]/g, '').split(' ').map(Number))
            row.children[1].children[1].value = ""
            
            timetableTheme[subject] = {color: rgbval, image: null, current: "color"}
            localStorage.setItem("timetableTheme", JSON.stringify(timetableTheme))
            colourSidebar();
            updateThemeExport();
            await postTheme();
        })
        // Image button
        row.children[3].children[0].addEventListener("click", async function () {
            let timetableTheme = JSON.parse(localStorage.getItem("timetableTheme"))
            timetableTheme[subject]["current"] = "image"
            localStorage.setItem("timetableTheme", JSON.stringify(timetableTheme))
            row.children[1].children[0].style.display = "none"
            row.children[1].children[1].style.display = ""
            row.style.backgroundImage = "url(" + timetableTheme[subject]["image"] + ")"
            row.style.backgroundSize = "100% 100%"
            row.children[3].children[0].style.display = "none"
            row.children[3].children[1].style.display = ""
            await postTheme();
        })
        // Colour button
        row.children[3].children[1].addEventListener("click", async function () {
            let timetableTheme = JSON.parse(localStorage.getItem("timetableTheme"))
            timetableTheme[subject]["current"] = "color"
            localStorage.setItem("timetableTheme", JSON.stringify(timetableTheme))
            row.children[1].children[0].style.display = ""
            row.children[1].children[1].style.display = "none"
            row.style.backgroundColor = timetableTheme[subject]["color"].replace("rgb", "rgba").replace(")", ", 10%)")
            row.style.backgroundImage = ""
            localStorage.setItem("timetableTheme", JSON.stringify(timetableTheme))
            row.children[3].children[0].style.display = ""
            row.children[3].children[1].style.display = "none"
            row.querySelector(".invalidurl").style.display = "none"
            await postTheme();
        })
    }
    elem_themeselector.addEventListener("change", async function(evt){
        let newtheme = evt.target.value.split("-")
        let currenttheme = JSON.parse(localStorage.getItem("defaultTheme"))
        let i = 0
        for (subjectcode in currenttheme) {
            currenttheme[subjectcode] = {color: "rgb(" + hexToRgb(newtheme[i]) + ")", image: null, current: "colour"}
            i++; if (i >= newtheme.length) { i = 0; }
        }
        localStorage.setItem("timetableTheme", JSON.stringify(currenttheme))
        await postTheme()
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
        let currenttheme = JSON.parse(localStorage.getItem("defaultTheme"))
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
            currenttheme[subjectcode] = {color: newtheme[i], image: null, current: "colour"}
            i++; if (i >= newtheme.length) { i = 0; }
        }
        localStorage.setItem("timetableTheme", JSON.stringify(currenttheme))
        await postTheme();
        window.location.reload()
    })
    elem_themereset.addEventListener("click", async function () {
        if (!confirm("Theme Reset: This will reset all your theme colours back to original, are you sure you want to do this?")) return;
        localStorage.removeItem("timetableTheme")
        localStorage.removeItem("defaultTheme")
        localStorage.removeItem("lastTimetableCache")
        elem_updatesynccode.classList = "button disabled"
        elem_syncstatus.innerText = "OFF"
        elem_syncstatus.style.color = "#ff7d7d"
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
            const colour = JSON.parse(localStorage.getItem("timetableTheme"))[subject]?.color
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
    document.querySelectorAll(".fc-list-event").forEach(event => {
        const eventDot = event.querySelector(".fc-list-event-dot");
        eventDot.style.backgroundColor = eventDot.style.borderColor
        const subjectcode = REGEXP.exec(event.querySelector(".fc-event-title").innerText)
        if (!subjectcode) return; 
        const colour = JSON.parse(localStorage.getItem("timetableTheme"))[subjectcode[1]]?.color
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
                const colour = JSON.parse(localStorage.getItem("timetableTheme"))[subjectcode]?.color
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
            const colour = JSON.parse(localStorage.getItem("timetableTheme"))[subjectcode[1]]?.color
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
            const colour = JSON.parse(localStorage.getItem("timetableTheme"))[subjectcode[1]]?.color
            if (!colour) continue;
            const textcol = getTextColor(rgbToHex(...colour.replace(/[^\d\s]/g, '').split(' ').map(Number)).toUpperCase())
            event.style.backgroundColor = colour
            event.querySelectorAll("*").forEach(e => { e.style.color = textcol })
            event.setAttribute("recoloured", 1)
        }
    }
}
function mainPage() {
    if (extSettings.compacttimetable) {
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
    
    // Timetable (mobile) - Make background white
    document.querySelectorAll(".show-for-small-only").forEach(el => { el.style.backgroundColor = "#FFF"; })

    // eDiary list recolour
    if (document.querySelectorAll(".fc-list-event").length == 0) setTimeout(mainPage, 100);
    colourEDiaryList()
}

function timetable() {
    document.querySelector("h1[data-timetable-title]").style.display = "inline-block"
    document.querySelector("h1[data-timetable-title]").insertAdjacentHTML("afterend", `
        <a href="/settings/messages" class="button show-for-landscape" style="margin-top: 10px; float: right; display: inline-block">Customise Colours</a>
        <a href="/settings/messages" class="button show-for-portrait" style="margin-top: 10px; display: inline-block">Customise Colours</a>
    `)

    if (extSettings.compacttimetable) {
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
    return new Promise (( resolve ) => {
        fetch(REMOTE_API).then(r => r.json()).then(result => {
            localStorage.setItem("userToken", result.token);
            resolve()
        })
    });
}
async function getThemes() {
    return new Promise (( resolve ) => {
        fetch(THEME_API + "/themes").then(r => {
            resolve(r.json())
        })
    });
}
async function getTheme() {
    return new Promise (async ( resolve ) => {
        if (!localStorage.getItem("userToken")) { await remoteAuth(); }
        fetch(THEME_API + "/theme", { headers: new Headers({"Authorization": "Basic " + localStorage.getItem("userToken")}) })
        .then(r => r.json())
        .then(r => { resolve(r) })
    });
}
async function postTheme() {
    return new Promise (async ( resolve ) => {
        if (!localStorage.getItem("userToken")) { await remoteAuth(); }
        const body = {"settings": false,"defaultTheme": false, "theme" : false, "sbu" : schoolboxUser}
        if (extSettings.themesync) {
            body["theme"] = JSON.parse(localStorage.getItem("timetableTheme")) || false
            body["defaultTheme"] = JSON.parse(localStorage.getItem("defaultTheme")) || false
        }
        if (extSettings.settingsync) {
            body["settings"] = JSON.parse(localStorage.getItem("extSettings")) || false
        }
        fetch(THEME_API + "/theme", {
            method: "POST",
            headers: new Headers({
                "Authorization": "Basic " + localStorage.getItem("userToken"),
                "Content-Type": "application/json"
            }),
            body: JSON.stringify(body)
        }).then(r => { resolve() })
    });
}
async function themeSync() {
    return new Promise (async ( resolve ) => {
        let change = false
        let newtheme;
        if (extSettings.settingsync || extSettings.themesync) { newtheme = await getTheme(); }

        if (extSettings.settingsync) {
            if (newtheme.settings && JSON.stringify(newtheme.settings) != localStorage.getItem("extSettings")) {
                localStorage.setItem("extSettings", JSON.stringify(newtheme["settings"]))
                if (extSettings.autoreload) { change = true }
                else {
                    document.body.insertAdjacentHTML("afterend", `<div id="timetableColourToast" class="toast pop success" data-toast="">Settings have changed on another device. Reload to update</div>`);
                    setTimeout(() => { document.getElementById("timetableColourToast").remove(); }, 10000)
                }
            }
        }
        if (extSettings.themesync) {
            if (newtheme.theme && JSON.stringify(newtheme.theme) != localStorage.getItem("timetableTheme")) {
                localStorage.setItem("timetableTheme", JSON.stringify(newtheme.theme))
                if (extSettings.autoreload) { change = true }
                else {
                    document.body.insertAdjacentHTML("afterend", `<div id="timetableColourToast" class="toast pop success" data-toast="">Timetable colours changed on another device. Reload to update</div>`);
                    setTimeout(() => { document.getElementById("timetableColourToast").remove(); }, 10000)
                }
            }
            let defaultTheme = JSON.parse(localStorage.getItem("defaultTheme"))
            let currentTheme = JSON.parse(localStorage.getItem("timetableTheme"))
            for (const subject of Object.keys(defaultTheme)) {
                if (!currentTheme[subject]) {
                    currentTheme[subject] = {color: defaultTheme[subject], image: null, current: "color"}
                    localStorage.setItem("timetableTheme", JSON.stringify(currentTheme))
                }
            }
        }
        await postTheme();
        if (extSettings.autoreload && change) {
            window.location.reload()
        }
        resolve()
    });
}