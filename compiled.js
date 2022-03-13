// Random SchoL improvements that make it better maybe?™
// by Zac McWilliam and Sebastien Taylor
//         ____
//   _,.-'`_ o `;__,
//    _.-'` '---'  '
//

// Regex to find timetable codes inside a class string e.g. "12 PHYSICS 01 (12SC-PHYSI01)" -> "12SC-PHYSI01"
const REGEXP = /\(([^)]+)\)/;
// Timetable rows NOT to remove if all blank
const TIMETABLE_WHITELIST = ["Period 1", "Period 2", "Period 3", "Period 4", "Period 5"]
// Conditions where "Click to view marks" will appear on feedback (uses str.includes())
const SHOW_FEEDBACKS = ["(00", "[00", "(01", "[01", "(02", "[02", "(03", "[03", "(04", "[04", "(05", "[05", "(06", "[06", "(12", "[12"];
// Theme API location
const THEME_API = "https://rcja.app:3000"

let id;
window.addEventListener('load', async (event) => {
    // if (localStorage.getItem("disableQOL") != undefined) return; // Allow disabling of QOL features (mainly for testing)

    // Search bar
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
    id = (new URL(document.querySelectorAll("#profile-drop img")[0]?.src)).searchParams.get("id")
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
        setInterval(colourDueworkCalendar, 500)
    }
    if (window.location.pathname.startsWith("/learning/grades")) {
        feedback()
    }
    if (window.location.pathname.startsWith("/timetable")) {
        timetable()
    }
    if (window.location.pathname.startsWith("/search/user/") && window.location.pathname.endsWith(id)) {
        profilePage()
    }

    // Theme management
    if (localStorage.getItem("themeCode")) {
        const newtheme = await getTheme();

        if (newtheme && newtheme.type == "user") { 
            if (JSON.stringify(newtheme.theme) != localStorage.getItem("timetableColours")) {
                localStorage.setItem("timetableColours", JSON.stringify(newtheme.theme))
                document.body.insertAdjacentHTML("afterend", `<div id="timetableColourToast" class="toast pop success" data-toast="">Timetable colours changed on another device. Reload to update</div>`);
                setTimeout(() => { document.getElementById("timetableColourToast").remove(); }, 10000)
            }
        }
    }
}, false);

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
    colourSidebar();
    colourTimetable();
    colourDuework();
    setTimeout(colourDuework, 1000) // Some pages require extra loading time
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
    // const text = document.querySelectorAll("div.card-content")
}
function profilePage() {
    let tablerows = "";
    let usercolors = JSON.parse(localStorage.getItem("timetableColours"))
    for (const subject in usercolors) {
        const rgbvalue = usercolors[subject]
        const hexvalue = rgbToHex(...rgbvalue.replace(/[^\d\s]/g, '').split(' ').map(Number))
        tablerows += `<tr role="row" class="subject-color-row" style="background-color: ${rgbvalue.replace("rgb", "rgba").replace(")", ", 10%)")}; border-left: 7px solid ${rgbvalue}">
            <td>${subject}</td>
            <td><input type="color" value="${hexvalue}"></td>
            <td style="text-align: center"><a id="colReset" data-target="delete" data-state="closed" class="icon-delete" title="Reset" style="vertical-align: middle; line-height: 40px"></a></td>
        </tr>`
    }
    if (Object.keys(usercolors).length < 1) {
        tablerows += `<tr role="row" class="subject-color-row">
            <td colspan="3">There are no timetable subjects associated with your account</td>
        </tr>`
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
                        <p>Import a theme (list of hex codes seperated by dashes), this also supports URLs from <a href="https://coolors.co/d9ed92-b5e48c-99d98c-76c893-52b69a-34a0a4-168aad-1a759f-1e6091-184e77">coolors.co</a></p>
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
                </fieldset>
                <fieldset class="content">
                    <legend><strong>Device Sync: <span style="color: #ff7d7d" id="syncstatus">OFF</span></strong></legend>
                    <div class="small-12 columns">
                        <p>You can generate a <code>Sync Code</code> to share theme colours between devices</p>
                    </div>
                    <div class="small-12 columns">
                        <div class="input-group">
                            <input type="text" id="synccode" placeholder="There is no sync code associated with this device, enter one here!">
                            <a class="button disabled" id="updatesynccode">Update</a>
                        </div>
                    </div>
                    <div class="small-12 columns">
                        <p class="meta"><strong>Note:</strong> Sharing this code with others will allow them to edit your theme</p>
                    </div>
                </fieldset>
                <div class="component-action">
                    <section>
                        <a class="button" id="gensynccode">Generate new sync code</a>
                        <a class="button" style="color: #ff5555;" data-reveal-id="themereset-modal">Reset</a>
                        <div data-reveal id="themereset-modal" class="reveal-modal small">
                            <h2>Reset Timetable Theme</h2>
                            <p>This will reset all your theme colours back to original, are you sure you want to do this?</p> 
                            <ul class="flex-list buttons">
                                <li><a class="button" style="background-color: #ffbfbf; color: #f44;" id="themereset">Reset Theme</a></li>
                                <li><a class="button" id="modalclosebtn">Cancel</a></li>
                            </ul> 
                            <a aria-label="Close" class="close-reveal-modal">×</a>
                        </div>
                    </section>
                </div>
            </section>
        </div>`)

    let elem_synccode = document.getElementById("synccode")
    let elem_gensynccode = document.getElementById("gensynccode")
    let elem_syncstatus = document.getElementById("syncstatus")
    let elem_updatesynccode = document.getElementById("updatesynccode")
    let elem_themereset = document.getElementById("themereset")
    let elem_currenttheme = document.getElementById("currenttheme")
    let elem_importtext = document.getElementById("importtext")
    let elem_modalclosebtn = document.getElementById("modalclosebtn")
    let elem_importbtn = document.getElementById("importbtn")
    let elem_exportbtn = document.getElementById("exportbtn")

    function updateThemeExport() {
        elem_currenttheme.value = Object.values(JSON.parse(localStorage["timetableColours"])).map((e) => { 
            return rgbToHex(...e.replace(/[^\d\s]/g, '').split(' ').map(Number)) }
        ).join("-").replaceAll("#", "")
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

    elem_modalclosebtn.addEventListener("click", function () {
        elem_modalclosebtn.removeAttribute("aria-hidden")
        elem_modalclosebtn.removeAttribute("tab-index")
        document.getElementById("themereset-modal").classList = "reveal-modal small"
        document.getElementById("themereset-modal").style = ""
        document.querySelector(".reveal-modal-bg").remove()
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
    elem_gensynccode.addEventListener("click", async function () {
        const newcode = await genThemeCode()
        elem_synccode.value = newcode.toUpperCase()
        elem_syncstatus.innerText = "ON"
        elem_syncstatus.style.color = "green"
        elem_updatesynccode.classList = "button disabled"
        localStorage.setItem("themeCode", newcode.toUpperCase())
        await postTheme()
    })
    elem_themereset.addEventListener("click", async function () {
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
    elem_synccode.addEventListener("keyup", function () {
        if (elem_synccode.value != localStorage.getItem("themeCode")) {
            elem_updatesynccode.classList = "button"
        } else {
            elem_updatesynccode.classList = "button disabled"
        }
    })

    elem_updatesynccode.addEventListener("click", async function () {
        if (elem_synccode.value == localStorage.getItem("themeCode")) { return }
        
        if (elem_synccode.value == "") { 
            localStorage.removeItem("themeCode") 
            elem_updatesynccode.classList = "button disabled"
            elem_syncstatus.innerText = "OFF"
            elem_syncstatus.style.color = "#ff7d7d"
        } else {
            const newtheme = await getTheme(elem_synccode.value)
            if (!newtheme) {
                elem_synccode.parentElement.insertAdjacentHTML("afterend", `<div data-alert class="alert-box alert themecodealert"><strong>Invalid Theme Code:</strong> Ensure you have entered a valid theme code</div>`)
                setTimeout(function () {
                    document.querySelector(".themecodealert")?.remove()
                }, 3000)
                return
            }
            
            localStorage.setItem("themeCode", elem_synccode.value)
            elem_syncstatus.innerText = "ON"
            elem_syncstatus.style.color = "green"
            elem_updatesynccode.classList = "button disabled"
            if (newtheme.type == "user") {
                localStorage.setItem("timetableColours", JSON.stringify(newtheme.theme))
                window.location.reload()
            } else {
                let currenttheme = JSON.parse(localStorage.getItem("timetableColoursDefault"))
                let i = 0
                for (subjectcode in currenttheme) {
                    currenttheme[subjectcode] = newtheme.theme[i]
                    i++; if (i >= newtheme.theme.length) { i = 0; }
                }
                localStorage.setItem("timetableColours", JSON.stringify(currenttheme))
                window.location.reload()
            }
        }
    })

    if (localStorage.getItem("themeCode")) {    
        elem_synccode.value = localStorage.getItem("themeCode")
        elem_syncstatus.innerText = "ON"
        elem_syncstatus.style.color = "green"
        elem_updatesynccode.classList = "button disabled"
    }
}

function colourDueworkCalendar() {
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
        const subjectcode = REGEXP.exec(event.querySelector(".fc-event-title").innerText)
        if (!subjectcode) return; 
        const colour = JSON.parse(localStorage.getItem("timetableColours"))[subjectcode[1]]
        if (!colour) return; 
        event.querySelector(".fc-list-event-dot").style.borderColor = colour
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
function eDiary() {
    const page = document.querySelector(".fc-button-group .fc-button-active").innerText

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
    } else if (page == "List") {
        colourEDiaryList()
    } else {
        document.querySelectorAll(".fc-timegrid-event").forEach(event => {
            const subjectcode = REGEXP.exec(event.innerText)
            if (!subjectcode) return; 
            const colour = JSON.parse(localStorage.getItem("timetableColours"))[subjectcode[1]]
            if (!colour) return; 
            const textcol = getTextColor(rgbToHex(...colour.replace(/[^\d\s]/g, '').split(' ').map(Number)).toUpperCase())
            event.style.backgroundColor = colour
            event.querySelectorAll("*").forEach(e => { e.style.color = textcol })
        })
    }
}

function mainPage() {
    // Timetable - remove any blank spots such as "After School Sport" if there is nothing there
    const heading = document.querySelectorAll(".timetable th, .show-for-small-only th")
    const body = document.querySelectorAll(".timetable td, .show-for-small-only td")
    for (let index = 0; index < heading.length; index++) {
        if (!TIMETABLE_WHITELIST.includes(heading[index].childNodes[0].textContent.trim()) && !body[index].textContent.trim()) {
            heading[index].remove()
            body[index].remove()
        }
    }
    
    // Timetable (mobile) - Make background white
    document.querySelectorAll(".show-for-small-only").forEach(el => { el.style.backgroundColor = "#FFF"; })

    // eDiary list recolour
    if (document.querySelectorAll(".fc-list-event").length == 0) setTimeout(mainPage, 100);
    colourEDiaryList()
}

function timetable() {
    const rows = document.querySelectorAll(".timetable tbody tr")
    // Remove duplicate periods in a column
    let i = 0
    let itemremoves = []
    for (const row of rows) {
        if (rows[i - 1]) {
            let timetablesubjectsnew = row.getElementsByClassName("timetable-subject")
            let timetablesubjectsold = rows[i - 1].getElementsByClassName("timetable-subject")
            for (let index = 0; index < timetablesubjectsnew.length; index++) {
                if (timetablesubjectsnew[index].isEqualNode(timetablesubjectsold[index])) {
                    itemremoves.push(timetablesubjectsnew[index])
                }
            }
        }
        i++
    }
    for (const item of itemremoves) {
        item.remove()
    }
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
        if (id !== localStorage.getItem("lastUser")) {
            localStorage.removeItem("timetableColours");
            localStorage.removeItem("lastTimetableCache");
            localStorage.removeItem("lastUser");
        }
        var parser = new DOMParser();
        const result = localStorage.getItem("lastTimetableCache")
        let timetablecolours = JSON.parse(localStorage.getItem("timetableColours"))
        if (!result || !timetablecolours) {
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
                localStorage.setItem("lastUser", id) // For recaching if user switch
                resolve()
            })
        } else resolve()
    });
}

async function genThemeCode() {
    return new Promise (( resolve ) => {
        fetch(THEME_API + "/gencode").then(r => r.json()).then(result => {
            resolve(result["code"])
        })
    });
}

async function getTheme(themeCode) {
    return new Promise (( resolve ) => {
        if (!localStorage.getItem("themeCode") && !themeCode) { resolve(false) }
        fetch(THEME_API + "/theme/" + (!themeCode ? localStorage.getItem("themeCode") : themeCode)).then(r => r.json()).then(result => {
            resolve(result)
        })
        .catch((error) => {
            resolve(false)
        });
    });
}

async function postTheme() {
    return new Promise (( resolve ) => {
        const themecode = localStorage.getItem("themeCode")
        fetch(THEME_API + "/theme/" + themecode.toUpperCase(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({"theme" : JSON.parse(localStorage.getItem("timetableColours"))})
        }).then(r => { resolve() })
    });
}
