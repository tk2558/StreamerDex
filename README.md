# StreamerDex
StreamerDex is a Chrome extension that helps users quickly check and view their favorite YouTube and Twitch Streamers.
Clicking on a channel opens its livestream or homepage.
This extension uses the Youtube Data API and Twitch API and was created May 2025

## Features
- ✅ Track favorite YouTube or Twitch streamers
- 🔴 Show real-time livestream status
- 🔗 Click to go directly to their channel or live video
- 🎨 Easy UI with collapsible sections
- 💾 Saves your list locally using Chrome storage

## How Does it Work?
- YouTube: Uses the YouTube Data API to check recent uploads and livestream status.
- Twitch: Uses the Twitch Helix API to check if a user is live.
- Click the "Add Streamer" Button on the bottom left of the extension
- Input the Youtube Channel Home Url with its handle (e.g. https://www.youtube.com/@Example) or the Twitch Channel Home Url (e.g. https://www.twitch.tv/example)
- Entries are stored locally using chrome.storage.local.

## Youtube Data API (In Depth)
- Youtube Data API provides a Free Quota of 10,000 units per day
- Checking if a channel is live using Youtube Data API Search Endpoint is the easiest way but it cost 100 units per request
- Which means if you had 10 channels saved, every time you open the extension it would cost 1000 units to check through all the channels (This is too expensive on a 10,000 budget per day)
- Instead this is how the Streamer Dex uses the Youtube Data API:
1. A Youtube Channel URL is inputted and checked if it exists using Youtube Data API Channel Endpoint (Cost: 1 unit per check)
2. If channel exists then Youtube Data API Search Endpoint (Cost: 100 unit) is used to get Channel Data (Channel Id, Channel Name)
3. Use Youtube Data API Activities Endpoint to get the 10 most recent Videos Ids from the Channel (Cost: 1 unit)
4. Check if any of those 10 recent videos is a Livestream that is ongoing with Youtube Data API Video Endpoint, returning the most recent one or none (Cost: 1 Unit)
- Now instead of costing 100 units per check to see if a Channel is Live, it only cost 2 units 
- Disclaimer: This method may not work for channels with a high upload rate while stream is ongoing


## Twitch Data API 
- Twitch API requires Twitch Client Id and Twitch Client Secret
- Using Twitch Client Id and Twitch Client Secret, an access token is requested
- With the access token, we can check if the Channel exist and is current live

## Installation
1. Download the extension files.
2. Create a config.js file in the root directory
3. Get a Youtube Data API key, Twitch Client Id and Twitch Client Secret and add the information as seen in config-example.js
4. Open `chrome://extensions/` in your browser.
5. Enable "Developer mode" and load the unpacked extension.

## Getting a Youtube API Key
1. Go to Google Cloud Console.
2. Create a project (or use an existing one).
3. Enable YouTube Data API v3.
4. Generate an API key under “Credentials”.

## Getting a Twitch Client Id and Twitch Client Secret
1. Go to https://dev.twitch.tv/console
2. Register an application to get Client ID and Client Secret (Enter http://localhost/ for OAuth Redirect URL)