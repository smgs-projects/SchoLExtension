window.onload = function () {
    if (localStorage.getItem("cache") && localStorage.getItem("cache") > 8.64e+7) {
        localStorage.removeItem("cache")
    }
    AllPages()
}

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
}

function DisplayColour() {
    var regExp = /\(([^)]+)\)/;
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

async function WriteCache() {
    var parser = new DOMParser();
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
