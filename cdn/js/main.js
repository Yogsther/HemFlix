var localUsername = localStorage.getItem("user");
var loggedIn = false;
var users;
var me;
var uptime;
var isHome = false;

if (!localUsername) {
    localUsername = false;
} else {
    loggedIn = true;
}

function getUsers() {
    return new Promise(resolve => {
        get("/users").then(data => {
            users = data.users;
            uptime = data.uptime;
            var usersHtml = "";
            for (let user of users) {
                usersHtml += `
                    <div class="user" style="background:${
                        user.color
                    };" onclick="login('${user.name}')">
                        <div class="user-box">
                            <span class="user-letter">${user.name[0].toUpperCase()}</span>
                        </div>
                        <span class="user-name">${user.name}</span>
                    </div>`;
                if (user.name == localUsername) {
                    me = user;
                }
            }

            if (isHome) {
                document.getElementById(
                    "overlay"
                ).innerHTML = `<div id="users">${usersHtml}</div>
                <span id="add-user" onclick="addUser()">Add user</span>
                <a href="/admin"><span id="admin-link">Manage</span></a>
                `;
            }

            if (!me) {
                localUsername = false;
                localStorage.removeItem("user");
                loggedIn = false;
                if (isHome) toggleOverlay(true);
                else {
                    location.href = "/";
                }
            }

            resolve();
        });
    });
}