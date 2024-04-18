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

let contentAppSenderTabId: any;

/** 接收來自 popup.htm、options.html 的訊息 */
chrome.runtime.onMessage.addListener((request: Message, sender, sendResponse) => {
  if (
    request.hasOwnProperty('action')
  ) {
    if (request.action === Action.CONTEXT_APP_INIT) {
      contentAppSenderTabId = sender?.tab?.id;
    } else if (request.action === Action.WORD_UP_QUERY) {
      (chrome.windows as any).getCurrent((currentWindow: chrome.windows.Window) => {
        // 獲取當前窗口的尺寸和位置
        const currentWidth = currentWindow.width || 800;
        const currentHeight = currentWindow.height || 600;
        const currentLeft = currentWindow.left || 0;
        const currentTop = currentWindow.top || 0;
  
        // 定義新窗口的尺寸 
        let newWidth = 720;
        let newHeight = 650;
  
        // 計算新窗口在屏幕正中間打開的left和top值
        const left = Math.round(currentLeft + (currentWidth - newWidth) / 2);
        const top = Math.round(currentTop + (currentHeight - newHeight) / 2);
  
        (chrome.windows as any).create({
          url: 'https://app.wordup.com.tw/decks/query?currentDeckId=2374483&queryStr=' + encodeURIComponent(request.queryWord as string),
          type: 'panel',
          width: newWidth,
          height: newHeight,
          left: left,
          top: top
        });
      })
    } else if (request.action === Action.CLOSE_WINDOW) {
      (chrome.windows as any).getCurrent((currentWindow: chrome.windows.Window) => {
        (chrome.windows as any).remove(currentWindow.id);
      })
    }
    else {
      chrome.tabs.sendMessage(contentAppSenderTabId, request, function (response) { });
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