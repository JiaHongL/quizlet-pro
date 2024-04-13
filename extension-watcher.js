// Websocket server
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

// Broadcast to all.
wss.on("connection", function connection(ws) {
  console.log("A new client connected.");
  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
  });
  ws.send("Hello Client!");
  ws.on("close", function close() {
    console.log("client disconnected");
  });
});

// File watcher
const chokidar = require("chokidar");
const { exec } = require("child_process");

// 初始化 chokidar 監聽器
const watcher = chokidar.watch("./src", {
  ignored: /(^|[\/\\])\../,
  persistent: true,
});

// 監聽事件
watcher.on("change", (path) => {

  console.log(`==> Detected change in ${path}. Rebuilding...`);

  exec("npm run build:dev", (err, stdout, stderr) => {

    if (err) {
      console.error("Error during build:", err);
      return;
    }

    console.log("==> ng build completed.");

    exec("npm run webpack:build", (err, stdout, stderr) => {

      if (err) {
        console.error("Error during build:", err);
        return;
      }

      console.log("==> webpack build completed.");

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send("reload");
          console.log("==> Sent reload message to client.");
        }
      });

    });

  });

});
