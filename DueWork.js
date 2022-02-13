import {WriteCache} from "WriteCache.js"
window.onload = function () {
    var parser = new DOMParser();
    var regExp = /\(([^)]+)\)/;
    if (window.location.href.split("/")[4] == "due") {
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
        await WriteCache()
        setInterval(AfterLoad, 1000)
    }
}