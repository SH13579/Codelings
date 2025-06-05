//http serves HTML files, fs reads files, path to work with file paths, ws is the WebSocket library
const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");

//builds the path to the HTML file to serve. if you go to /, it serves index.html
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, "..", "frontend", "src", req.url === "/" ? "index.html" : req.url);

  //reads file and sends to browser, sends 404 if file not found and sends file content if found
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});

//create WebSocket server attached to same HTTP server
const wss = new WebSocket.Server({ server });

//when browser connects to server via WebSocket, display success msg
wss.on("connection", (ws) => {
  console.log("A user connected.");

  //listens for message from a user and sends to all clients
  ws.on("message", (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  //runs when someone disconnects
  ws.on("close", () => {
    console.log("A user disconnected.");
  });
});

//starts the server to listen on port 5173
server.listen(5173, () => {
  console.log("Server is listening on http://localhost:5173");
})
