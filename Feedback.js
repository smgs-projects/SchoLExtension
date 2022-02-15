window.addEventListener('load', (event) => {
    if (window.location.pathname.startsWith("/learning/grades")) {
        Feedback()
    }
});

function Feedback() {
    // Add "Click to view marks" button for junior school & Y12 feedback as overall grades do not show
    for (const subject of document.querySelectorAll(".activity-list")) {
        if (!subject.querySelector(".no-margin")) { continue; }
        if (!subject.querySelector(".flex-grade")) { continue; }
    
        if (["(00", "[00", "(01", "[01", "(02", "[02", "(03", "[03", "(04", "[04", "(05", "[05", "(06", "[06", "(12", "[12"].some(w => subject.querySelector(".no-margin").innerText.startsWith(w))) {
            subject.querySelector(".flex-grade").innerHTML += `<div class="grade gradient-9-bg no-margin"><span>Click to view marks</span></div>`;
        }
  }
}