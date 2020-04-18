var showingOverlay = false;
var showingAllMovies = false
var movies;

isHome = true;


window.onload = () => {
    getUsers().then(() => {
        getMovies();
    });
};

function getLastSeen(code) {
    if (!me.progress[code]) return 0;
    var movie = movies[code];
    if (movie.type != "tv") {
        return me.progress[code].date;
    } else {
        var last = 0;
        for (var i = 0; i < movie.files.length; i++) {
            if (me.progress[code][i])
                if (me.progress[code][i].date > last)
                    last = me.progress[code][i].date;
        }
        return last;
    }
}



function getProgress(code) {

    if (!me.progress[code]) return 0;
    var movie = movies[code];
    if (movie.type != "tv") {
        if (!me.progress[code].progress) return 0
        return me.progress[code].progress;
    } else {
        var progress = 0;
        for (var i = 0; i < movie.files.length; i++) {
            if (me.progress[code][i]) progress += Number(me.progress[code][i].progress);
        }

        return progress / movie.files.length;
    }
}

function getProgressOnEpisode(code, episode) {
    if (!me.progress[code] ||
        !me.progress[code][episode]) return 0;
    return me.progress[code][episode].progress
}

function formatTime(ms) {
    var days = Math.floor(ms / 1000 / 60 / 60 / 24);
    if (days > 0) return days + "d";
    var hours = Math.floor(ms / 1000 / 60 / 60);
    if (hours > 0) return hours + "h";
    var minutes = Math.floor(ms / 1000 / 60);
    if (minutes > 0) return minutes + "m";
    return "0m";
}

function glare(el, over) {
    var glareEl = el.getElementsByClassName("glare")[0]
    var bookmark = el.getElementsByClassName("bookmark-container")[0]
    if (over) {
        glareEl.classList.add("glare-move")
        bookmark.classList.add("bookmark-container-move")
    } else {
        glareEl.classList.remove("glare-move")
        bookmark.classList.remove("bookmark-container-move")
    }
}

function bookmarkHover(el, over) {

}

function bookmark(code) {
    if (!me.progress[code]) me.progress[code] = {}
    me.progress[code].bookmarked = !me.progress[code].bookmarked;
    post("/bookmark", {
        code: code,
        user: localUsername
    })
    loadMovies()

}

function isBookmarked(code) {
    if (me.progress[code] && me.progress[code].bookmarked) return true
    return false;
}


function hasFinished(code) {
    var movie = movies[code]
    if (movie.type == "tv") {
        for (var i = 0; i < movie.files.length; i++) {
            if (!me.progress[code] || !me.progress[code][i] || (me.progress[code][i].minutes_left && me.progress[code][i].minutes_left > 8)) {
                return false;
            }
        }
        return true;
    } else {
        if (!me.progress[code] || !me.progress[code].minutes_left || me.progress[code].minutes_left > 8) return false
        return true
    }
}


function isFresh(code) {
    return (Date.now() - movies[code].added < 1000 * 60 * 60 * 24)
}



