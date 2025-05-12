
import { loadEntries, createEntry } from "./entry.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { // Listen for the new section data
  if (message.action === 'forwardData') {
    sendResponse({ status: "Forward Success" });
    createEntry(message.data);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const YTcollapseBtn = document.getElementById("YT-collapse");
  const TWcollapseBtn = document.getElementById("TW-collapse");
  const ytContent = document.getElementById("yt-content");
  const twContent = document.getElementById("tw-content");

  YTcollapseBtn.addEventListener('click', function () {
    ytContent.classList.toggle("hidden");
    YTcollapseBtn.textContent = ytContent.classList.contains("hidden") ? "▼" : "▲";
  });

  TWcollapseBtn.addEventListener('click', function () {
    twContent.classList.toggle("hidden");
    TWcollapseBtn.textContent = twContent.classList.contains("hidden") ? "▼" : "▲";
  });

  loadEntries();
});


document.addEventListener('DOMContentLoaded', function () {
  const addSectionButton = document.querySelector('.add-streamer-btn');
  addSectionButton.addEventListener('click', function () {
    chrome.storage.local.get(['popupWindowId'], function (data) {
      if (data.popupWindowId) {  // If a window is already open, bring it to focus
        chrome.windows.update(data.popupWindowId, { focused: true }, function (window) {
          if (chrome.runtime.lastError || !window) { // If the stored window doesn't exist anymore, reset storage and create a new one
            openPopup();
          }
        });
      } else { openPopup(); }
    });
  });

  function openPopup() {
    chrome.windows.create({
      url: "../add_section/add_section.html",
      type: "popup",
      width: 450,
      height: 350,
      left: Math.floor((screen.width - 400) / 2),
      top: Math.floor((screen.height - 300) / 2),
    }, function (window) {
      chrome.storage.local.set({ popupWindowId: window.id });
    });
  }

  // Listen for window close event to clear storage
  chrome.windows.onRemoved.addListener(function (windowId) {
    chrome.storage.local.get(['popupWindowId'], function (data) {
      if (data.popupWindowId === windowId) {
        chrome.storage.local.remove('popupWindowId');
      }
    });
  });
});