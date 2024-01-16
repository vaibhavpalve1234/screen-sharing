const path = require("path");
const { app, BrowserWindow, ipcMain, Menu } = require("electron");

const { makeTray } = require("./assets/js/tray");
const { toggleRecordingState } = require("./assets/js/shortcut");
const {
  isAuthenticated,
  login,
  signup,
  logout,
  loginFailed,
} = require("./assets/js/auth");
const {
  getInputSources,
  selectSource,
  setSourceAsEntireScreen,
  sendRecordingToServer,
  liveStremStart,
  liveStremStop,
  sendListOfRecording
} = require("./assets/js/video");
const getSource = require("./assets/js/getSource");

let userId;

let mainWindow;
let loginWindow;
let preloaderWindow;


// all screen size and shape are mentions 
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 915,
    height: 720,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "./screens/index.html"));
};
const createDashboardWindow = () => {
  dashBoardWindow = new BrowserWindow({
    width: 915,
    height: 720,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  dashBoardWindow.loadFile(path.join(__dirname, "./screens/desktop.html"));
};

const createLoginWindow = () => {
  loginWindow = new BrowserWindow({
    width: 302,
    height: 502,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  loginWindow.loadFile(path.join(__dirname, "./screens/login.html"));
};

const createPreloaderWindow = () => {
  preloaderWindow = new BrowserWindow({
    width: 402,
    height: 302,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  preloaderWindow.loadFile(path.join(__dirname, "./screens/preloader.html"));
};



// const createListWindow = () => {
//   liveStrem = new BrowserWindow({
//     width: 915,
//     height: 720,
//     frame: false,
//     webPreferences: {
//       preload: path.join(__dirname, "preload.js"),
//     },
//   });

//   liveStrem.loadFile(path.join(__dirname, "./screens/list.html"));
// };

// server started then all function run that time 
app.whenReady().then(() => {
  console.log("frontend started")
  createPreloaderWindow();

  setTimeout(() => {
    isAuthenticated(preloaderWindow, function (id) {
      if (id == undefined) {
        createLoginWindow();
        preloaderWindow.close();
        return;
      }
      userId = id;
      createDashboardWindow();
      preloaderWindow.close();
      setSourceAsEntireScreen(dashBoardWindow);
      toggleRecordingState(dashBoardWindow);
    });
  }, 3000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("LOGOUT-MAIN", async (event) => {
  logout(mainWindow);
});

ipcMain.on("LOGOUT-DASH", async (event) => {
  logout(dashBoardWindow);
});


ipcMain.on("LOGIN", async (event, email, password) => {
  login(email, password, function (res) {
    if (res == 0) {
      loginFailed(loginWindow);
      return;
    }
    userId = res.user_id;
    const code = `localStorage.setItem("userId", ${res.user_id})`;
    loginWindow.webContents.executeJavaScript(code, true);
    createDashboardWindow();
    setTimeout(() => {
      loginWindow.close();
    }, 1500);
  });
});

ipcMain.on("GET-SOURCES", async () => {
  getSource(Menu, mainWindow)
});

ipcMain.on("SAVE-RECORDING", (event, buffer) => {
  sendRecordingToServer(buffer, userId);
});

ipcMain.on("MINIMIZE-WINDOW", () => {
  BrowserWindow.getFocusedWindow().minimize();
});

ipcMain.on("MAXIMIZE-WINDOW", () => {
  BrowserWindow.getFocusedWindow().isMaximized()
    ? BrowserWindow.getFocusedWindow().restore()
    : BrowserWindow.getFocusedWindow().maximize();
});

ipcMain.on("CLOSE-WINDOW", () => {
  BrowserWindow.getFocusedWindow().hide();
});

ipcMain.on("SIGNUP", async (event, email, password) => {
  signup(email, password, function (res) {
    const code = `localStorage.setItem("userId", ${res.user_id})`;
    userId = res.user_id;
    loginWindow.webContents.executeJavaScript(code, true);
    dashBoardWindow();
    setTimeout(() => {
      loginWindow.close();
    }, 1500);
  });
});

ipcMain.on("NavigateRecordingPage", async () => {
  createMainWindow()
  setSourceAsEntireScreen(mainWindow);
  makeTray(mainWindow);
  setTimeout(() => {
    dashBoardWindow.close();
  }, 300);

})

const createLiveWindow = () => {
  liveStrem = new BrowserWindow({
    width: 915,
    height: 720,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  liveStrem.loadFile(path.join(__dirname, "./screens/live.html"));
};

ipcMain.on("NavigateRecordingList", async (dashBoardWindow) => {
  const recordings = await sendListOfRecording()
  console.log(dashBoardWindow)
  dashBoardWindow.webContents.send('List', recordings);
})


ipcMain.on("NavigateRecordingLive", async (page) => {
  createLiveWindow()
  setSourceAsEntireScreen(liveStrem);
  setTimeout(() => {
    dashBoardWindow.close();
  }, 300);
})

ipcMain.on("Live-Start", async (liveStrem) => {
  let peerConnection = await liveStremStart(liveStrem)
  console.log(liveStrem)
  liveStrem.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
  setSourceAsEntireScreen(liveStrem);
})

ipcMain.on("Live-Stop", () => {
  liveStremStop()
})

ipcMain.on("BACKPAGE", () => {
  createDashboardWindow()
  setSourceAsEntireScreen(dashBoardWindow);
  mainWindow.close()
});

ipcMain.on("LOGOUT-LIVE", async (event) => {
  logout(liveStrem)
});
