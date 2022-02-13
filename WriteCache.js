export async function WriteCache() {
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