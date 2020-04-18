const fs = require("file-system");

const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const port = config.port;
const started = Date.now();

const express = require("express");
const fileUpload = require("express-fileupload");
const request = require("request");
var srt2vtt = require("srt-to-vtt");

const app = express();

app.use(express.static("cdn"));
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/temp/",
    })
);
app.use(express.json());

class Movie {
    constructor(info, imdb, title = "", type = "movie") {
        this.imdb = imdb;
        this.info = info;
        this.type = type;
        this.added = Date.now();
        this.title = title ? title : info.Title;
        this.code = this.title.replace(/[\W_]+/g, "_").toLowerCase();
        this.files = [];
        this.hasSubtitles = false;

        request(this.info.Poster).pipe(
            fs.createWriteStream(
                __dirname + "/cdn/posters/" + this.code + ".jpg"
            )
        );
    }
}

class Db {
    constructor() {
        try {
            this.data = fs.readFileSync("db.json");
            this.data = JSON.parse(this.data);
        } catch (e) {
            this.data = {
                movies: {},
                users: []
            };
            console.log("db.json not found, created new one.");
            this.save();
        }
        this.sort();
    }

    sort() {
        Object.keys(this.data.movies)
            .sort()
            .reduce((r, k) => ((r[k] = this.data.movies[k]), r), {});
    }

    save() {
        fs.writeFileSync("db.json", JSON.stringify(this.data));
    }
}

function randomColor() {
    var color = hsv2rgb(Math.random() * 360, 0.81, 0.86);
    return `rgb(${color.r}, ${color.g}, ${color.b})`;

    function hsv2rgb(h, s, v) {
        var r, g, b, i, f, p, q, t;
        if (arguments.length === 1) {
            (s = h.s), (v = h.v), (h = h.h);
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                (r = v), (g = t), (b = p);
                break;
            case 1:
                (r = q), (g = v), (b = p);
                break;
            case 2:
                (r = p), (g = v), (b = t);
                break;
            case 3:
                (r = p), (g = q), (b = v);
                break;
            case 4:
                (r = t), (g = p), (b = v);
                break;
            case 5:
                (r = v), (g = p), (b = q);
                break;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255),
        };
    }
}

const db = new Db();

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/cdn/index.html");
});

app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/cdn/admin.html");
});

app.get("/watch", (req, res) => {
    res.sendFile(__dirname + "/cdn/watch.html");
});

app.get("/upload", function (req, res) {
    res.sendFile(__dirname + "/cdn/upload.html");
});

app.get("/movies", (req, res) => {
    res.send(db.data.movies);
});

app.get("/users", (req, res) => {
    for (let user of db.data.users) {
        user.lastOnline = Math.round((Date.now() - user.lastPing) / 1000);
    }
    res.send({
        users: db.data.users,
        uptime: Math.round((Date.now() - started) / 1000),
    });
});

app.get("/movie", (req, res) => {
    var movie = db.data.movies[req.query.movie];
    if (movie) {
        console.log(req.query.user + " started watching " + movie.title);
        res.json(movie);
    }
});

function remove(path) {
    if (fs.existsSync(path)) {
        fs.unlinkSync(path);
        console.log("Deleted file " + path);
    }
}

app.post("/bookmark", (req, res) => {
    for (var user of db.data.users) {
        if (user.name == req.body.user) {
            if (!user.progress[req.body.code])
                user.progress[req.body.code] = {};
            user.progress[req.body.code].bookmarked = !user.progress[
                req.body.code
            ].bookmarked;
            console.log(
                user.name +
                (user.progress[req.body.code].bookmarked ?
                    " bookmarked " :
                    " unbookmarked ") +
                db.data.movies[req.body.code].title
            );
            res.end();
            return;
        }
    }

    res.end();
    return;
});

/* app.post("/remove_progress", (req, res) => {
    var code = req.body.code
    var name = req.body.user

    var movie = db.data.movies[code]
    if (movie) {
        for (let user of db.data.users) {
            if (user.name == name) {
                delete user.progress[code]
                res.end();
                return
            }
        }
    }
}) */

app.post("/remove", (req, res) => {
    if (req.body.type == "movie") {
        if (db.data.movies[req.body.id]) {
            var movie = db.data.movies[req.body.id];
            remove(__dirname + "/cdn/posters/" + movie.code + ".jpg");
            for (let file of movie.files) {
                var fileName = file.split(".");
                fileName.splice(fileName.length - 1, 1);
                fileName = fileName.join(".");

                remove(__dirname + "/cdn/stream/" + file);
                remove(__dirname + "/cdn/stream/" + fileName + ".vtt");
                remove(__dirname + "/cdn/stream/" + fileName + ".srt");
            }

            console.log("Deleted " + movie.title);
            delete db.data.movies[req.body.id];
            db.save();
        }
    } else {
        for (let i = 0; i < db.data.users.length; i++) {
            let user = db.data.users[i];
            if (user.name == req.body.id) {
                db.data.users.splice(i, 1);
                db.save();
                console.log("Deleted user " + req.body.id);
                break;
            }
        }
    }

    res.end();
});

