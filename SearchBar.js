const searchbar = document.createElement('input')
searchbar.id="searchbar-Better"
searchbar.placeholder="Type to search"
searchbar.addEventListener('keyup', SearchItem);
document.getElementById("message-list").children[1].appendChild(searchbar)
function SearchItem() {
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