function loadMovies() {
    var movieOrder = Object.keys(movies)
    movieOrder.sort();
    movieOrder.sort((a, b) => {
        if (isBookmarked(a) != isBookmarked(b)) return isBookmarked(b) - isBookmarked(a)
        if (hasFinished(a) != hasFinished(b)) return hasFinished(a) - hasFinished(b)
        if (getLastSeen(a) || getLastSeen(b)) {
            if (getLastSeen(a) && getLastSeen(b)) return getLastSeen(b) - getLastSeen(a)
            if (getLastSeen(a)) return -1;
            else return 1
        }
    })

    var freshReleases = []


    var html = "";

    for (var key of movieOrder) {


        let movie = movies[key];

        if (isFresh(movie.code)) freshReleases.push(movie.title)

        if (!showingAllMovies && !isBookmarked(key)) continue

        var progress = getProgress(key)

        var link =
            movie.type != "tv" ?
            '<a href="/watch?id=' +
            movie.code +
            '" target="_blank">' :
            ""

        var link_end = link.length > 0 ? "</a>" : ""



        html +=

            `<div class="movie" id="movie_${movie.code}">
                <div class="poster" onmouseenter="glare(this, true)" onmouseleave="glare(this, false)">
                    <img src="img/glare.png" class="glare">
                    ${link}
                    <img src="posters/${movie.code}.jpg" ${ movie.type=="tv" ?
                    `onclick="openEpisodeChooser('${movie.code}')" ` : "" } class="poster-image" alt="Movie poster" />
                    ${link_end}
                    <div class="movie-progress" style="width:${progress == 1 ? 0 : progress * 100}%;"></div>

                    <div class="bookmark-container" onclick="bookmark('${movie.code}')">
                        ${!isBookmarked(movie.code) ? `
                        <svg class="clip" viewBox="0 0 9 14">
                            <polygon points="0,0 9,0 9,14 4,12 0,14" /> </svg>
                        <svg class="bookmark" viewBox="0 0 24 24">
                            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
                            <path d="M0 0h24v24H0z" fill="none" /></svg>` 
                            : `
                            <svg class="bookmark"  viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
                            `}
                    </div>
                    

                    ${hasFinished(movie.code) ? `<img class="watched" src="img/watched-banner.png">` : ''}
                </div>
            ${link}
                <span class="title" ${ movie.type=="tv" ?
                `onclick="openEpisodeChooser('${movie.code}')" ` : "" } title="${
        movie.hasSubtitles ? " Har undertext" : "Har inte undertext" }">${movie.title}
                    ${
                    movie.hasSubtitles
                    ? `<svg class="cc" fill="white" height="24" viewBox="0 0 24 24" width="24">
                        <path d="M0 0h24v24H0z" fill="none" />
                        <path
                            d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z" />
                    </svg>`
                    : ""
                    } ${isFresh(movie.code) ? `<svg class="cc" fill="white" enable-background="new 0 0 24 24"
                        height="24" viewBox="0 0 24 24" width="24">
                        <g>
                            <rect fill="none" height="24" width="24" x="0" />
                        </g>
                        <g>
                            <g>
                                <g>
                                    <path
                                        d="M20,4H4C2.89,4,2.01,4.89,2.01,6L2,18c0,1.11,0.89,2,2,2h16c1.11,0,2-0.89,2-2V6C22,4.89,21.11,4,20,4z M8.5,15H7.3 l-2.55-3.5V15H3.5V9h1.25l2.5,3.5V9H8.5V15z M13.5,10.26H11v1.12h2.5v1.26H11v1.11h2.5V15h-4V9h4V10.26z M20.5,14 c0,0.55-0.45,1-1,1h-4c-0.55,0-1-0.45-1-1V9h1.25v4.51h1.13V9.99h1.25v3.51h1.12V9h1.25V14z" />
                                </g>
                            </g>
                        </g>
                    </svg>` : ''}
                </span>
            </div>${link_end}`;
    }

    document.getElementById("wrap").innerHTML = html + `<button id='show-all-movies-button' title='Add movies to your library by clicking the bookmark icon' onclick='showAllMovies()'>${showingAllMovies ? "Hide" : "Show"} all movies</button>`;
    document.getElementById("fresh-releases").innerText = freshReleases.length
    document.getElementById("fresh-realeaes-list").title = freshReleases.length > 0 ? 'New movies:\n' + freshReleases.join(",\n") : "No new movies"

}


