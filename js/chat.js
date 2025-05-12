console.log("JavaScript loaded successfully");

let currentSong = new Audio();
let songs = [];
let currentFolder = "";

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
  currentFolder = folder;
  try {
    const response = await fetch(`/${folder}/`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    const text = await response.text();
    const div = document.createElement("div");
    div.innerHTML = text;
    const anchors = div.getElementsByTagName("a");
    songs = Array.from(anchors)
      .filter((anchor) => anchor.href.endsWith(".mp3"))
      .map((anchor) => anchor.href.split(`/${folder}/`)[1]);
    
    displaySongs();
  } catch (error) {
    console.error("Error fetching songs:", error.message);
  }
}

function displaySongs() {
  const songUL = document.querySelector(".songlist ul");
  songUL.innerHTML = "";
  songs.forEach((song) => {
    songUL.innerHTML += `
      <li>
        <img class="invert" src="img/play.svg" alt="Play">
        <div class="info">
          <div>${song.replaceAll("%20", " ")}</div>
          <div></div>
        </div>
      </li>`;
  });

  Array.from(document.querySelectorAll(".songlist li")).forEach((e) => {
    e.addEventListener("click", () => {
      playMusic(e.querySelector(".info div").textContent.trim());
    });
  });
}

function playMusic(track, pause = false) {
  currentSong.src = `/${currentFolder}/${track}`;
  if (!pause) {
    currentSong.play();
    document.getElementById("play").src = "img/pause.svg";
  }
  document.querySelector(".songinfo").textContent = decodeURI(track);
  document.querySelector(".songtime").textContent = "00:00/00:00";
}

async function displayAlbums() {
  try {
    const response = await fetch(`/albums.json`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    const albums = await response.json();
    const cardContainer = document.querySelector(".cardContainer");

    albums.forEach((album) => {
      cardContainer.innerHTML += `
        <div data-folder="${album.folder}" class="card">
          <div class="play"></div>
          <img src="/songs/${album.folder}/${album.cover}" alt="${album.title}">
          <h2>${album.title}</h2>
          <p>${album.description}</p>
        </div>`;
    });

    Array.from(document.querySelectorAll(".card")).forEach((e) => {
      e.addEventListener("click", async (item) => {
        songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
        playMusic(songs[0]);
      });
    });
  } catch (error) {
    console.error("Error fetching albums:", error.message);
  }
}

async function main() {
  await displayAlbums();
  if (currentFolder) {
    await getSongs(`songs/${currentFolder}`);
    playMusic(songs[0], true);
  }

  document.getElementById("play").addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      document.getElementById("play").src = "img/pause.svg";
    } else {
      currentSong.pause();
      document.getElementById("play").src = "img/play.svg";
    }
  });

  document.getElementById("previous").addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  document.getElementById("next").addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").textContent = `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = `${percent}%`;
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-110%";
  });

  document.querySelector(".range input").addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
  });

  document.querySelector(".volume img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document.querySelector(".range input").value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
      document.querySelector(".range input").value = 10;
    }
  });
}

document.head.insertAdjacentHTML('beforeend', '<link rel="icon" href="data:,">');
main();
