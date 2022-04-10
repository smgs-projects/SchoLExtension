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
    extSettings = Object.assign({}, extSettings, JSON.parse(localStorage.getItem("extSettings")))

    //Check for when the searchbar is there
    if (document.getElementById("message-list").children[1]) {
        const searchbar = document.createElement('input')
        searchbar.id = "searchbar-Better"
        searchbar.placeholder = "Type to search"
        searchbar.addEventListener('keyup', SearchItem);
        document.getElementById("message-list").children[1].appendChild(searchbar)
    }
    // Cache management
    if (localStorage.getItem("lastTimetableCache") && localStorage.getItem("lastTimetableCache") < 8.64e+7) {
        localStorage.removeItem("lastTimetableCache")
    }
    await writeCache()

    allPages()
    if (window.location.pathname == "/") {
        mainPage()
    }
    if (window.location.pathname == "/learning/classes") {
        classPage()
    }
    if (window.location.pathname.startsWith("/calendar")) {
        setInterval(eDiary, 500)
    }
    if (window.location.pathname.startsWith("/learning/due")) {
        setInterval(dueWork, 500)
    }
    if (window.location.pathname.startsWith("/learning/grades")) {
        feedback()
    }
    if (window.location.pathname.startsWith("/learning/assessments/") && !window.location.pathname.endsWith("/modify")) {
        assessments()
    }
    if (window.location.pathname.startsWith("/timetable")) {
        timetable()
    }
    if (window.location.pathname.startsWith("/search/user/") && window.location.pathname.endsWith(schoolboxUser.id)) {
        await profilePage()
    }

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
    return {
        copy: copy
    };
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
        let colour = JSON.parse(localStorage.getItem("timetableColours"))[subjectlink.href.split("/")[subjectlink.href.split("/").length - 1]]
        if (!colour) continue
        subjectlink.style.borderLeft = "7px solid " + colour
        subjectlink.style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
    }
}

