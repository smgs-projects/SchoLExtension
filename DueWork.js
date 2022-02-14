window.onload = function () {
    if (window.location.pathname.startsWith("/learning/due")) {
        setInterval(AfterLoad, 1000)
    }
}

function DueWork() {
    var regExp = /\(([^)]+)\)/;
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