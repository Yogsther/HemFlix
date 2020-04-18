var url = new URL(location.href);
var movie = url.searchParams.get("id");
var episode = url.searchParams.get("e");

var player = document.getElementById("player");
var movieInfo;
var playerReady = false;

window.onresize = setPlayerSize;
window.onload = () => {
    getUsers().then(() => {
        setPlayerSize();
        get("movie", {
            movie,
            user: me.name
        }).then(info => {
            movieInfo = info;
            var source = document.createElement("source");
            source.src = "/stream/" + movieInfo.files[episode ? episode : 0];
            if (movieInfo.hasSubtitles) {
                var track = document.createElement("track");
                track.label = "Undertexter";
                track.kind = "subtitles";
                track.srclang = "en";
                track.src = "/stream/" + movieInfo.code + ".vtt";
                track.default = true;
                player.appendChild(track);
            }
            player.appendChild(source);
            document.title =
                movieInfo.title +
                (movieInfo.type == "tv" ? " - Episode " + (episode + 1) : "");
        });
    });
};

player.onloadeddata = () => {
    playerReady = true;
    if (me.progress[movieInfo.code]) {
        var progress
        if (movieInfo.type == "tv") {
            progress = me.progress[movieInfo.code][episode] ?
                me.progress[movieInfo.code][episode].progress :
                0;
        } else {
            progress = me.progress[movieInfo.code].progress;
        }
        player.currentTime = player.duration * progress;
        record()
    }
};

player.onpause = () => {
    record();
};

player.onseeked = () => {
    record()
}

setInterval(() => {
    if (!player.paused) record();
}, 10000);

function record() {
    if (!playerReady) return;

    if (!localUsername || !loggedIn) {
        location.href = "/";
    }


    post("/progress", {
        user: localUsername,
        code: movieInfo.code,
        episode: episode,
        progress: (player.currentTime / player.duration).toFixed(10),
        minutes_left: (player.duration - player.currentTime) / 60
    }).then(res => {
        if (res == "kick") {
            location.href = "/";
        }
    });
}

function setPlayerSize() {
    player.width = window.innerWidth;
    player.height = window.innerHeight;
}