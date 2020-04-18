var movies;
var users;

loadDash();

function loadDash() {
    get("/movies").then(data => {
        movies = data;
        var html = "";
        for (let key in movies) {
            let movie = movies[key];
            html += `
        <div class="movie">
            <span class="movie-title" title="${movie.title}">${movie.title}</span>
            <button class="update-button" onclick="remove('${movie.code}')">Delete</button>
        </div>`;
        }

        document.getElementById("movies").innerHTML = html;
    });

    get("/users").then(data => {
        users = data.users;

        var html = "";
        for (var user of users) {
            html += ` 
        <div class="movie">
            <div class="color" style="background:${user.color};"></div>
            <span class="user-name" >${user.name}</span>
            <button class="update-button" onclick="setColor('${user.name}')">Set color</button>
            <button class="update-button" onclick="remove('${user.name}', false)">Delete</button>
        </div>`;
        }

        document.getElementById("users").innerHTML = html;
    });
}

function setColor(name) {
    var color = prompt("Please enter a color for " + name + "\n(RGB or HEX)")
    if (color) {
        post("/color", {
            user: name,
            color: color
        }).then(() => {
            loadDash()
        })
    }
}

function remove(code, movie = true) {
    if (
        !confirm(
            "Are you sure you want to delete " + code + " from the database?"
        )
    )
        return;
    post("/remove", {
        type: movie ? "movie" : "user",
        id: code
    }).then(() => {
        loadDash();
    });
}