app.post("/color", (req, res) => {
    for (let user of db.data.users) {
        if (user.name == req.body.user) {
            user.color = req.body.color;
            db.save();
        }
    }
    res.end();
});

app.post("/progress", (req, res) => {
    for (var i = 0; i < db.data.users.length; i++) {
        var user = db.data.users[i];
        if (isNaN(req.body.progress)) {
            console.log(
                "WARN: (PROGRESS) Could not verify data from " + user.name
            );
            res.send("kick");
            return;
        }
        if (req.body.episode !== null || req.body.progress !== false) {
            if (isNaN(req.body.episode)) {
                console.log(
                    "WARN: (EPISODE) Could not verify data from " + user.name
                );
                res.send("kick");
                return;
            }
        }

        if (user.name == req.body.user) {
            db.data.users[i].lastPing = Date.now();

            for (let code in db.data.movies) {
                if (code == req.body.code) {
                    var movie = db.data.movies[code];
                    if (movie.type != "tv") {
                        if (!user.progress[code]) user.progress[code] = {};
                        user.progress[code].progress = req.body.progress;
                        user.progress[code].date = Date.now();
                        user.progress[code].minutes_left =
                            req.body.minutes_left;
                    } else {
                        if (req.body.episode == null) {
                            res.send("kick");
                            return;
                        }

                        if (!user.progress[code]) user.progress[code] = {};
                        if (!user.progress[code][req.body.episode])
                            user.progress[code][req.body.episode] = {};
                        user.progress[code][req.body.episode].progress =
                            req.body.progress;
                        user.progress[code][req.body.episode].date = Date.now();
                        user.progress[code][req.body.episode].minutes_left =
                            req.body.minutes_left;
                    }

                    if (!user.progress[code].bookmarked) {
                        user.progress[code].bookmarked = true;
                    }
                    if (
                        req.body.minutes_left < 8 &&
                        user.progress[code].bookmarked
                    ) {
                        if (
                            movie.type == "movie" ||
                            req.body.episode == movie.files.length - 1
                        ) {
                            user.progress[code].bookmarked = false;
                            console.log(user.name + " finished " + movie.title);
                        }
                    }
                }
            }

            db.save();
            res.end();
            return;
        }
    }
    res.send("kick");
});

app.post("/movie", (req, res) => {
    request(
        "http://www.omdbapi.com/?apikey=bb65f1ef&i&i=" + req.body.imdb,
        (err, response) => {
            var info = JSON.parse(response.body);
            if (info.Title) {
                var movie = new Movie(
                    info,
                    req.body.imdb,
                    req.body.title,
                    req.body.type
                );
                db.data.movies[movie.code] = movie;
                db.sort();
                res.send(movie.code);
            } else {
                res.end();
            }
        }
    );
});

app.post("/user", (req, res) => {
    var user = {
        name: req.body.name,
        color: randomColor(),
        progress: {},
    };

    for (let u of db.data.users) {
        if (u.name == user.name) {
            res.json({
                success: false,
                reason: "Namnet är redan taget.",
            });
            return;
        }
    }

    db.data.users.push(user);
    db.save();
    res.json({
        success: true,
    });
});

app.post("/upload", (req, res) => {
    if (db.data.movies[req.body.code]) {
        var fileName =
            req.body.code + (req.body.type == "tv" ? "_" + req.body.id : "");

        var extension = req.files.video.name.split(".");
        extension = extension[extension.length - 1];

        var path = __dirname + "/cdn/stream/" + fileName + "." + extension;

        if (req.files.srt) {
            db.data.movies[req.body.code].hasSubtitles = true;
            var srtPath = __dirname + "/cdn/stream/" + fileName + ".srt";
            req.files.srt.mv(srtPath).then(() => {
                fs.createReadStream(srtPath)
                    .pipe(srt2vtt())
                    .pipe(
                        fs.createWriteStream(
                            __dirname + "/cdn/stream/" + fileName + ".vtt"
                        )
                    );
            });
        }

        req.files.video.mv(path, (err) => {
            console.log("File uploaded to " + path);
            db.data.movies[req.body.code].files[req.body.id] =
                fileName + "." + extension;
            res.end();
            db.save();
            console.log("Saved movie");
            console.log(db.data.movies[req.body.code], req.body.code);
        });
    } else {
        res.end();
    }
});

app.listen(port);
console.log("HemFlix started on port: " + port);