// Random SchoL improvements that make it better maybe?™
// by Zac McWilliam and Sebastien Taylor
//         ____
//   _,.-'`_ o `;__,
//    _.-'` '---'  '
//

var regExp = /\(([^)]+)\)/;

// Timetable rows to remove if all blank
const RemoveTimetable = ["Before School", "Before School Sport", "Before School Programs", "Lunch Time Clubs", "Lunch Time Sport", "Period 5 Sport", "After School Clubs", "After School Sport", "After School"]
// Conditions where "Click to view marks" will appear on feedback (uses str.includes())
const ShowFeedbacks = ["(00", "[00", "(01", "[01", "(02", "[02", "(03", "[03", "(04", "[04", "(05", "[05", "(06", "[06", "(12", "[12"];

window.addEventListener('load', async (event) => {
    //Check for when the searchbar is there
    if (document.getElementById("message-list").children[1]) {
        const searchbar = document.createElement('input')
        searchbar.id = "searchbar-Better"
        searchbar.placeholder = "Type to search"
        //Event is key up since keydown does not leave time to register keystrokes yet
        searchbar.addEventListener('keyup', SearchItem);
        document.getElementById("message-list").children[1].appendChild(searchbar)
    }
    if (localStorage.getItem("lastTimetableCache") && localStorage.getItem("lastTimetableCache") < 8.64e+7) {
        localStorage.removeItem("lastTimetableCache")
    }
    //This is called every page in case the cache expires (happens every 1 day)
    await WriteCache()
    AllPages()

    if (window.location.pathname == "/") {
        MainPage()
    }
    if (window.location.pathname.startsWith("/learning/due")) {
        //The delay is due that duework has this weird thing (that no other pages do) where it gets the duework items after serving html
        setInterval(DueWorkColour, 1000)
    }
    if (window.location.pathname.startsWith("/learning/grades")) {
        Feedback()
    }
    if (window.location.pathname.startsWith("/timetable")) {
        Timetable()
    }
    let id = (new URL(document.querySelectorAll("#profile-drop img")[0]?.src)).searchParams.get("id")
    if (window.location.pathname.startsWith("/search/user/") && window.location.pathname.endsWith(id)) {
        ProfilePage()
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

// ~ Called on call pages
async function AllPages() {
    colourSidebar();
    // ~ Change ediary colours
    if (document.getElementsByClassName("fc-list-table")) {
        //Soontm, change ediary colours to the proper colours
        const ediary = document.getElementsByClassName("fc-list-table")
    }
    // ~ Main page due work items
    if (document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0]) {
        //This can be done instantly since it is pregenned
        DisplayColour()
    }
    //This can not so needs to wait a 1s
    else setTimeout(DisplayColour, 1000)
}

function colourSidebar() {
    if (document.getElementById("side-menu-mysubjects")) {
        for (const classtag of document.getElementById("side-menu-mysubjects").querySelectorAll("li")) {
            const atag = classtag.children[0]
            //The parent tag is a part of the children, but it is a div instead of A so this is a way to discrimintae
            if (atag.nodeName === "A") {
                //Uses the link that it leads to, since that is the only way to get it out of the text
                let color = JSON.parse(localStorage.getItem("timetableColours"))[atag.href.split("/")[atag.href.split("/").length - 1]]
                if (color) {
                    atag.style.borderLeft = "7px solid " + color
                    atag.style.backgroundColor = color.replace("rgb", "rgba").replace(")", ", 10%)")
                }
            }
        }
    }
}

function ProfilePage() {
    let tablerows = "";
    let userColours = JSON.parse(localStorage.getItem("timetableColours"))
    for (const subject in userColours) {
        const rgbValue = userColours[subject]
        const hexValue = rgbToHex(...rgbValue.replace(/[^\d\s]/g, '').split(' ').map(Number))
        tablerows += `<tr role="row" class="subject-color-row" style="background-color: ${rgbValue.replace("rgb", "rgba").replace(")", ", 10%)")}; border-left: 7px solid ${rgbValue}">
            <td>${subject}</td>
            <td><input type="color" value="${hexValue}"></td>
            <td style="text-align: center"><a id="colReset" data-target="delete" data-state="closed" class="icon-delete" title="Reset" style="vertical-align: middle; line-height: 40px"></a></td>
        </tr>`
    }

    let contentRow = document.querySelectorAll("#content .row")[3]
    
    contentRow.querySelector("div").classList = "medium-12 large-6 island"
    contentRow.querySelector("div").insertAdjacentHTML("afterbegin", `<h2 class="subheader">Profile</h2>`)
    contentRow.insertAdjacentHTML("beforeend", `<div class="medium-12 large-6 island">
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

            let userColours = JSON.parse(localStorage.getItem("timetableColours"))
            userColours[row.children[0].innerText] = rgbval
            localStorage.setItem("timetableColours", JSON.stringify(userColours))
            UpdateColours();
        })
        // Reset button
        row.children[2].children[0].addEventListener("click", function () {
            let defaultColours = JSON.parse(localStorage.getItem("timetableColoursDefault"))
            const rgbval = defaultColours[row.children[0].innerText]
            row.style.borderLeft = "7px solid " + rgbval
            row.style.backgroundColor = rgbval.replace("rgb", "rgba").replace(")", ", 10%)")
            row.children[1].children[0].value = rgbToHex(...rgbval.replace(/[^\d\s]/g, '').split(' ').map(Number))
            
            let userColours = JSON.parse(localStorage.getItem("timetableColours"))
            userColours[row.children[0].innerText] = rgbval
            localStorage.setItem("timetableColours", JSON.stringify(userColours))
            UpdateColours();
        })
    }
}

function DisplayColour() {
    if (document.getElementById("report_content") || document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0]) {
        let dueworkitems;
        //Due work items can either be these two 
        // ~ Hub page
        if (document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0]) {
            dueworkitems = document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0].querySelectorAll("li")
        }
        // ~ Actual due work page
        else dueworkitems = document.getElementById("report_content").querySelectorAll("li")
        for (const duework of dueworkitems) {
            if (!regExp.exec(duework.querySelector("a:not(.title)").innerText)) continue;
            const classcodes = regExp.exec(duework.querySelector("a:not(.title)").innerText)[1].split(",")
            for (const classcode of classcodes) {
                const color = JSON.parse(localStorage.getItem("timetableColours"))[classcode]
                if (!color) { continue; }
                duework.style.borderLeft = "10px solid " + color
                //RGBA for transperency to be added (too noisy otherwise)
                duework.style.backgroundColor = color.replace("rgb", "rgba").replace(")", ", 10%)")
            }
        }
    }
}
// ~ Get the timetable colours
async function WriteCache() {
    return new Promise((resolve,reject)=>{
        //Needed since the fetch returns string
        var parser = new DOMParser();
        const result = localStorage.getItem("lastTimetableCache")
        let timetableColours = JSON.parse(localStorage.getItem("timetableColours"))
        if (!result || !timetableColours) {
            fetch('/timetable').then(r => r.text()).then(result => {
                if (!timetableColours) { timetableColours = "{}"; }
                timetableColours = JSON.parse(timetableColours)
                let defaultTimetableColours = {}
                const timetable = parser.parseFromString(result, 'text/html')
                for (const classtime of timetable.getElementsByClassName("timetable-subject")) {
                    //Only items with links are loaded here
                    if (classtime.style.backgroundColor && classtime.childNodes[1].nodeName == "A") {
                        const classname = classtime.childNodes[1].href.split("/")[classtime.childNodes[1].href.split("/").length - 1]
                        defaultTimetableColours[classname] = classtime.style.backgroundColor
                    }
                    //Timetables without links are here (EG sport, private periods)
                    else if (classtime.style.backgroundColor && classtime.childNodes[1].nodeName == "DIV") {
                        const classname = regExp.exec(classtime.childNodes[1].textContent.split("\n")[0])[1]
                        defaultTimetableColours[classname] = classtime.style.backgroundColor
                    }
                }
                localStorage.setItem("timetableColoursDefault", JSON.stringify(defaultTimetableColours))
                for (const subject in defaultTimetableColours) {
                    if (!timetableColours[subject]) {
                        timetableColours[subject] = defaultTimetableColours[subject]
                    }
                }
                localStorage.setItem("timetableColours", JSON.stringify(timetableColours))
                localStorage.setItem("lastTimetableCache", Date.now()) // Cache is in unix for recaching
                resolve()
            })
        } else resolve()
    });
}
function DueWorkColour() {

    for (const duework of document.getElementsByClassName("event-container")) {
        //Same reason as #MainPage.js, support for multiple merged classes
        const classcodes = regExp.exec(duework.querySelector("span.fc-event-title").innerText)[1].split(",")
        for (const classcode of classcodes) {
            const color = JSON.parse(localStorage.getItem("timetableColours"))[classcode]
            duework.style.backgroundColor = color
            for (const title of duework.children) {
                //White on the light colours are really hard to read, so black text it is
                title.style.color = "black"
            }
        }
    }

}

function Feedback() {
    // Add "Click to view feedback" button for junior school & Y12 feedback as overall grades do not show
    for (const subject of document.querySelectorAll(".activity-list")) {
        if (!subject.querySelector(".no-margin")) { continue; }
        if (!subject.querySelector(".flex-grade")) { continue; }

        if (ShowFeedbacks.some(w => subject.querySelector(".no-margin").innerText.includes(w))) {
            subject.querySelector(".flex-grade").innerHTML += `<div class="grade gradient-9-bg no-margin"><span>Click to view feedback</span></div>`;
        }
    }
    // Remove grade summary pages for years where there are none to show (Junior school and Yr12)
    const studentYear = parseInt(document.querySelector(".card a p.meta").innerText.replace(/\D/g, ''));
    if (!isNaN(studentYear)) {
        const currentYear = new Date().getFullYear()

        let maxValidYear = currentYear
        let minValidYear = currentYear - (studentYear - 12 + 5)

        if (studentYear <= 6 || studentYear > 12) { maxValidYear += 1; minValidYear = maxValidYear }
        if (studentYear == 12) { maxValidYear -= 1 }
        if (minValidYear < 2021) { minValidYear = 2021 }

        for (summary of document.querySelectorAll("select#context-selector-semester option[value]")) {
            if (summary.innerText.includes("Summary") && !(parseInt(summary.value) >= minValidYear && parseInt(summary.value) <= maxValidYear)) {
                summary.style.display = "none"
            }
        }
    }
    // ~ Add colour to feedback classes
    // ~ Desktop
    for (const subject of document.querySelectorAll(".subject-group")) {
        if (subject.querySelector("span").textContent.trim()) {
            const colour = JSON.parse(localStorage.getItem("timetableColours"))[regExp.exec(subject.querySelector("span").textContent.trim())[1]]
            if (colour) {
                subject.style.borderLeft = "7px solid " + colour
                subject.style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
                subject.parentElement.children[1].style.backgroundColor = colour.replace("rgb", "rgba").replace(")", ", 10%)")
            }
        }
    }
}

function MainPage() {
    // Timetable - correct colors to match with actual timetable
    // ~ Desktop timetable colouring
    for (const timetableitem of document.querySelectorAll(".timetable td")) {
        //Blank elements do not have any children so check is here to optomise
        if (timetableitem.children[0].children.length > 0) {
            const classname = timetableitem.getElementsByClassName("timetable-subject")[0].querySelector("div").textContent
            //Regex is here since the string is (classname) so needs to match
            if (!regExp.exec(classname)) continue;
            //Merged classesid is (classname1,classname2) so the split and for loop is here to account for god above 3 merged classes
            const classcodes = regExp.exec(classname)[1].split(",")
            for (const classcode of classcodes) {
                const color = JSON.parse(localStorage.getItem("timetableColours"))[classcode]
                //Timetable for merged classes just show what year you are like year 12 sys and year 11 are merged but it would only show year 12 for a year 12 so the colour can be undefined
                if (!color) { continue; }
                timetableitem.getElementsByClassName("timetable-subject")[0].style.backgroundColor = color
            }
        }
    }
    // ~ Mobile timetable colouring
    for (const timetableitem of document.querySelectorAll(".show-for-small-only tr")) {
        if (timetableitem.querySelector("td") && timetableitem.querySelector("td").getElementsByClassName("timetable-subject")[0]) {
            const classthing = timetableitem.querySelector("td").getElementsByClassName("timetable-subject")[0]
            const classname = classthing.querySelector("div").textContent
            if (!regExp.exec(classname)) continue;
            const classcodes = regExp.exec(classname)[1].split(",")
            for (const classcode of classcodes) {
                const color = JSON.parse(localStorage.getItem("timetableColours"))[classcode]
                if (!color) { continue; }
                classthing.style.backgroundColor = color
            }
        }
    }

    // Timetable - remove any blank spots such as "After School Sport" if there is nothing there
    // ~ Desktop remove blank elements
    var heading = document.querySelectorAll(".timetable th")
    var body = document.querySelectorAll(".timetable td")
    for (let index = 0; index < heading.length; index++) {
        //The two checks here is that Period 5 sport exists, so it cannot all be gotten rid of with a simple does it include period check
        if (RemoveTimetable.includes(heading[index].textContent.trim().split("\n")[0]) && body[index].querySelectorAll("div").length === 1) {
            //The heading and body are seperate elements if you just remove the body it would shuffle everything down
            heading[index].remove()
            body[index].remove()
        } else if (RemoveTimetable.includes(heading[index].textContent.trim().split("\n")[0])) {

        }
    }
    // ~ Mobile remove elements
    heading = document.querySelectorAll(".show-for-small-only th")
    body = document.querySelectorAll(".show-for-small-only td")
    for (let index = 0; index < heading.length; index++) {
        if (RemoveTimetable.includes(heading[index].textContent.trim().split("\n")[0]) && body[index].querySelectorAll("div").length === 1) {
            //The heading and body are seperate elements if you just remove the body it would shuffle everything down
            heading[index].remove()
            body[index].remove()
        }
    }
    
    // Timetable (mobile) - Make background white
    document.querySelectorAll(".show-for-small-only").forEach(el => { el.style.backgroundColor = "#FFF"; })
}

function Timetable() {
    const rows = document.querySelectorAll(".timetable tbody tr")
    // ~ Removing timetable blank periods
    // ~ 
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
    for (const row of rows) {
        if (RemoveTimetable.some(w => row.querySelector("th").textContent.trim().includes(w))) {
            has_class = false
            for (const cell of row.querySelectorAll("td")) {
                if (cell.innerText !== "\n" && cell.children[0].children.length > 0) { has_class = true; break; }
            }
            if (!has_class) {
                row.style.display = "none";
            }
        }
    }
    // ~ Mobile
    const heading = document.querySelectorAll(".show-for-small-only th")
    const body = document.querySelectorAll(".show-for-small-only td")
    for (let index = 0; index < heading.length; index++) {
        if (RemoveTimetable.some(w => heading[index].textContent.trim().includes(w)) && body[index].querySelectorAll("div").length === 1) {
            //The heading and body are seperate elements if you just remove the body it would shuffle everything down
            heading[index].remove()
            body[index].remove()
        }
    }

    // Recolour timetable subjects based on custom colors
    for (const timetablesubject of document.querySelectorAll(".timetable-subject")) {
        const subjectname = timetablesubject.querySelector("div").innerText
        if (!regExp.exec(subjectname)) continue;
        const subjectcodes = regExp.exec(subjectname)[1].split(",")
        for (const subject of subjectcodes) {
            const colour = JSON.parse(localStorage.getItem("timetableColours"))[subject]
            if (!colour) continue;
            timetablesubject.style.backgroundColor = colour
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
