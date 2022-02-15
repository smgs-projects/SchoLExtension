// Random SchoL improvements that make it better maybe?™
// by Zac McWilliam and Sebastien Taylor
//         ____
//   _,.-'`_ o `;__,
//    _.-'` '---'  '
//

var regExp = /\(([^)]+)\)/;

window.addEventListener('load', (event) => {
    if (localStorage.getItem("cache") && localStorage.getItem("cache") > 8.64e+7) {
        localStorage.removeItem("cache")
    }
    AllPages()

    if (window.location.pathname.startsWith("/learning/due")) {
        //The delay is due that duework has this weird thing (that no other pages do) where it gets the duework items after serving html
        setInterval(DueWork, 1000)
    }

    if (window.location.pathname.startsWith("/learning/grades")) {
        Feedback()
    }

    if (window.location.pathname == "/") {
        MainPage()
    }
    
    if (window.location.pathname.startsWith("/timetable")) {
        Timetable()
    }
});
  
// ~ Called on call pages
async function AllPages() {
    //This is called every page in case the cache expires (happens every 1 day)
    await WriteCache()
    // ~ Change ediary colours
    if (document.getElementsByClassName("fc-list-table")) {
        //Soontm, change ediary colours to the proper colours
        const ediary = document.getElementsByClassName("fc-list-table")
    }
    // ~ change side bar to have colours!
    if (document.getElementById("side-menu-mysubjects")) {
        for (const classtag of document.getElementById("side-menu-mysubjects").querySelectorAll("li")) {
            const atag = classtag.children[0]
            //The parent tag is a part of the children, but it is a div instead of A so this is a way to discrimintae
            if (atag.nodeName === "A") {
                //Uses the link that it leads to, since that is the only way to get it out of the text
                let color = localStorage.getItem(atag.href.split("/")[atag.href.split("/").length-1])
                if (color) {
                    atag.style.borderLeft = "7px solid " + color
                    atag.style.backgroundColor = color.replace("rgb", "rgba").replace(")", ", 10%)")
                }
            }
        }
    }
    // ~ Main page due work items
    if (document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0]) {
        //This can be done instantly since it is pregenned
        DisplayColour()
    }
    //This can not so needs to wait a 1s
    else setTimeout(DisplayColour, 1000)
}

function DisplayColour() {
    if (document.getElementById("report_content") || document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0]) {
        let dueworkitems;
        //Due work items can either be these two 
        // ~ Hub page
        if (document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0]) {
            dueworkitems = document.getElementsByClassName("Schoolbox_Learning_Component_Dashboard_UpcomingWorkController")[0].querySelectorAll("li")
        }
        // ~ Actual due work page
        else dueworkitems = document.getElementById("report_content").querySelectorAll("li")
        for (const duework of dueworkitems) {
            if (!regExp.exec(duework.querySelector("a:not(.title)").innerText)) continue;
            const classcodes = regExp.exec(duework.querySelector("a:not(.title)").innerText)[1].split(",")
            for (const classcode of classcodes) {
                const color = localStorage.getItem(classcode)
                if (!color) { continue; }
                duework.style.borderLeft = "10px solid " + color
                //RGBA for transperency to be added (too noisy otherwise)
                duework.style.backgroundColor = color.replace("rgb", "rgba").replace(")", ", 10%)")
            }
        }
    }
}
// ~ Get the timetable colours
async function WriteCache() {
    //Needed since the fetch returns string
    var parser = new DOMParser();
    const result = localStorage.getItem('cache')
    if (!result) {
        fetch('/timetable').then(r => r.text()).then(result => {
            const timetable = parser.parseFromString(result, 'text/html')
            for (const classtime of timetable.getElementsByClassName("timetable-subject")) {
                //Only items with links are loaded here
                if (classtime.style.backgroundColor && classtime.childNodes[1].nodeName == "A") {
                    const classname = classtime.childNodes[1].href.split("/")[classtime.childNodes[1].href.split("/").length-1]
                    localStorage.setItem(classname, classtime.style.backgroundColor)
                }
                //Timetables without links are here (EG sport, private periods)
                else if (classtime.style.backgroundColor && classtime.childNodes[1].nodeName == "DIV") {
                    const classname = regExp.exec(classtime.childNodes[1].textContent.split("\n")[0])[1]
                    localStorage.setItem(classname, classtime.style.backgroundColor)
                }
            }
            //Cache is in unix for recaching
            localStorage.setItem("cache", Date.now())
        })
    }
    //Async so other things do not try to access colours before this is done
    return "done"
}

function DueWork() {
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

function Feedback() {
    // Add "Click to view marks" button for junior school & Y12 feedback as overall grades do not show
    for (const subject of document.querySelectorAll(".activity-list")) {
        if (!subject.querySelector(".no-margin")) { continue; }
        if (!subject.querySelector(".flex-grade")) { continue; }
    
        if (["00 ", "01 ", "02 ", "03 ", "04 ", "05 ", "06 ", "12 "].some(w => subject.querySelector(".no-margin").innerText.includes(w))) {
            subject.querySelector(".flex-grade").innerHTML += `<div class="grade gradient-9-bg no-margin"><span>Click to view marks</span></div>`;
        }
    }
}

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
    console.log(timetableitem)  
    if (timetableitem.querySelector("td") && timetableitem.querySelector("td").getElementsByClassName("timetable-subject")[0]) {
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