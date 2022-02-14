const searchbar = document.createElement('input')
searchbar.id = "searchbar-Better"
searchbar.placeholder = "Type to search"
//Event is key up since keydown does not leave time to register keystrokes yet
searchbar.addEventListener('keyup', SearchItem);
document.getElementById("message-list").children[1].appendChild(searchbar)
function SearchItem() {
    const searchbar = document.getElementById("searchbar-Better")
    //Make sure that the event does not always run/filtering so that only if they are typing in the search bar
    if (document.activeElement === searchbar) {
        const text = searchbar.value.toLowerCase();
        const notifications = document.getElementById("msg-content").querySelectorAll("li")
        for (const notif of notifications) {
            //Check if text contains other text, it is index since contains/includes did not work at that moment
            if (notif.textContent.toLocaleLowerCase().trim().indexOf(text) == -1) {
                notif.style.display = "none";
            }
            else {
                //To allow filter clearing
                notif.style.display = "block";
            }
        }
    }
}