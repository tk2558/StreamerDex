const YT_API_KEY = CONFIG.YOUTUBE_API_KEY;
const TWITCH_CLIENT_ID = CONFIG.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = CONFIG.TWITCH_CLIENT_SECRET;

async function checkChannelYT(input) {
    if (!input) return 'invalid';

    const urlPath = new URL(input);
    const path = urlPath.pathname;
    const handle = path.slice(2);
    const getData = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&forHandle=${encodeURIComponent(handle)}&key=${YT_API_KEY}`;
    
    try {
      const response = await fetch(getData);
      const data = await response.json();
  
      if (data.items && data.items.length > 0) {
        return handle;

      } else {
        //console.log('Channel not found.');
        return null;
      }
    } catch (error) {
      return null;
    }
}

async function getYTChannelData(handle) {
    if (!handle) return 'invalid';
    const getData = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${YT_API_KEY}`;
    
    try {
      const response = await fetch(getData);
      const data = await response.json();
  
      if (data.items && data.items.length > 0) {
        const channelData = data.items[0].snippet;
        return channelData;

      } else {
        //console.log('ChannelID not found.');
        return null;
      }
    } catch (error) {
      return null;
    }
}

function extractTwitchUsername(input) {
    if (!input) return  null;
    const urlPath = new URL(input);
    const path = urlPath.pathname;
    const handle = path.slice(1);
    return handle;
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
  return data.access_token; // Use this in your Twitch API calls
}

async function checkChannelTW(username, accessToken) {
    const url = `https://api.twitch.tv/helix/users?login=${username}`;
    const response = await fetch(url, {
        headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`
        }
    });

    const data = await response.json();
    return data.data.length > 0 ? data.data[0] : null; 
}

document.addEventListener('DOMContentLoaded', function () {
    const cancelButton = document.querySelector('.cancel-btn');
    cancelButton.addEventListener('click', function () {
        window.close();
    });

    const addButton = document.querySelector('.save-btn');
    addButton.addEventListener("click", async () => {
        const streamerNameInput = document.getElementById("name-section");
        let streamData;
        if (streamerNameInput.value.startsWith("https://www.youtube.com/")) {
            const handle = await checkChannelYT(streamerNameInput.value);
            if (!handle) { // REJECT INPUT
                addButton.classList.add("shake");
                setTimeout(() => {
                    addButton.classList.remove("shake");
                }, 300);
                return; 
            }

            const channelData = await getYTChannelData(handle);
            streamData = {
                homeURL: streamerNameInput.value,
                handle: handle,
                channelTitle: channelData.channelTitle,
                channelId: channelData.channelId,
                platform: "Youtube",
            };
        } 
        else if (streamerNameInput.value.startsWith("https://www.twitch.tv/")) {
            const username = extractTwitchUsername(streamerNameInput.value);
            const accessToken = await getTwitchAccessToken();
            const TWData = await checkChannelTW(username, accessToken);
            if (!TWData) { // REJECT INPUT
                addButton.classList.add("shake");
                setTimeout(() => {
                    addButton.classList.remove("shake");
                }, 300);
                return; 
            }

            streamData = {
                homeURL: streamerNameInput.value,
                handle: username,
                channelTitle: TWData.display_name,
                channelId: TWData.id,
                platform: "Twitch",
            };
        } 
        else { 
            addButton.classList.add("shake");
            setTimeout(() => {
                addButton.classList.remove("shake");
            }, 300);
            return;
        }
        
        chrome.runtime.sendMessage({ action: "addStreamer", data: streamData }, response => { // Send DATA
            //console.log("Message sent from add_section.js. Response:", response);
            window.close();
        })
        return;
    });
});
