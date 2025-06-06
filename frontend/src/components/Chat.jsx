import React from 'react';

export default function Chat(){
  //connects browser to websocket server running on port 5173
  const socket = new WebSocket("ws://localhost:5173")

  //runs when the connection to server is successfully opened
  socket.onopen = () => {
    console.log("Connected to server!");
  }

  //every time a message is received from the server, create a new <div> with the message and append it to the chat box
  socket.onmessage = (event) => {
    const chat = document.getElementById("chat");
    const msg = document.createElement("div");
    msg.textContent = event.data;
    chat.appendChild(msg);
  }

  //gets the msg the user typed and sends it to the server via WebSocket
  function send(){
    const input = document.getElementById("msgInput");
    socket.send(input.value); //sends msg
    input.value = ""; //clears input box
  }

  return (
    <div>
      <div id="chat"></div>
      <input id="msgInput" type="text" placeholder="Enter message..." />
      <button onClick={() => send()}>Send</button>
    </div>
  )
}