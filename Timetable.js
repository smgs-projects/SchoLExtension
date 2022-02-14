window.addEventListener('load', (event) => {
    if (window.location.pathname.startsWith("/timetable")) {
        Timetable()
    }
});

function Timetable() {
    const rows = document.querySelectorAll(".timetable tbody tr")
    // ~ Removing timetable blank periods
    // ~ Desktop
    for (const row of rows) {
        if ((!row.querySelector("th").textContent.trim().includes("Period") || row.querySelector("th").textContent.trim().includes("Sport"))) {
            has_class = false
            for (const cell of row.querySelectorAll("td")) {
                if (cell.innerText !== "\n") { has_class = true; break; }
            }
            if (!has_class) {
                row.style.display = "none";
            }
        }
    }
    // ~ Mobile
    const heading = document.querySelectorAll(".show-for-small-only th")
    const body = document.querySelectorAll(".show-for-small-only td")

    for (let index = 0; index < heading.length; index++) {
        if ((!heading[index].textContent.trim().includes("Period") || heading[index].textContent.trim().includes("Sport")) && body[index].innerText == "\n") {
            //Two elements are interconnected on mobile
            heading[index].remove()
            body[index].remove()
        }
        
    }
}