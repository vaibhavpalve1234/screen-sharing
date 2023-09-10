const logoutDash = document.getElementById("logout-dash");
const logoutMain = document.getElementById("logout-record");
const logoutLive = document.getElementById("logout-live");


if (logoutDash) {
    logoutDash.addEventListener("click", () => {
        electronAPI.logoutDash();
    });
}

if (logoutMain) {
    logoutMain.addEventListener("click", () => {
        electronAPI.logoutMain();
    });
}


// if (logout) {
//     logout.addEventListener("click", () => {
//         electronAPI.logoutList();
//     });
// }


if (logoutLive) {
    logoutLive.addEventListener("click", () => {
        electronAPI.logoutLive();
    });
}
