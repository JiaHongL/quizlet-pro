try {
  const injectDOMElement = (tagName: any, targetElement: any, options = {}) => {
    const element = document.createElement(tagName);
    Object.entries(options).forEach(([optionKey, optionValue]) => {
      element[optionKey] = optionValue;
    });
    targetElement?.appendChild(element);
    return element;
  };

  // 1. 建立 appContainer (div) 放進 body
  const appContainer = document.createElement("div");
  document.body.appendChild(appContainer);

  // 2. 建立 <content-app-root> 放進 appContainer
  const appElement = document.createElement("content-app-root");
  appContainer.appendChild(appElement);

  // 3. 將擴充套件的 js 和 css 掛在被擴充的網站上 polyfills.js, runtime.js
  ["styles.css"].forEach((file) => {
    if (file.endsWith(".css")) {
      injectDOMElement("link", document.head, {
        rel: "stylesheet",
        href: chrome.runtime.getURL(file),
      });
    } else {
      injectDOMElement("script", document.head, {
        src: chrome.runtime.getURL(file),
        defer: true,
      });
    }
  });
} catch (error) {
  console.log("error", error);
}

if (process.env['ENABLE_LIVE_RELOAD']) {
  // 定時戳一下，讓背景程式不要進入睡眠狀態
  const intervalId = setInterval(() => {
    try {
      chrome.runtime.sendMessage({ command: "wake up!" }).then((response) => {
        // console.log("response", response);
      });
    }
    catch (e) {
      // chrome extension 已刷新，需重新載入頁面，取得最新的 chrome object
      clearInterval(intervalId);
      window.location?.reload();
    }
  }, 500);
}