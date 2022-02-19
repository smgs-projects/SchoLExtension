window.addEventListener('load', (event) => {
    let id;
    if (document.getElementById("profile-drop")) {
        id = document.getElementById("profile-drop").querySelector("img").src.split("=")[1].split("&")[0]
    }
    if (document.location.pathname.split("/")[1] === "search" && document.location.pathname.split("/")[document.location.pathname.split("/").length-1] === id) {
        ProfilePage()
    }
})
function ProfilePage() {
    let parentelement = document.createElement("div");
    parentelement.classList.add("row")
    parentelement.innerHTML = "<div class='row'>    <div class='small-12 columns'>        <h2 class='subheader' id='accordion'>Class Colours</h2>        <dl class='accordion' id='accordion-main-content' data-accordion=''>        </dl>    </div></div>"
    for (const key of Object.keys(localStorage)) {
        const value = localStorage.getItem(key)
        if (key !== "cache-Colour") {
            const classColourAccordian = document.createElement("dd")
            classColourAccordian.innerHTML = `<a href='#panel${key}' style='background-color: ${value}' aria-expanded='false'>${key}</a><div id='panel${key}' class="content"><input type='search' id='panelinput${key}' placeholder='${value}'></div>`
            classColourAccordian.querySelector("input").addEventListener('search', UpdateLocalStorage, classColourAccordian.querySelector("input"));
            classColourAccordian.classList.add("accordion-navigation")
            classColourAccordian.style.backgroundColor = value;
            parentelement.querySelector("dl").appendChild(classColourAccordian)
        }
    }
    document.getElementById("content").appendChild(parentelement)
}
function UpdateColours() {
    for (const tag of document.getElementById("accordion-main-content").querySelectorAll("a")) {
        tag.style.backgroundColor = localStorage.getItem(tag.textContent)
    }
    AllPages()
}
function UpdateLocalStorage(item) {
    const colour = item.target.value
    const classname = item.target.id.split("panelinput")[1]
    localStorage.setItem(classname, colour)
    UpdateColours()
}