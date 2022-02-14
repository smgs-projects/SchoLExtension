var regExp = /\(([^)]+)\)/;

window.addEventListener('load', (event) => {
    if (window.location.pathname == "/") {
        MainPage()
    }
});

function MainPage() {
    // Timetable - correct colors to match with actual timetable
    // ~ Desktop timetable colouring
    for (const timetableitem of document.getElementsByClassName("timetable")[0].querySelectorAll("td")) {
        //Blank elements do not have any children so check is here to optomise
        if (timetableitem.children[0].children.length > 0) {
            const classname = timetableitem.getElementsByClassName("timetable-subject")[0].querySelector("div").textContent
            //Regex is here since the string is (classname) so needs to match
            if (!regExp.exec(classname)) continue;
            //Merged classesid is (classname1,classname2) so the split and for loop is here to account for god above 3 merged classes
            const classcodes = regExp.exec(classname)[1].split(",")
            for (const classcode of classcodes) {
                const color = localStorage.getItem(classcode)
                //Timetable for merged classes just show what year you are like year 12 sys and year 11 are merged but it would only show year 12 for a year 12 so the colour can be undefined
                if (!color) { continue; }
                timetableitem.getElementsByClassName("timetable-subject")[0].style.backgroundColor = color
            }
        }
    }
    // ~ Mobile timetable colouring
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
    // ~ Desktop remove blank elements
    var heading = document.getElementsByClassName("timetable")[0].querySelectorAll("th")
    var body = document.getElementsByClassName("timetable")[0].querySelectorAll("td")
    for (let index = 0; index < heading.length; index++) {
        //The two checks here is that Period 5 sport exists, so it cannot all be gotten rid of with a simple does it include period check
        if ((!heading[index].textContent.trim().includes("Period") || heading[index].textContent.trim().includes("Sport"))) {
            //The heading and body are seperate elements if you just remove the body it would shuffle everything down
            heading[index].remove()
            body[index].remove()
        }
        
    }
    // ~ Mobile remove elements
    heading = document.querySelectorAll(".show-for-small-only th")
    body = document.querySelectorAll(".show-for-small-only td")
    for (let index = 0; index < heading.length; index++) {
        if ((!heading[index].textContent.trim().includes("Period") || heading[index].textContent.trim().includes("Sport"))) {
            heading[index].remove()
            body[index].remove()
        }
        
    }
    
    // Timetable (mobile) - Make background white
    document.querySelectorAll(".show-for-small-only").forEach(el => { el.style.backgroundColor = "#FFF"; })
}