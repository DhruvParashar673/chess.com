const express = require("express");
const socket = require("socket.io");
const http = require("http");
const path = require("path");
const { Chess } = require("chess.js");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (socket) {
  console.log("New user connected:", socket.id);

  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w"); // lowercase!
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole");
  }

  socket.emit("boardState", chess.fen());

  socket.on("disconnect", function () {
    if (socket.id === players.white) delete players.white;
    else if (socket.id === players.black) delete players.black;
    console.log("User disconnected:", socket.id);
  });

  socket.on("move", function (move) {
    const playerColor =
      socket.id === players.white
        ? "w"
        : socket.id === players.black
        ? "b"
        : null;

    if (playerColor !== chess.turn()) {
      socket.emit("notYourTurn", "Not your turn");
      return;
    }

    const result = chess.move(move);
    if (result) {
      io.emit("moveMade", move);
      io.emit("boardState", chess.fen());
    } else {
      socket.emit("InvalidMove", move);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
