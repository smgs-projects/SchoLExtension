window.onload = function () {
    if (window.location.pathname.startsWith("/learning/due")) {
        //The delay is due that duework has this weird thing (that no other pages do) where it gets the duework items after serving html
        setInterval(DueWork, 1000)
    }
}


function DueWork() {
    var regExp = /\(([^)]+)\)/;
    for (const duework of document.getElementsByClassName("event-container")) {
        //Same reason as #MainPage.js, support for multiple merged classes
        const classcodes = regExp.exec(duework.querySelector("span.fc-event-title").innerText)[1].split(",")
        for (const classcode of classcodes) {
            const color = localStorage.getItem(classcode)
            duework.style.backgroundColor = color
            for (const title of duework.children) {
                //White on the light colours are really hard to read, so black text it is
                title.style.color = "black"
            }
        }
    }
}