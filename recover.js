const fs = require("file-system");
const db = JSON.parse(fs.readFileSync("db.json"));

const files = fs.readdirSync("cdn/stream")
files.splice(files.indexOf(".gitignore"), 1)

var recovered = 0


for (let file of files) {
    if (["vtt", "srt"].indexOf(file.substr(file.lastIndexOf(".") + 1)) == -1) {
        var code = file.substr(0, file.lastIndexOf("."))
        var title = code.split("_").join(" ");
        title = title[0].toUpperCase() + title.substr(1)

        var hasSubtitles = fs.existsSync("cdn/stream/" + code + ".vtt")

        if (!db.movies[code]) {
            db.movies[code] = {
                "type": "movie",
                "added": Date.now(),
                "title": title,
                "code": code,
                "files": [
                    file
                ],
                "hasSubtitles": hasSubtitles
            }
            recovered++
        }
    }
}

fs.writeFileSync("db.json", JSON.stringify(db))
console.log("Done! Recovered " + recovered + " movies.")