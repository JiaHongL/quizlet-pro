import { Action } from "../app/enum/action.enum";
import { Message } from "../app/models/message.model";

const MAX_RECONNECT_ATTEMPTS = 60; // 定義最大重連次數
let reconnectAttempts = 0; // 追蹤目前的重連次數

if (process.env['ENABLE_LIVE_RELOAD']) {

  function connectWebSocket() {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = function (event) {
      console.log("Connected to WebSocket server.");
      reconnectAttempts = 0; // 重連成功時重設重連次數
    };

    socket.onmessage = function (event) {
      if (event.data === "reload") {
        console.log("Reloading extension......");
        // 重新加載擴展
        chrome.runtime.reload();
      }
    };

    socket.onerror = function (error) {
      console.log("WebSocket error: " + error);
    };

    socket.onclose = function (event) {
      console.log("WebSocket connection closed.");
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        // 如果尚未達到最大重連次數，則嘗試重新連接
        reconnectAttempts++;
        console.log(
          `Attempting to reconnect (attempt ${reconnectAttempts})...`
        );
        setTimeout(connectWebSocket, 3000); // 3 秒後重新連接
      } else {
        console.log("Exceeded maximum reconnection attempts.");
      }
    };
  }

  // 連線 WebSocket
  connectWebSocket();

  // 監聽 content-script.js 發送的訊息，並回應
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "wake up!") {
      sendResponse({ result: "OK" });
    }
  });
  console.log("Live reload is enabled");
} else {
  console.log("Live reload is disabled");
}

let contentAppSenderTabId:any;

/** 接收來自 popup.htm、options.html 的訊息 */
chrome.runtime.onMessage.addListener((request:Message, sender, sendResponse) => {
  if (
    request.hasOwnProperty('action')
  ) {
    if (request.action === Action.CONTEXT_APP_INIT) {
      contentAppSenderTabId = sender?.tab?.id;
    }else{
      chrome.tabs.sendMessage(contentAppSenderTabId, request, function(response) {});
    }
  }
  if (request.hasOwnProperty('url')) {
    const url = request.url as string;
    fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return request.responseType === 'text' ? response.text() : response.json();
    })
    .then(data => sendResponse({ data })) // 發送文本給內容腳本
    .catch(error => sendResponse({ error: error.message }));
  }

  return true;

});