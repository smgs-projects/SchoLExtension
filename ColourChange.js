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

window.addEventListener('load', async (event) => {
    await WriteCache()
    let id;
    if (document.getElementById("profile-drop")) {
        id = document.getElementById("profile-drop").querySelector("img").src.split("=")[1].split("&")[0]
    }
    if (document.location.pathname.split("/")[1] === "search" && document.location.pathname.split("/")[document.location.pathname.split("/").length-1] === id) {
        ProfilePage()
    }
}, false);

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

    document.getElementById("content").innerHTML += `<div class="row">
        <div class="medium-12 large-6 island">
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
        </div>
    </div>`;

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

function UpdateColours() {
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