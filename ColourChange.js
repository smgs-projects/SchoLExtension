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

window.addEventListener('load', (event) => {
    let id;
    if (document.getElementById("profile-drop")) {
        id = document.getElementById("profile-drop").querySelector("img").src.split("=")[1].split("&")[0]
    }
    if (document.location.pathname.split("/")[1] === "search" && document.location.pathname.split("/")[document.location.pathname.split("/").length-1] === id) {
        ProfilePage()
    }
})
function ProfilePage() {
    let tablerows = "";
    for (const key of Object.keys(localStorage)) {
        const rgbValue = localStorage.getItem(key)
        const hexValue = rgbToHex(...rgbValue.replace(/[^\d\s]/g, '').split(' ').map(Number))
        if (key !== "cache-Colour") {
            tablerows += `<tr role="row" class="subject-color-row" style="background-color: ${rgbValue.replace("rgb", "rgba").replace(")", ", 10%)")}; border-left: 7px solid ${rgbValue}">
                <td>${key}</td>
                <td colspan="2"><input type="color" value="${hexValue}"></td>
            </tr>`
        }
    }

    document.getElementById("content").innerHTML += `<div class="row">
        <div class="medium-12 large-6 island">
            <h2 class="subheader">Timetable Colours</h2>
            <table class="dataTable no-footer" role="grid">
                <thead>
                    <tr role="row">
                        <th rowspan="1" colspan="1" style="width: 1000px">Subject</th>
                        <th rowspan="1" colspan="1" style="width: 200px">Pick Colour</th>
                        <th rowspan="1" colspan="1"><a id="colReset" data-target="delete" data-state="closed" class="icon-delete" title="Reset" style="vertical-align: middle; line-height: 40px"></a></th>
                    </tr>
                </thead>
                <tbody>${tablerows}</tbody>
            </table>
        </div>
    </div>`;

    document.getElementById("colReset").addEventListener("click", ResetColours)

    for (const row of document.querySelectorAll(".subject-color-row")) {
        // Colour picker input
        row.children[1].children[0].addEventListener("change", function(e) {
            const rgbval = "rgb(" + hexToRgb(e.target.value) + ")" 
            row.style.borderLeft = "7px solid " + rgbval
            row.style.backgroundColor = rgbval.replace("rgb", "rgba").replace(")", ", 10%)")
            localStorage.setItem(row.children[0].innerText, rgbval)
            UpdateColours();
            console.log(row, rgbval)
            console.log(e.target.value)
        })
    }
}
async function ResetColours() {
    localStorage.removeItem("cache-Colour")
    await WriteCache()
    window.location.reload()
}

function UpdateColours() {
    if (document.getElementById("side-menu-mysubjects")) {
        for (const classtag of document.getElementById("side-menu-mysubjects").querySelectorAll("li")) {
            const atag = classtag.children[0]
            //The parent tag is a part of the children, but it is a div instead of A so this is a way to discrimintae
            if (atag.nodeName === "A") {
                //Uses the link that it leads to, since that is the only way to get it out of the text
                let color = localStorage.getItem(atag.href.split("/")[atag.href.split("/").length - 1])
                if (color) {
                    atag.style.borderLeft = "7px solid " + color
                    atag.style.backgroundColor = color.replace("rgb", "rgba").replace(")", ", 10%)")
                }
            }
        }
    }
}

async function WriteCache() {
    //Needed since the fetch returns string
    var parser = new DOMParser();
    const result = localStorage.getItem('cache-Colour')
    if (!result) {
        fetch('/timetable').then(r => r.text()).then(result => {
            const timetable = parser.parseFromString(result, 'text/html')
            for (const classtime of timetable.getElementsByClassName("timetable-subject")) {
                //Only items with links are loaded here
                if (classtime.style.backgroundColor && classtime.childNodes[1].nodeName == "A") {
                    const classname = classtime.childNodes[1].href.split("/")[classtime.childNodes[1].href.split("/").length - 1]
                    localStorage.setItem(classname, classtime.style.backgroundColor)
                }
                //Timetables without links are here (EG sport, private periods)
                else if (classtime.style.backgroundColor && classtime.childNodes[1].nodeName == "DIV") {
                    const classname = regExp.exec(classtime.childNodes[1].textContent.split("\n")[0])[1]
                    localStorage.setItem(classname, classtime.style.backgroundColor)
                }
            }
            //Cache is in unix for recaching
            localStorage.setItem("cache-Colour", Date.now())
        })
        
    }
    //Async so other things do not try to access colours before this is done
    return "done"
}