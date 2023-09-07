const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const startRecording = document.getElementById("startRecording");
const stopRecording = document.getElementById("stopRecording");
const getSorces = document.getElementById("getSorces");

const minimizeWindow = document.getElementById("minimizeWindow");
const closeWindow = document.getElementById("closeWindow");
const maximizeWindow = document.getElementById("maximizeWindow");

// Client-side JavaScript code in renderer.js
const videoSelect = document.getElementById('videoSelect');
const videoPlayer = document.getElementById('videoPlayer');

// Function to fetch the list of video filenames from the server
const fetchVideoList = async () => {
  try {
    const response = await fetch('/getVideoList');
    if (!response.ok) {
      throw new Error('Error fetching video list');
    }
    const videoList = await response.json();

    // Populate the <select> element with video options
    videoList.forEach((filename) => {
      const option = document.createElement('option');
      option.value = filename;
      option.text = filename;
      videoSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching video list:', error);
  }
};

// Event listener for when an option is selected
videoSelect.addEventListener('change', () => {
  const selectedVideo = videoSelect.value;

  // Set the video source and play it
  if (selectedVideo) {
    videoPlayer.src = `/videos/${selectedVideo}`;
    videoPlayer.load();
    videoPlayer.play();
  }
});

fetchVideoList();

const logout = document.getElementById("logout");

if (minimizeWindow) {
  minimizeWindow.addEventListener("click", () => {
    electronAPI.minimize();
  });
}

if (closeWindow) {
  closeWindow.addEventListener("click", () => {
    electronAPI.close();
  });
}

if (maximizeWindow) {
  maximizeWindow.addEventListener("click", () => {
    electronAPI.toggleMaximize();
  });
}

if (logout) {
  logout.addEventListener("click", () => {
    electronAPI.logout();
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    electronAPI.login(email, password);
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    electronAPI.signup(email, password);
  });
}

if (getSorces) {
  getSorces.addEventListener("click", () => {
    electronAPI.getSorces();
  });
}

if (startRecording) {
  startRecording.addEventListener("click", () => {
    electronAPI.startRecording();
  });
}

if (stopRecording) {
  stopRecording.addEventListener("click", () => {
    electronAPI.stopRecording();
  });
}
