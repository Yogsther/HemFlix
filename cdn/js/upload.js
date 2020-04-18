var uploads = 0;
var type = "movie";
var uploadStarted = false;

function updateType(t) {
    if (uploadStarted) return;
    type = t;
}

function addVideo() {
    if (uploadStarted) return;
    if (uploads > 0 && type == "movie") {
        alert("To add more than one video, change mode to TV");
        return;
    }

    var id = uploads;
    var block = document.createElement("div");
    block.id = "upload-block-" + id;
    block.classList.add("upload-block");
    block.innerHTML = `
    <span class="info-text" id="info-${id}">#${id + 1} : </span>
    <input type="file" oninput="updateStatus(${id})" id="video-${id}">
    <input type="file" accept=".srt" oninput="updateStatus(${id})" id="srt-${id}">
    <button class="select-button" onclick="selectVideo(${id})">Select video</button>
    <button class="select-button" onclick="selectSRT(${id})">Select SRT</button>
    <button class="select-button" onclick="remove(${id})">Remove</button>
    <div class="progress-bar">
        <div class="progress-text" id="progress-text-${id}">Upload not started</div>
        <div class="progress" id="progress-${id}"></div>
    </div>`;

    document.getElementById("uploads").appendChild(block);
    uploads++;
    selectVideo(id);
}

function selectVideo(id) {
    if (uploadStarted) return;
    document.getElementById("video-" + id).click();
}

function selectSRT(id) {
    if (uploadStarted) return;
    document.getElementById("srt-" + id).click();
}

function remove(id) {
    if (uploadStarted) return;
    if (id == uploads - 1) {
        document.getElementById("upload-block-" + id).remove();
        uploads--;
    } else {
        alert("Can only delete the last entry");
    }
}

function updateStatus(id) {
    if (document.getElementById("video-" + id).files[0])
        document.getElementById("link").setAttribute(
            "href",
            "https://www.imdb.com/find?q=" +
                document
                    .getElementById("video-" + id)
                    .files[0].name.substr(
                        0,
                        document.getElementById("video-" + id).files[0].name
                            .length - 25
                    )
                    .replace(/[0-9]/g, "")
                    .split(".")
                    .join("+")
        );

    document.getElementById("info-" + id).innerText =
        "#" +
        (id + 1) +
        (document.getElementById("srt-" + id).files.length > 0
            ? " [CC] "
            : "") +
        ": " +
        document.getElementById("video-" + id).files[0].name;
}

function upload() {
    if (uploadStarted) return;
    /* var video = document.getElementById("video").files[0];
    var srt = document.getElementById("srt").files[0]; */

    var imdb = document.getElementById("imdb").value;
    var title = document.getElementById("title").value;

    if (!imdb) {
        setStatus("No IMDB ID");
        return;
    }

    if (uploads == 0) {
        setStatus("No video(s) added.");
        return;
    }

    uploadStarted = true;
    setStatus("");

    post("/movie", { imdb, title, type }).then(code => {
        for (let i = 0; i < uploads; i++) {
            let config = {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: progressEvent => {
                    let percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    document.getElementById("progress-text-" + i).innerText =
                        percentCompleted + "%";
                    document.getElementById("progress-" + i).style.width =
                        percentCompleted + "%";
                }
            };

            let data = new FormData();

            data.append("type", type);
            data.append("id", i);
            data.append("code", code);

            data.append(
                "video",
                document.getElementById("video-" + i).files[0]
            );

            if (document.getElementById("srt-" + i).files.length > 0)
                data.append(
                    "srt",
                    document.getElementById("srt-" + i).files[0]
                );

            axios.post("/upload", data, config).then(res => {
                document.getElementById("progress-text-" + i).innerText =
                    "Uploaded!";
            });
        }
    });
}

function setStatus(text) {
    document.getElementById("status").innerText = text;
}
