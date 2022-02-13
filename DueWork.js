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
        function WriteCache() {
            const result = localStorage.getItem('cache')
            if (!result && !result["cache"]) {
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
        }
        
        setInterval(AfterLoad, 1000)
        WriteCache()
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
    const searchbar = document.createElement('input')
    searchbar.type="search"
    searchbar.id="searchbar-Better"
    document.addEventListener('keydown', SearchItem);
    document.getElementById("message-list").children[1].appendChild(searchbar)
    function SearchItem() {
        console.log(1)
        const searchbar = document.getElementById("searchbar-Better")
        if(document.activeElement === searchbar) {
            const text = searchbar.value.toLowerCase();
            const notifications = document.getElementById("msg-content").querySelectorAll("li")
            for (const notif of notifications) {
                if (notif.textContent.toLocaleLowerCase().trim().indexOf(text) == -1) {
                    notif.style.display = "none";
                }
                else {
                    notif.style.display = "block";
                }
            }
        }
    }
    if (document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0]) {
        DisplayColour()
    }
    else setTimeout(DisplayColour, 1000)
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
}