function colourDuework() {
    if (extSettings.colourduework) {
        let dueworkitems = document.querySelectorAll(".Schoolbox_Learning_Component_Dashboard_UpcomingWorkController li")
        if (!dueworkitems.length) { dueworkitems = document.querySelectorAll("#report_content li") }
        
        for (const duework of dueworkitems) {
            const subjects = REGEXP.exec(duework.querySelector("a:not(.title)").innerText)[1]?.split(",")
            for (const subject of subjects) {
                const colour = JSON.parse(localStorage.getItem("timetableColours"))[subject]
                if (!colour) continue;
                duework.style.borderLeft = "10px solid " + colour
                //RGBA for transperency to be added (too noisy otherwise)
                duework.style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
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
            const colour = JSON.parse(localStorage.getItem("timetableColours"))[subjectcode]
            if (!colour) { continue; }
            const textcol = getTextColor(rgbToHex(...colour.replace(/[^\d\s]/g, '').split(' ').map(Number)).toUpperCase())
            subject.parentNode.style.backgroundColor = colour
            subject.parentNode.style.color = textcol
            subject.parentNode.querySelectorAll("*:not(a)").forEach(e => { e.style.color = textcol })

            if (textcol != "#000000") subject.parentNode.querySelectorAll("a").forEach(e => e.style.color = "#b0e1ff" )

        }
    }
}
function classPage() {
    const cards = document.querySelectorAll("div.v-card")
    for (const card of cards) {
        for (const name of card.querySelector("p.meta").innerText.split("\n")[0].split(",")) {
            const colour = JSON.parse(localStorage.getItem("timetableColours"))[name]
            if (colour) {
                card.querySelector("div.card-class-image").style.borderBottom = `10px solid ${colour}`
            }
            else continue;
        }
    }
}
async function profilePage() {
    let tablerows = "";
    let usercolors = JSON.parse(localStorage.getItem("timetableColours"))
    for (const subject in usercolors) {
        const rgbvalue = usercolors[subject]
        const hexvalue = rgbToHex(...rgbvalue.replace(/[^\d\s]/g, '').split(' ').map(Number))
        tablerows += `<tr role="row" class="subject-color-row" style="background-color: ${rgbvalue.replace("rgb", "rgba").replace(")", ", 10%)")}; border-left: 7px solid ${rgbvalue}">
            <td>${subject}</td>
            <td><input type="color" value="${hexvalue}"></td>
            <td style="text-align: center"><a id="colReset" data-target="delete" data-state="closed" class="icon-refresh" title="Reset" style="vertical-align: middle; line-height: 40px"></a></td>
        </tr>`
    }
    if (Object.keys(usercolors).length < 1) {
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

    let contentrow = document.querySelectorAll("#content .row")
    if (!contentrow[3]) { contentrow = contentrow[1] } else { contentrow = contentrow[3] }
    
    contentrow.querySelector("div").classList = "medium-12 large-6 island"
    contentrow.querySelector("div").insertAdjacentHTML("afterbegin", `<h2 class="subheader">Profile</h2>`)
    contentrow.insertAdjacentHTML("beforeend", `<div class="medium-12 large-6 island">
            <h2 class="subheader">Timetable Colours</h2>
            <table class="dataTable no-footer" role="grid">
                <thead>
                    <tr role="row">
                        <th style="width: 1000px">Subject</th>
                        <th style="width: 200px">Pick Colour</th>
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
                    <div class="small-12 columns">
                        <p>Export your current theme to share it with friends!</p>
                    </div>
                    <div class="small-12 columns">
                        <div class="input-group">
                            <input type="text" id="currenttheme" readonly>
                            <a class="button" id="exportbtn">Export</a>
                        </div>
                    </div>
                    <div class="small-12 columns">
                        <p>Or choose a premade theme!</p>
                    </div>
                    <div class="small-12 columns">
                    <select id="context-selector-themes">
                        ${themeoptions}
                    </select>
                    </div>
                    
                </fieldset>
                <fieldset class="content">
                    <legend><strong>Settings</strong></legend>
                    <div class="small-12 columns">
                        <table class="no-margin">
                            <tbody>
                                <tr>
                                    <td>
                                        <label for="toggle_themesync">Theme Syncronisation<p>Sync timetable themes between devices</p></label>
                                    </td>
                                    <td>
                                        <div class="long switch no-margin" style="float: right">
                                            <input id="toggle_themesync" type="checkbox" name="toggle_themesync" value="1" checked>
                                            <label for="toggle_themesync">
                                                <span>Enabled</span>
                                                <span>Disabled</span>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <label for="toggle_settingsync">Setting Syncronisation<p>Sync settings between devices</p></label>
                                    </td>
                                    <td>
                                        <div class="long switch no-margin" style="float: right">
                                            <input id="toggle_settingsync" type="checkbox" name="toggle_settingsync" value="1" checked>
                                            <label for="toggle_settingsync">
                                                <span>Enabled</span>
                                                <span>Disabled</span>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <label for="toggle_autoreload">Auto Reload<p>Automatically reload the page when your theme changes on another device</p></label>
                                    </td>
                                    <td>
                                        <div class="long switch no-margin" style="float: right">
                                            <input id="toggle_autoreload" type="checkbox" name="toggle_autoreload" value="0">
                                            <label for="toggle_autoreload">
                                                <span>Enabled</span>
                                                <span>Disabled</span>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <label for="toggle_colourduework">Coloured Due Work<p>Add colours to due work items based on the timetable</p></label>
                                    </td>
                                    <td>
                                        <div class="long switch no-margin" style="float: right">
                                            <input id="toggle_colourduework" type="checkbox" name="toggle_colourduework" value="1" checked>
                                            <label for="toggle_colourduework">
                                                <span>Enabled</span>
                                                <span>Disabled</span>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <label for="toggle_compacttimetable">Compact Timetable<p>Remove empty items/rows from the timetable on the dashboard and timetable page</p></label>
                                    </td>
                                    <td>
                                        <div class="long switch no-margin" style="float: right">
                                            <input id="toggle_compacttimetable" type="checkbox" name="toggle_compacttimetable" value="1" checked>
                                            <label for="toggle_compacttimetable">
                                                <span>Enabled</span>
                                                <span>Disabled</span>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="border: 0px">
                                        <label for="toggle_deadnameremover">Dead Name Remover<p>Allows replacement all instances of dead names across the site (Client side per account only)</p></label>
                                    </td>
                                    <td style="border: 0px">
                                        <div class="long switch no-margin" style="float: right">
                                            <input id="toggle_deadnameremover" type="checkbox" name="toggle_deadnameremover" value="0">
                                            <label for="toggle_deadnameremover">
                                                <span>Enabled</span>
                                                <span>Disabled</span>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </fieldset>
                <fieldset class="content" id="deadnameremover" style="display: none">
                    <legend><strong>Dead Name Remover</strong></legend>
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

    
    let toggle_themesync = document.getElementById("toggle_themesync")
    let toggle_autoreload = document.getElementById("toggle_autoreload")
    let toggle_colourduework = document.getElementById("toggle_colourduework")
    let toggle_compacttimetable = document.getElementById("toggle_compacttimetable")
    let toggle_settingsync = document.getElementById("toggle_settingsync")
    let toggle_deadnameremover = document.getElementById("toggle_deadnameremover")

    let elem_settingsreset = document.getElementById("settingsreset")
    let elem_deadnameremover = document.getElementById("deadnameremover")
    
    if (!localStorage.getItem("extSettings")) { localStorage.setItem("extSettings", JSON.stringify(extSettings)); }

    if (extSettings.themesync) { toggle_themesync.setAttribute("checked", 1) } 
    else { toggle_themesync.removeAttribute("checked", 1) };

    if (extSettings.settingsync) { toggle_settingsync.setAttribute("checked", 1) } 
    else { toggle_settingsync.removeAttribute("checked", 1) };

    if (extSettings.autoreload) { toggle_autoreload.setAttribute("checked", 1) } 
    else { toggle_autoreload.removeAttribute("checked", 1) };
    
    if (extSettings.colourduework) { toggle_colourduework.setAttribute("checked", 1) } 
    else { toggle_colourduework.removeAttribute("checked", 1) };
    
    if (extSettings.compacttimetable) { toggle_compacttimetable.setAttribute("checked", 1) } 
    else { toggle_compacttimetable.removeAttribute("checked", 1) };

    if (extSettings.deadnameremover.enabled) { toggle_deadnameremover.setAttribute("checked", 1) } 
    else { toggle_deadnameremover.removeAttribute("checked", 1) };
    
    toggle_themesync.addEventListener("change", async function () {
        extSettings["themesync"] = toggle_themesync.checked;
        localStorage.setItem("extSettings", JSON.stringify(extSettings))
        await postTheme();
    })
    toggle_autoreload.addEventListener("change", async function () {
        extSettings["autoreload"] = toggle_autoreload.checked;
        localStorage.setItem("extSettings", JSON.stringify(extSettings))
        await postTheme();
    })
    toggle_colourduework.addEventListener("change", async function () {
        extSettings["colourduework"] = toggle_colourduework.checked;
        localStorage.setItem("extSettings",JSON.stringify( extSettings))
        await postTheme();
    })
    toggle_compacttimetable.addEventListener("change", async function () {
        extSettings["compacttimetable"] = toggle_compacttimetable.checked;
        localStorage.setItem("extSettings", JSON.stringify(extSettings))
        await postTheme();
    })
    toggle_settingsync.addEventListener("change", async function () {
        extSettings["settingsync"] = toggle_settingsync.checked;
        localStorage.setItem("extSettings", JSON.stringify(extSettings))
        await postTheme();
    })
    toggle_deadnameremover.addEventListener("change", async function () {
        elem_deadnameremover.style.display = toggle_deadnameremover.checked ? "" : "none"
        extSettings.deadnameremover.enabled = toggle_deadnameremover.checked
        localStorage.setItem("extSettings", JSON.stringify(extSettings))
        await postTheme();
    })
    elem_settingsreset.addEventListener("click", async function () {
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
    elem_deadnameremover.style.display = toggle_deadnameremover.checked ? "" : "none"
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
        elem_currenttheme.value = Object.values(JSON.parse(localStorage["timetableColours"])).map((e) => { 
            return rgbToHex(...e.replace(/[^\d\s]/g, '').split(' ').map(Number)) }
        ).join("-").replaceAll("#", "").toUpperCase()
    }
    updateThemeExport();
    
    for (const row of document.querySelectorAll(".subject-color-row")) {
        // Colour picker input
        if (!row.children[1]) continue;
        row.children[1].children[0].addEventListener("change", async function(e) {
            const rgbval = "rgb(" + hexToRgb(e.target.value) + ")" 
            row.style.borderLeft = "7px solid " + rgbval
            row.style.backgroundColor = rgbval.replace("rgb", "rgba").replace(")", ", 10%)")

            let usercols = JSON.parse(localStorage.getItem("timetableColours"))
            usercols[row.children[0].innerText] = rgbval
            localStorage.setItem("timetableColours", JSON.stringify(usercols))
            colourSidebar();
            updateThemeExport();
            await postTheme();
        })
        // Reset button
        row.children[2].children[0].addEventListener("click", async function () {
            let defaultColours = JSON.parse(localStorage.getItem("timetableColoursDefault"))
            const rgbval = defaultColours[row.children[0].innerText]
            row.style.borderLeft = "7px solid " + rgbval
            row.style.backgroundColor = rgbval.replace("rgb", "rgba").replace(")", ", 10%)")
            row.children[1].children[0].value = rgbToHex(...rgbval.replace(/[^\d\s]/g, '').split(' ').map(Number))
            
            let usercols = JSON.parse(localStorage.getItem("timetableColours"))
            usercols[row.children[0].innerText] = rgbval
            localStorage.setItem("timetableColours", JSON.stringify(usercols))
            colourSidebar();
            updateThemeExport();
            await postTheme();
        })
    }
    elem_themeselector.addEventListener("change", async function(evt){
        localStorage.removeItem("themeCode")
        let newtheme = evt.target.value.split("-")
        let currenttheme = JSON.parse(localStorage.getItem("timetableColoursDefault"))
        let i = 0
        for (subjectcode in currenttheme) {
            currenttheme[subjectcode] = "rgb(" + hexToRgb(newtheme[i]) + ")"
            i++; if (i >= newtheme.length) { i = 0; }
        }
        localStorage.setItem("timetableColours", JSON.stringify(currenttheme))
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
        let currenttheme = JSON.parse(localStorage.getItem("timetableColoursDefault"))
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
            currenttheme[subjectcode] = newtheme[i]
            i++; if (i >= newtheme.length) { i = 0; }
        }
        localStorage.setItem("timetableColours", JSON.stringify(currenttheme))
        await postTheme();
        window.location.reload()
    })
    elem_themereset.addEventListener("click", async function () {
        if (!confirm("Theme Reset: This will reset all your theme colours back to original, are you sure you want to do this?")) return;
        localStorage.removeItem("themeCode") 
        localStorage.removeItem("timetableColours")
        localStorage.removeItem("defaultTimetableColours")
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
            const colour = JSON.parse(localStorage.getItem("timetableColours"))[subject]
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
        const colour = JSON.parse(localStorage.getItem("timetableColours"))[subjectcode[1]]
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
            subject.querySelector(".flex-grade").innerHTML += `<div class="grade gradient-9-bg no-margin"><span>Click to view feedback</span></div>`;
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
        if (REGEXP.exec(subjectrawcodes)[1]) {
            const subjectcodes = REGEXP.exec(subjectrawcodes)[1]?.split(",")
            for (const subjectcode of subjectcodes) {
                const colour = JSON.parse(localStorage.getItem("timetableColours"))[subjectcode]
                if (!colour) { continue; }
                subject.style.borderLeft = "7px solid " + colour
                subject.style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
                subject.children[1].style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
            }
        }
    }
}
function assessments() {
    let matches = document.querySelector(".breadcrumb")?.innerText.match(REGEXP);
    let matches2 = document.querySelector(".breadcrumb")?.innerText.match(REGEXP2);    
    let match = matches ? matches[0] : matches2[0];

    if (7 <= parseInt(match.slice(1, 3)) && parseInt(match.slice(1, 3)) <= 11) {
        const rows = document.querySelectorAll(".row");
        rows[rows.length - 1].insertAdjacentHTML("beforeend", `<div class="small-12 island">
            <section style="text-align: center;">
                <img src="${ACHIEVEMENT_IMG}">
            </section>
        </div>`)
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
            const colour = JSON.parse(localStorage.getItem("timetableColours"))[subjectcode[1]]
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
            const colour = JSON.parse(localStorage.getItem("timetableColours"))[subjectcode[1]]
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
    if (extSettings.compacttimetable) {
        const rows = document.querySelectorAll(".timetable tbody tr")
        // Removing timetable blank periods
        // ~ Desktop
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

function SearchItem() {
    const searchbar = document.getElementById("searchbar-Better")
    //Make sure that the event does not always run/filtering so that only if they are typing in the search bar
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
}

// ~ Get the timetable colours
async function writeCache() {
    return new Promise (( resolve ) => {
        //Needed since the fetch returns string
        if (schoolboxUser.id != localStorage.getItem("lastUser")) {
            localStorage.removeItem("timetableColours");
            localStorage.removeItem("lastTimetableCache");
            localStorage.removeItem("extSettings");
            localStorage.removeItem("userToken");
            localStorage.removeItem("lastUser");
        }
        var parser = new DOMParser();
        let timetablecolours = JSON.parse(localStorage.getItem("timetableColours"))
        if (!localStorage.getItem("lastTimetableCache") || !timetablecolours) {
            remoteAuth();
            fetch('/timetable').then(r => r.text()).then(result => {
                if (!timetablecolours) { timetablecolours = {}; }
                let defaulttimetablecolours = {}
                const timetable = parser.parseFromString(result, 'text/html')
                for (const subject of timetable.querySelectorAll(".timetable-subject[style*='background-color'] div")) {
                    if (!REGEXP.exec(subject.innerText)) continue
                    defaulttimetablecolours[REGEXP.exec(subject.innerText)[1]] = subject.parentNode.style.backgroundColor
                }
                localStorage.setItem("timetableColoursDefault", JSON.stringify(defaulttimetablecolours))
                for (const subject in defaulttimetablecolours) {
                    if (!timetablecolours[subject]) {
                        timetablecolours[subject] = defaulttimetablecolours[subject]
                    }
                }
                localStorage.setItem("timetableColours", JSON.stringify(timetablecolours))
                localStorage.setItem("lastTimetableCache", Date.now()) // For recaching
                localStorage.setItem("lastUser", schoolboxUser.id) // For recaching if user switch
                resolve()
            })
        } else resolve()
    });
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
        let extSettings = JSON.parse(localStorage.getItem("extSettings"))
        const body = {"settings": false,"defaultTheme": false, "theme" : false, "sbu" : schoolboxUser}
        if (extSettings?.themesync === true || typeof(extSettings?.themesync) == "undefined") {
            body["theme"] = JSON.parse(localStorage.getItem("timetableColours"))
            body["defaultTheme"] = JSON.parse(localStorage.getItem("timetableColoursDefault"))
        }
        if (extSettings?.settingsync === true || typeof(extSettings?.settingsync) == "undefined") {
            body["settings"] = JSON.parse(localStorage.getItem("extSettings"))
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
            if (newtheme.theme && JSON.stringify(newtheme.theme) != localStorage.getItem("timetableColours")) {
                localStorage.setItem("timetableColours", JSON.stringify(newtheme.theme))
                if (extSettings.autoreload) { change = true }
                else {
                    document.body.insertAdjacentHTML("afterend", `<div id="timetableColourToast" class="toast pop success" data-toast="">Timetable colours changed on another device. Reload to update</div>`);
                    setTimeout(() => { document.getElementById("timetableColourToast").remove(); }, 10000)
                }
            }
            let defaultTheme = JSON.parse(localStorage.getItem("timetableColoursDefault"))
            let currentTheme = JSON.parse(localStorage.getItem("timetableColours"))
            for (const subject of Object.keys(defaultTheme)) {
                if (!currentTheme[subject]) {
                    currentTheme[subject] = defaultTheme[subject]
                    localStorage.setItem("timetableColours", JSON.stringify(currentTheme))
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