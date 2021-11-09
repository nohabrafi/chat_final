require('dotenv').config();
const cors = require('cors');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http');
const {
    send
} = require('process');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*"
    }
});



app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public')); // serves static files from the 'public' folder; no path is given, so works for every route
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
// app.use(cors()); // allow requests from anywhere ('*')

// const uri = process.env.DB_CONNECTON_good;
// const options = { useNewUrlParser: true };
// const callback = () => {
//     console.log('connected to DB!')
// };
// mongoose.connect(uri, options, callback);
// //############ CONNECTION TO DB ############//

server.listen(PORT, () => console.log(`Server listening on port ${process.env.PORT}`));

var onlineUsers = [];

app.get('/', (req, res) => {
    res.render("app");
});

io.on("connection", (socket) => {

    socket.on("add-username", async user => {

        socket.join("lobby"); // join every socket to the room lobby

        // storing users in an extra array
        onlineUsers.push({
            username: user,
            socketID: socket.id
        });

        onlineUsers.forEach(element => {
            console.log(element);
        });

        socket.username = user; // setting custom attribute of the socket

        const sockets = await io.fetchSockets(); // fetch all the connected sockets 

        let connectMsg = `${user} connected`;

        // just console log it on the server
        console.log(connectMsg);

        try {

            // emit to the latest connected socket the list of online users
            socket.emit("broadcastUserList", onlineUsers);

            // upon the CONNECTION of a socket the server broadcasts a message to the other connected sockets to let them know
            // broadcast to everyone else number of users, name of connected user, and a message
            socket.to("lobby").emit("user-connected", onlineUsers[onlineUsers.length - 1], sockets.length, connectMsg);

        } catch (e) {

            console.log(e);
        }

    });

    socket.on("disconnect", reason => {

        var disconnectMsg;
        let disconnectedUser = onlineUsers.find(userObj => userObj.socketID == socket.id); // find the disconnected user by socket id

        if (disconnectedUser == undefined) { // if undefined than not found. this happens only when the server restarts

            disconnectMsg = `someone disconnected due to "${reason}"`;
            console.log("some problem that i dont understand yet :P");

        } else {

            let userIndex = onlineUsers.indexOf(disconnectedUser); // get the index of the userobject
            onlineUsers.splice(userIndex, 1); // remove from the onlineUsers array the disconnected user
            disconnectMsg = `${disconnectedUser.username} disconnected due to "${reason}"`;

        }

        console.log("after one disconnected");
        onlineUsers.forEach(element => {
            console.log(element);
        });

        console.log(disconnectMsg);
        /* upon the DISCONNECTION of a socket the server broadcasts a message, the disconnected user
         and the new length of the users array to the other connected sockets to let them know */
        socket.to("lobby").emit("user-disconnected", disconnectedUser, onlineUsers.length, disconnectMsg);

    });

    socket.on("send-message", async (sender, recipient, message) => {

        let toLobby = undefined; // variable to say if the message goes  to lobby or not

        if (recipient === "Lobby") {

            toLobby = true;
            /* send to room "lobby" and send the "toLobby variable too because on the client side one function handles all the received messages
            this can be solved differently. There could be another event "receive-message-to-lobby" which is emitted when the recipient is "lobby".
            Then on the client side the socket.on("receive-message-to-lobby",(sender, message)=>{ .... }) 
            would append the messages only to the lobby tab */
            socket.to("lobby").emit("receive-message", sender, message, toLobby);

        } else {

            toLobby = false; // message isn't going to lobby
            const sockets = await io.fetchSockets();
            let sendMessageToThisSocket = sockets.find(userObj => userObj.username === recipient); // but instead to someone directly

            // check the socket is found at all by recipient name
            if (sendMessageToThisSocket != undefined) {

                // if it is then send message to the id of the socket (its own room)
                console.log(`message sent from ${sender} to ${sendMessageToThisSocket.id} (${sendMessageToThisSocket.username})`);
                socket.to(sendMessageToThisSocket.id).emit("receive-message", sender, message, toLobby);

            } else {
                console.log("something went wrong sorry :(")
            }

        }

    });

});