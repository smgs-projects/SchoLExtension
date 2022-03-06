// Random SchoL improvements that make it better maybe?™
// by Zac McWilliam and Sebastien Taylor
//         ____
//   _,.-'`_ o `;__,
//    _.-'` '---'  '
//

// Regex to find timetable codes inside a class string e.g. "12 PHYSICS 01 (12SC-PHYSI01)" -> "12SC-PHYSI01"
const REGEXP = /\(([^)]+)\)/;
// Timetable rows to remove if all blank
const REMOVE_TIMETABLE = ["Before School", "Before School Sport", "Before School Programs", "Lunch Time Clubs", "Lunch Time Sport", "Period 5 Sport", "After School Clubs", "After School Sport", "After School"]
// Conditions where "Click to view marks" will appear on feedback (uses str.includes())
const SHOW_FEEDBACKS = ["(00", "[00", "(01", "[01", "(02", "[02", "(03", "[03", "(04", "[04", "(05", "[05", "(06", "[06", "(12", "[12"];
let id;
window.addEventListener('load', async (event) => {
    //Check for when the searchbar is there
    if (document.getElementById("message-list").children[1]) {
        const searchbar = document.createElement('input')
        searchbar.id = "searchbar-Better"
        searchbar.placeholder = "Type to search"
        searchbar.addEventListener('keyup', SearchItem);
        document.getElementById("message-list").children[1].appendChild(searchbar)
    }
    if (localStorage.getItem("lastTimetableCache") && localStorage.getItem("lastTimetableCache") < 8.64e+7) {
        localStorage.removeItem("lastTimetableCache")
    }
    //This is called every page in case the cache expires (happens every 1 day)
    id = (new URL(document.querySelectorAll("#profile-drop img")[0]?.src)).searchParams.get("id")
    await writeCache()
    allPages()

    if (window.location.pathname == "/") {
        mainPage()
    }
    if (window.location.pathname.startsWith("/learning/due")) {
        setInterval(colourDueworkCalendar, 1000)
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
}, false);

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

async function allPages() {
    colourSidebar();
    colourTimetable();
    colourDuework()
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
    for (const subject of document.querySelectorAll(".timetable-subject[style*='background-color'] div, .show-for-small-only tr td .timetable-subject div")) {
        if (!REGEXP.exec(subject.textContent)) continue;
        const subjectcodes = REGEXP.exec(subject.innerText)[1].split(",")
        for (const subjectcode of subjectcodes) {
            const colour = JSON.parse(localStorage.getItem("timetableColours"))[subjectcode]
            if (!colour) { continue; }
            subject.parentNode.style.backgroundColor = colour
        }
    }
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
        </div>`)

    for (const row of document.querySelectorAll(".subject-color-row")) {
        // Colour picker input
        row.children[1].children[0].addEventListener("change", function(e) {
            const rgbval = "rgb(" + hexToRgb(e.target.value) + ")" 
            row.style.borderLeft = "7px solid " + rgbval
            row.style.backgroundColor = rgbval.replace("rgb", "rgba").replace(")", ", 10%)")

            let usercols = JSON.parse(localStorage.getItem("timetableColours"))
            usercols[row.children[0].innerText] = rgbval
            localStorage.setItem("timetableColours", JSON.stringify(usercols))
            colourSidebar();
        })
        // Reset button
        row.children[2].children[0].addEventListener("click", function () {
            let defaultColours = JSON.parse(localStorage.getItem("timetableColoursDefault"))
            const rgbval = defaultColours[row.children[0].innerText]
            row.style.borderLeft = "7px solid " + rgbval
            row.style.backgroundColor = rgbval.replace("rgb", "rgba").replace(")", ", 10%)")
            row.children[1].children[0].value = rgbToHex(...rgbval.replace(/[^\d\s]/g, '').split(' ').map(Number))
            
            let usercols = JSON.parse(localStorage.getItem("timetableColours"))
            usercols[row.children[0].innerText] = rgbval
            localStorage.setItem("timetableColours", JSON.stringify(usercols))
            colourSidebar();
        })
    }
}

function colourDueworkCalendar() {
    for (const duework of document.querySelectorAll(".event-container span.fc-event-title")) {
        const subjects = REGEXP.exec(duework.innerText)[1]?.split(",")
        if (!subjects) continue
        for (const subject of subjects) {
            const colour = JSON.parse(localStorage.getItem("timetableColours"))[subject]
            duework.parentNode.style.backgroundColor = colour
            for (const title of duework.parentNode.children) {
                //White on the light colours are really hard to read, so black text it is
                title.style.color = "black"
            }
        }
    }
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
        if (REGEXP.exec(subject.innerText)[1]) {
            const colour = JSON.parse(localStorage.getItem("timetableColours"))[REGEXP.exec(subject.innerText)[1]]
            if (!colour) continue
            subject.style.borderLeft = "7px solid " + colour
            subject.style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
            subject.parentElement.children[1].style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
        }
    }
}

function mainPage() {
    // Timetable - remove any blank spots such as "After School Sport" if there is nothing there
    // ~ Desktop
    var heading = document.querySelectorAll(".timetable th")
    var body = document.querySelectorAll(".timetable td")
    for (let index = 0; index < heading.length; index++) {
        if (REMOVE_TIMETABLE.includes(heading[index].textContent.trim().split("\n")[0]) && body[index].querySelectorAll("div").length === 1) {
            //The heading and body are seperate elements if you just remove the body it would shuffle everything down
            heading[index].remove()
            body[index].remove()
        } else if (REMOVE_TIMETABLE.includes(heading[index].textContent.trim().split("\n")[0])) {

        }
    }
    // ~ Mobile
    heading = document.querySelectorAll(".show-for-small-only th")
    body = document.querySelectorAll(".show-for-small-only td")
    for (let index = 0; index < heading.length; index++) {
        if (REMOVE_TIMETABLE.includes(heading[index].textContent.trim().split("\n")[0]) && body[index].querySelectorAll("div").length === 1) {
            //The heading and body are seperate elements if you just remove the body it would shuffle everything down
            heading[index].remove()
            body[index].remove()
        }
    }
    
    // Timetable (mobile) - Make background white
    document.querySelectorAll(".show-for-small-only").forEach(el => { el.style.backgroundColor = "#FFF"; })
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
                if (timetablesubjectsnew[index].textContent.trim().split("\n")[0] === timetablesubjectsold[index].textContent.trim().split("\n")[0]) {
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
        if (REMOVE_TIMETABLE.some(w => row.querySelector("th").textContent.trim().includes(w))) {
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
        if (REMOVE_TIMETABLE.some(w => heading[index].textContent.trim().includes(w)) && body[index].querySelectorAll("div").length === 1) {
            //The heading and body are seperate elements if you just remove the body it would shuffle everything down
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
        var parser = new DOMParser();
        const result = localStorage.getItem("lastTimetableCache")
        let timetablecolours = JSON.parse(localStorage.getItem("timetableColours"))
        let recacheUser = false
        if(id !== localStorage.getItem("lastUser")) {
            recacheUser = true
        }
        if (!result || !timetablecolours || recacheUser) {
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