function getMovies() {
    if (!loggedIn) return;
    document.getElementsByTagName("html")[0].style.cssText = "--user-color: " + me.color;
    document.getElementById("profile-picture").innerText = me.name[0];
    var activeUsers = [];
    for (var user of users) {
        if (user.lastOnline !== null && user.lastOnline < 30) {
            activeUsers.push(user.name);
        }
    }

    document.getElementById("status-text").innerHTML = activeUsers.length.toString() + `<span
            title="${activeUsers.length > 0 ? " Active viewings right now:\n" +
            activeUsers.join(",\n"): "No active viewings right now." }"><svg class="icon${
            activeUsers.length > 0 ? " active" : "" }" viewBox="0 0 24 24">
                <path
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                <path d="M0 0h24v24H0z" fill="none" /></svg>` +
        '</span><span title="Uptime">' +
        formatTime(uptime * 1000) +
        `<svg viewBox="0 0 24 24" class="icon">
                    <path
                        d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg></span>

            <span id="fresh-realeaes-list">
                <span id="fresh-releases">0
                </span>
                <svg class="icon" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24">
                    <g>
                        <rect fill="none" height="24" width="24" x="0" />
                    </g>
                    <g>
                        <g>
                            <g>
                                <path
                                    d="M20,4H4C2.89,4,2.01,4.89,2.01,6L2,18c0,1.11,0.89,2,2,2h16c1.11,0,2-0.89,2-2V6C22,4.89,21.11,4,20,4z M8.5,15H7.3 l-2.55-3.5V15H3.5V9h1.25l2.5,3.5V9H8.5V15z M13.5,10.26H11v1.12h2.5v1.26H11v1.11h2.5V15h-4V9h4V10.26z M20.5,14 c0,0.55-0.45,1-1,1h-4c-0.55,0-1-0.45-1-1V9h1.25v4.51h1.13V9.99h1.25v3.51h1.12V9h1.25V14z" />
                            </g>
                        </g>
                    </g>
                </svg>
            </span>

            `;

    if (loggedIn)
        get("movies").then(data => {
            movies = data;

            loadMovies()
        });
}

function showAllMovies() {
    showingAllMovies = !showingAllMovies
    loadMovies()
}


var lastExpanded;

function expandMovie(code) {
    if (lastExpanded) document.getElementById("movie_" + lastExpanded).style.width = "200px"
    if (lastExpanded == code) {
        lastExpanded = undefined;
        return
    }
    lastExpanded = code;
    document.getElementById("movie_" + code).style.width = "430px"
}



function openEpisodeChooser(code) {
    var html = "";
    var movie = movies[code];

    var latestView = {
        date: 0,
        id: 0
    };
    for (var i = 0; i < movie.files.length; i++) {
        if (me.progress[movie.code] &&
            me.progress[movie.code][i])
            if (me.progress[movie.code][i].date > latestView.date)
                latestView = {
                    date: me.progress[movie.code][i].date,
                    id: i
                };
    }


    if (me.progress[movie.code][latestView.id] &&
        me.progress[movie.code][latestView.id].minutes_left < 5) latestView.id++

    for (var i = 0; i < movie.files.length; i++) {
        var progress = 0;
        if (me.progress[code] &&
            me.progress[code][i]) {
            progress = me.progress[code][i].progress;
        }
        html += `<a
                        href="/watch?id=${movie.code}&e=${i}" ${ latestView.id==i ? 'title="Current episode"' : "" }>
                        <div class="episode">
                            <span class="episode-text">Episode ${i + 1}</span>
                            ${
                            latestView.id == i
                            ? `<svg class="latest-view" viewBox="0 0 24 24">
                                <path d="M0 0h24v24H0z" fill="none" />
                                <path
                                    d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-10 5h-2v-2h2v2zm0-4h-2V7h2v6z" />
                            </svg>`
                            : ""
                            }
                            <div class="episode-progress" style="width:${progress * 100}%;"></div>
                        </div></a>`;
    }

    document.getElementById("overlay").innerHTML = `
                        <div id="episode-chooser">
                            ${html}
                            <button class="cancel-button" onclick="toggleOverlay(false)">Back</button>
                        </div>`;

    toggleOverlay(true);
}

function login(name) {
    loggedIn = true;
    localUsername = name;
    localStorage.setItem("user", name);
    toggleOverlay(false);
    getUsers().then(() => {
        getMovies();
    });
}

function addUser() {
    var name = prompt("Enter a name");
    if (name) {
        post("/user", {
            name
        }).then(res => {
            if (res.success) getUsers();
            else alert(res.reason);
        });
    }
}

function switchUser() {
    getUsers().then(() => {
        toggleOverlay(true);
        localStorage.removeItem("user");
        localUsername = false;
        loggedIn = false;
    });
}

function toggleOverlay(show = undefined) {
    var display = false;
    if (show) display = true;
    else if (show === false) display = false;
    else show = !showingOverlay;

    document.getElementById("overlay").style.display = show ? "block" : "none";
    showingOverlay = show;
}