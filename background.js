chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['entries'], (result) => {
      if (!result.sections) {
        chrome.storage.local.set({ entries: [] });
      }
    });
});

// Listen for the new section data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //console.log("Message received in background.js:", message);
  if (message.action === "addStreamer") {
      //console.log("Section data stored:", message.data);
      sendResponse({ status: "Received" });

      chrome.runtime.sendMessage({ action: 'forwardData', data: message.data }, response => {
        //console.log("Data Forwarded to pop.js -> Response: ", response);
    });
  }
});
  