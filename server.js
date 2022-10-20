const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  //Register a new handler for the given event.
  socket.on("join-room", (roomId, userId, userName) => {
    console.log(userName + " joined!");

    socket.join(roomId);
    socket.on("ready", () => {
      socket.to(roomId).broadcast.emit("user-connected", userId);
    });
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });

    socket.on("disconnect", () => {
      console.log("user-disconnected", userName, userId);
      io.to(roomId).emit("user-disconnected", userName, userId);
    });
  });
});

server.listen(process.env.PORT || 3030);
