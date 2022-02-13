var parser = new DOMParser();
var regExp = /\(([^)]+)\)/;
async function OnLoad() {
    if (window.location.href.split("/")[4] == "due") {
        await WriteCache()
        setInterval(AfterLoad, 1000)
    }
}
OnLoad()
async function WriteCache() {
    const result = localStorage.getItem('cache')
    if (!result) {
        fetch('https://learning.stmichaels.vic.edu.au/timetable').then(r => r.text()).then(result => {
            const timetable = parser.parseFromString(result, 'text/html')
            for (const classtime of timetable.getElementsByClassName("timetable-subject")) {
                if (classtime.style.backgroundColor && classtime.childNodes[1].nodeName == "A") {
                    const classname = classtime.childNodes[1].href.split("/")[classtime.childNodes[1].href.split("/").length-1]
                    localStorage.setItem(classname, classtime.style.backgroundColor)
                }
            }
            localStorage.setItem("cache", true)
        })
    }
    return "done"
}
function AfterLoad() {
    for (const duework of document.getElementsByClassName("event-container")) {
        const classcodes = regExp.exec(duework.querySelector("span.fc-event-title").innerText)[1].split(",")
        for (const classcode of classcodes) {
            const color = localStorage.getItem(classcode)
            duework.style.backgroundColor = color
            for (const title of duework.children) {
                title.style.color = "black"
            }
        }
    }
}