const { JSDOM } = require("jsdom");
const { window } = new JSDOM("");
const { app } = require("electron");
const axios = require("axios");

const { API } = require("./constant");
const { callNotification } = require("./notification");

const isAuthenticated = (preloaderWindow, callback) => {
  preloaderWindow.webContents
    .executeJavaScript("({...localStorage});", true)
    .then((localStorage) => {
      callback(localStorage.userId); // "number" if exists, or "undefined"
    });
};

const login = (email, password, callback) => {
  axios
  .post(`${API}/login`, {
    login_email: email,
    login_pass: password,
  })
  .then((response) => {
    callback(response.data)
    callNotification('Login', "succefully")
  })
  .catch((error) => {
    console.error(error); // Handle any errors here
    callback('0')
  })
};

const signup = (email, password, callback) => {
  axios
    .post(`${API}/signup`, {
      login_email: email,
      login_pass: password,
    })
    .then((response) => {
      callback(response.data);
      callNotification("registerd", "user register") // JSON response
    })
    .catch((error) => {
      console.error("Error:", error);
      callback("0"); // "0" if incorrect credentials
    });
};

const logout = (mainWindow) => {
  const code = `localStorage.removeItem("userId")`;
  mainWindow.webContents.executeJavaScript(code, true);
  callNotification("logout", "")

  setTimeout(() => {
    app.quit();
  }, 1000);
};

const loginFailed = (loginWindow) => {
  const code = `var elem = document.querySelector('.err-message');
                elem.innerHTML = "Incorrect Credentials";`;
  loginWindow.webContents.executeJavaScript(code, true);
};

module.exports = { isAuthenticated, login, signup, logout, loginFailed };
