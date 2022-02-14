var regExp = /\(([^)]+)\)/;
async function AllPages() {
    await WriteCache()
    if (document.getElementsByClassName("fc-list-table")) {
        const ediary = document.getElementsByClassName("fc-list-table")
    }
    if (document.getElementById("side-menu-mysubjects")) {
        for (const classtag of document.getElementById("side-menu-mysubjects").querySelectorAll("li")) {
            const atag = classtag.children[0]
            if (atag.nodeName === "A") {
                let color = localStorage.getItem(atag.href.split("/")[atag.href.split("/").length-1])
                if (color) {
                    atag.style.borderLeft = "7px solid " + color
                    atag.style.backgroundColor = color.replace("rgb", "rgba").replace(")", ", 10%)")
                }
            }
        }
    }
    if (document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0]) {
        DisplayColour()
    }
    else setTimeout(DisplayColour, 1000)
    if (document.getElementsByClassName("timetable") && window.location.href == "https://learning.stmichaels.vic.edu.au/" || document.getElementsByClassName("timetable") && window.location.href == "https://learning.stmichaels.vic.edu.au/#") {
        for (const timetableitem of document.getElementsByClassName("timetable")[0].querySelectorAll("td")) {
            if (timetableitem.children[0].children.length > 0) {
                const classname = timetableitem.getElementsByClassName("timetable-subject")[0].querySelector("div").textContent
                if (!regExp.exec(classname)) continue;
                const classcodes = regExp.exec(classname)[1].split(",")
                for (const classcode of classcodes) {
                    const color = localStorage.getItem(classcode)
                    if (!color) { continue; }
                    timetableitem.getElementsByClassName("timetable-subject")[0].style.backgroundColor = color
                }
            }
        }
        for (const timetableitem of document.getElementsByClassName("show-for-small-only")[0].querySelectorAll("tr")) {
            if (timetableitem.querySelector("td").getElementsByClassName("timetable-subject")[0]) {
                const classthing = timetableitem.querySelector("td").getElementsByClassName("timetable-subject")[0]
                const classname = classthing.querySelector("div").textContent
                if (!regExp.exec(classname)) continue;
                const classcodes = regExp.exec(classname)[1].split(",")
                for (const classcode of classcodes) {
                    const color = localStorage.getItem(classcode)
                    if (!color) { continue; }
                    classthing.style.backgroundColor = color
                }
            }
            else {
                timetableitem.remove()
            }
        }
        const heading = document.getElementsByClassName("timetable")[0].querySelectorAll("th")
        const body = document.getElementsByClassName("timetable")[0].querySelectorAll("td")
        for (let index = 0; index < heading.length; index++) {
            if (!heading[index].textContent.trim().includes("Period") && body[index].children[0].children.length === 0 || heading[index].textContent.trim().includes("Sport") && body[index].children[0].children.length === 0) {
                console.log(1)
                heading[index].remove()
                body[index].remove()
            }
            
        }
    }
}

function DisplayColour() {
    if (document.getElementById("report_content") || document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0]) {
        let dueworkitems;
        if (document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0]) {
            dueworkitems = document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0].querySelectorAll("li")
        }
        else dueworkitems = document.getElementById("report_content").querySelectorAll("li")
        for (const duework of dueworkitems) {
            if (!regExp.exec(duework.querySelector("a:not(.title)").innerText)) continue;
            const classcodes = regExp.exec(duework.querySelector("a:not(.title)").innerText)[1].split(",")
            for (const classcode of classcodes) {
                const color = localStorage.getItem(classcode)
                if (!color) { continue; }
                duework.style.borderLeft = "10px solid " + color
                duework.style.backgroundColor = color.replace("rgb", "rgba").replace(")", ", 10%)")
            }
        }
    }
}
AllPages()
async function WriteCache() {
    const result = localStorage.getItem('cache')
    if (!result) {
        fetch('https://learning.stmichaels.vic.edu.au/timetable').then(r => r.text()).then(result => {
            const timetable = parser.parseFromString(result, 'text/html')
            let classnames = []
            for (const classtime of timetable.getElementsByClassName("timetable-subject")) {
                if (classtime.style.backgroundColor && classtime.childNodes[1].nodeName == "A") {
                    const classname = classtime.childNodes[1].href.split("/")[classtime.childNodes[1].href.split("/").length-1]
                    localStorage.setItem(classname, classtime.style.backgroundColor)
                    classnames.push(classname)
                }
            }
            localStorage.setItem("cacheClasses", [...new Set(classnames)])
            localStorage.setItem("cache", Date.now())
        })
    }
    return "done"
}