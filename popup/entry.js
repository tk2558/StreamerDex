const YT_API_KEY = CONFIG.YOUTUBE_API_KEY;
const TWITCH_CLIENT_ID = CONFIG.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = CONFIG.TWITCH_CLIENT_SECRET;

async function getRecentVids(channelId) {;
    const getData = `https://youtube.googleapis.com/youtube/v3/activities?part=snippet%2CcontentDetails&channelId=${channelId}&maxResults=10&key=${YT_API_KEY}`;
    const response = await fetch(getData);
    const data = await response.json();

    try {
      const videoIds = [];
      if (data.items && data.items.length > 0) {
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          if (item.contentDetails && item.contentDetails.upload && item.contentDetails.upload.videoId) {
            videoIds.push(item.contentDetails.upload.videoId);
          }
        }
      }
      return videoIds;
    } catch (error) {
      return null;
    }
}

async function isLiveBasedonRecentVids(videoIds) {
    if (!videoIds || videoIds.length === 0) return null;

    const idsParam = videoIds.join(',');
    const getData = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=${idsParam}&key=${YT_API_KEY}`;
  
    const response = await fetch(getData);
    const data = await response.json();

    try {
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const liveStatus = item.snippet?.liveBroadcastContent || null;
          if (liveStatus === "live") { return liveStatus; }
        }
      }
      return null;
    } catch (error) {
      return null;
    }
}

async function getTwitchAccessToken() {
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function isTwitchUserLive(username, accessToken) {
  const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${username}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  try { 
      const data = await response.json();
      return data.data[0].type; // returns true if stream is live
  } catch (error) {
      return null;
  }
}
// Helper to parse HTML into DOM element
function createElementFromHTML(htmlString) {
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}

function getLiveStatus() { // Save sections to Chrome Storage
    const allEntries = Array.from(document.querySelectorAll(".entry"));
    //console.log(allEntries);
    allEntries.forEach(async (entry) => {
        if (entry.dataset.platform === "Youtube") {
            const recentVid = await getRecentVids(entry.dataset.channelId);
            if (recentVid.length !== 0) {
                const isLive = await isLiveBasedonRecentVids(recentVid);
                if (isLive === "live") { 
                    const statusIconElement = `<a href="https://www.youtube.com/watch?v=${recentVid}" target="_blank">
                    <img src="../assets/online.png" alt="Live Icon" class="status-icon">
                    </a>`;
                    const existingIcon = entry.querySelector(".status-icon"); // Replace the old status icon (last child of entry)
                    existingIcon.parentElement.replaceChild(createElementFromHTML(statusIconElement),existingIcon);
                }
            } 
        } else if (entry.dataset.platform === "Twitch") {
            const twitch_token = await getTwitchAccessToken();
            const isLive = await isTwitchUserLive(entry.dataset.handle, twitch_token)
            if (isLive) {
                const statusIconElement = `<a href="${entry.dataset.homeURL}" target="_blank">
                <img src="../assets/online.png" alt="Live Icon" class="status-icon">
                </a>`;
                const existingIcon = entry.querySelector(".status-icon"); // Replace the old status icon (last child of entry)
                existingIcon.parentElement.replaceChild(createElementFromHTML(statusIconElement),existingIcon);
            }
        }
    });
}

function saveEntries() { // Save sections to Chrome Storage
    const entries = Array.from(document.querySelectorAll(".entry")).map((entry) => {
        return {
            homeURL: entry.dataset.homeURL,
            handle: entry.dataset.handle,
            channelTitle: entry.dataset.channelTitle,
            channelId: entry.dataset.channelId,
            platform: entry.dataset.platform,
        };
    });
    chrome.storage.local.set({ entries: entries });
}

async function loadEntries() { // Load stored sections 
    //localStorage.clear(); // RESET
    //chrome.storage.local.clear(); // RESET
    chrome.storage.local.get(["entries"], async (result) => {
        if (result.entries) {
            for (const entry of result.entries) {
                await restoreEntry(entry);
            }
            saveEntries();
            getLiveStatus();
        }
    });
}

function restoreEntry(entryData) { 
    const entryDiv = document.createElement("div");
    entryDiv.classList.add("entry");

    entryDiv.dataset.homeURL = entryData.homeURL;
    entryDiv.dataset.handle = entryData.handle;
    entryDiv.dataset.channelTitle = entryData.channelTitle;
    entryDiv.dataset.channelId = entryData.channelId;
    entryDiv.dataset.platform = entryData.platform;

    if (entryData.platform === "Youtube") {
      const ytContent = document.getElementById("yt-content");
      const ytEnd = document.getElementById("yt-end");
      entryDiv.innerHTML = `
        <button class="delete-btn">❌</button>
        <a href=${entryData.homeURL} target = "_blank">
            <img src="../assets/youtube.png" alt="Icon" class="entry-icon">
        </a>
        <span class="entry-name">${entryData.channelTitle}</span>
        <img src="../assets/offline.png" alt="Status Icon" class="status-icon">
      `;
      ytContent.insertBefore(entryDiv, ytEnd);
    }
  
    else { // (entryData.platform === "Twitch") 
      const twContent = document.getElementById("tw-content");
      const twEnd = document.getElementById("tw-end");
      entryDiv.innerHTML = `
          <button class="delete-btn">❌</button>
        <a href=${entryData.homeURL} target = "_blank">
            <img src="../assets/twitch.png" alt="Icon" class="entry-icon">
        </a>
          <span class="entry-name">${entryData.channelTitle}</span>
          <img src="../assets/offline.png" alt="Icon" class="status-icon">
      `;
      twContent.insertBefore(entryDiv, twEnd);
    }

    entryDiv.querySelector(".delete-btn").addEventListener("click", function () { // Add delete functionality
        if (confirm(`Delete Entry: ${entryDiv.dataset.channelTitle}?`)) {
          entryDiv.remove();
          saveEntries();
        }
    });
}

async function createEntry(entryData) { 
    const entryDiv = document.createElement("div");
    entryDiv.classList.add("entry");

    entryDiv.dataset.homeURL = entryData.homeURL;
    entryDiv.dataset.handle = entryData.handle;
    entryDiv.dataset.channelTitle = entryData.channelTitle;
    entryDiv.dataset.channelId = entryData.channelId;
    entryDiv.dataset.platform = entryData.platform;

    if (entryData.platform === "Youtube") {
        const ytContent = document.getElementById("yt-content");
        const ytEnd = document.getElementById("yt-end");
        let currLive = false;
        const recentVid = await getRecentVids(entryData.channelId);

        if (recentVid.length !== 0) {
            const isLive = await isLiveBasedonRecentVids(recentVid);
            currLive = isLive === "live";
        }
        const statusIconElement = currLive ? `<a href="https://www.youtube.com/watch?v=${recentVid}" target="_blank">
            <img src="../assets/online.png" alt="Live Icon" class="status-icon">
            </a>` : `<img src="../assets/offline.png" alt="Offline Icon" class="status-icon">`;

        entryDiv.innerHTML = `
            <button class="delete-btn">❌</button>
            <a href=${entryData.homeURL} target = "_blank">
                <img src="../assets/youtube.png" alt="Icon" class="entry-icon">
            </a>
            <span class="entry-name">${entryData.channelTitle}</span>
            ${statusIconElement}
        `;
      ytContent.insertBefore(entryDiv, ytEnd);
    }
  
    else { // (entryData.platform === "twitch") 
      const twContent = document.getElementById("tw-content");
      const twEnd = document.getElementById("tw-end");

      let currLive = false;
      const twitch_token = await getTwitchAccessToken();
      const isLive = await isTwitchUserLive(entryData.handle, twitch_token);

      if (isLive) { currLive = isLive === "live"; }
      const statusIconElement = currLive ? `<a href="${entryData.homeURL}" target="_blank">
          <img src="../assets/online.png" alt="Live Icon" class="status-icon">
          </a>` : `<img src="../assets/offline.png" alt="Offline Icon" class="status-icon">`;
      

      entryDiv.innerHTML = `
        <button class="delete-btn">❌</button>
        <a href=${entryData.homeURL} target = "_blank">
          <img src="../assets/twitch.png" alt="Icon" class="entry-icon">
        </a>
        <span class="entry-name">${entryData.channelTitle}</span>
        ${statusIconElement}
      `;
      twContent.insertBefore(entryDiv, twEnd);
    }

    entryDiv.querySelector(".delete-btn").addEventListener("click", function () { // Add delete functionality
        if (confirm(`Delete Entry: ${entryDiv.dataset.channelTitle}?`)) {
          entryDiv.remove();
          saveEntries();
        }
    });
    saveEntries();
}

export { loadEntries, saveEntries, restoreEntry, createEntry, getLiveStatus };