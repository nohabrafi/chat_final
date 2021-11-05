require('dotenv').config();
const cors = require('cors');
const express = require('express');
const app = express();
const http = require('http');
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

server.listen(process.env.PORT || 3000, () => console.log(`Server listening on port ${process.env.PORT}`));

var onlineUsers = [];

app.get('/', (req, res) => {
    res.render("app");
});

io.on("connection", (socket) => {

    socket.on("add-username", user => {

        onlineUsers.push({
            username: user,
            socketID: socket.id
        });

        onlineUsers.forEach(element => {
            console.log(element);
        });

        let connectMsg = `${user} connected`;

        // just console log it on the server
        console.log(connectMsg);

        // emit to the latest connected socket the list of online users
        socket.emit("broadcastUserList", onlineUsers);

        // upon the CONNECTION of a socket the server broadcasts a message to the other connected sockets to let them know
        socket.broadcast.emit("user-connected", onlineUsers[onlineUsers.length - 1], onlineUsers.length, connectMsg); // broadcast to everyone else that someone connected and the array of users

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

        // console.log("after");
        onlineUsers.forEach(element => {
            console.log(element);
        });

        console.log(disconnectMsg);
        /* upon the DISCONNECTION of a socket the server broadcasts a message, the disconnected user
         and the new length of the users array to the other connected sockets to let them know */
        socket.broadcast.emit("user-disconnected", disconnectedUser, onlineUsers.length, disconnectMsg);

    });

    socket.on("send-message", (user, message) => { // 2. aztan az eventünk a custom event névvel bejön a serverre és eldöntjuk hog ymi legyen vele
        socket.broadcast.emit("receive-message", user, message); // az lesz vele hogy mivel ez egy egy chat üzenet kiküldjuk akinek kell (itt mindenkinek)
        // itt is egy custom event nevet használunk. a broadcast flaggel kikuldi mindenkinek kivéve a feladónak
    });

});