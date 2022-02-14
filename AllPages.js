window.onload = function () {
    if (localStorage.getItem("cache") && localStorage.getItem("cache") > 8.64e+7) {
        localStorage.removeItem("cache")
    }
    AllPages()
}
// ~ Called on call pages
async function AllPages() {
    //This is called every page in case the cache expires (happens every 1 day)
    await WriteCache()
    // ~ Change ediary colours
    if (document.getElementsByClassName("fc-list-table")) {
        //Soontm, change ediary colours to the proper colours
        const ediary = document.getElementsByClassName("fc-list-table")
    }
    // ~ change side bar to have colours!
    if (document.getElementById("side-menu-mysubjects")) {
        for (const classtag of document.getElementById("side-menu-mysubjects").querySelectorAll("li")) {
            const atag = classtag.children[0]
            //The parent tag is a part of the children, but it is a div instead of A so this is a way to discrimintae
            if (atag.nodeName === "A") {
                //Uses the link that it leads to, since that is the only way to get it out of the text
                let color = localStorage.getItem(atag.href.split("/")[atag.href.split("/").length-1])
                if (color) {
                    atag.style.borderLeft = "7px solid " + color
                    atag.style.backgroundColor = color.replace("rgb", "rgba").replace(")", ", 10%)")
                }
            }
        }
    }
    // ~ Main page due work items
    if (document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0]) {
        //This can be done instantly since it is pregenned
        DisplayColour()
    }
    //This is not so needs to wait a 1s
    else setTimeout(DisplayColour, 1000)
}

function DisplayColour() {
    var regExp = /\(([^)]+)\)/;
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
                const color = localStorage.getItem(classcode)
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
    //Needed since the fetch returns string
    var parser = new DOMParser();
    const result = localStorage.getItem('cache')
    if (result) {
        fetch('https://learning.stmichaels.vic.edu.au/timetable').then(r => r.text()).then(result => {
            const timetable = parser.parseFromString(result, 'text/html')
            for (const classtime of timetable.getElementsByClassName("timetable-subject")) {
                //Only items with links are loaded here
                if (classtime.style.backgroundColor && classtime.childNodes[1].nodeName == "A") {
                    const classname = classtime.childNodes[1].href.split("/")[classtime.childNodes[1].href.split("/").length-1]
                    localStorage.setItem(classname, classtime.style.backgroundColor)
                }
                //Timetables without links are here (EG sport, private periods)
                else if (classtime.style.backgroundColor && classtime.childNodes[1].nodeName == "DIV") {
                    const classname = regExp.exec(classtime.childNodes[1].textContent.split("\n")[0])[1]
                    localStorage.setItem(classname, classtime.style.backgroundColor)
                }
            }
            //Cache is in unix for recaching
            localStorage.setItem("cache", Date.now())
        })
    }
    //Async so other things do not try to access colours before this is done
    return "done"
}
