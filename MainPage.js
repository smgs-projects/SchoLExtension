window.onload = function () {
    if (window.location.pathname == "/") {
        MainPage()
    }
}

function MainPage() {
    var regExp = /\(([^)]+)\)/;
    // Timetable - correct colors to match with actual timetable
    // ~ Desktop
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
    // ~ Mobile
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
    }
    
    // Timetable - remove any blank spots such as "After School Sport" if there is nothing there
    // ~ Desktop
    var heading = document.getElementsByClassName("timetable")[0].querySelectorAll("th")
    var body = document.getElementsByClassName("timetable")[0].querySelectorAll("td")
    for (let index = 0; index < heading.length; index++) {
        if ((!heading[index].textContent.trim().includes("Period") || heading[index].textContent.trim().includes("Sport")) && body[index].innerText == "\n") {
            heading[index].remove()
            body[index].remove()
        }
        
    }
    // ~ Mobile
    heading = document.querySelectorAll(".show-for-small-only th")
    body = document.querySelectorAll(".show-for-small-only td")
    for (let index = 0; index < heading.length; index++) {
        if ((!heading[index].textContent.trim().includes("Period") || heading[index].textContent.trim().includes("Sport")) && body[index].innerText == "\n") {
            heading[index].remove()
            body[index].remove()
        }
        
    }
    
    // Timetable (mobile) - Make background white
    document.querySelectorAll(".show-for-small-only").forEach(el => { el.style.backgroundColor = "#FFF"; })
}