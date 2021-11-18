require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const mongoose = require("mongoose");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*"
    }
});
const PORT = process.env.PORT || 3000;
const uri = process.env.DB_CONNECTION;
const store = new MongoDBStore({
    uri: uri,
    collection: "sessions"
});
const userModel = require("./models/UserModel");
const messageModel = require("./models/MessageModel");

var onlineUsers = [];
var everyRegisteredUser = [];
var OnlineOfflineUserList = [];

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.static("public")); // serves static files from the 'public' folder; no path is given, so works for every route
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// manage session
app.use(session({
    cookie: {
        maxAge: 60000
    },
    secret: "my secret secret",
    resave: false,
    saveUninitialized: false,
    store: store
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.isAuth) {
        next();
    } else {
        res.redirect("/login");
    }
};

const isNotAuthenticated = (req, res, next) => {
    if (!req.session.isAuth) {
        next();
    } else {
        res.redirect("/");
    }
};

mongoose.connect(uri).then(() => console.log("Connected to MongoDB")).catch((error) => console.error(error));

server.listen(PORT, () => console.log(`Server listening on port ${process.env.PORT
    }`));

app.get("/", isAuthenticated, (req, res) => {
    res.render("app", {
        authenticatedUser: req.session.authenticatedUser
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    console.log("session destroyed");
    res.redirect("/login");
});

app.get("/signup", isNotAuthenticated, (req, res) => {
    res.render("signup", {
        message: ""
    });
});

app.post("/signup", async (req, res) => { // get the data from the request body
    const {
        username,
        email,
        password,
        re_password
    } = req.body;

    // password has to be entered twice. if they don't match, try again
    if (password !== re_password) {
        console.log("user " + req.body.username + " password mismatch");
        delete req.body;
        return res.render("signup", {
            message: "Passwords don't match!"
        });
    }

    // try to retrieve user by username from the DB to check if it exists
    let user = await userModel.findOne({
        username
    });

    // if it does, try again with another name
    if (user) {
        console.log(req.body.username);
        console.log("already exists");
        console.log(user);
        delete req.body;
        return res.render("signup", {
            message: "Username already exist in the database!"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    // encrypting password

    // creating the user model to be saved in the DB
    user = new userModel({
        username: username,
        email: email,
        password: hashedPassword
    });

    // trying to save. if there is an error its probably because the email is already taken, in this case try again
    try {
        await user.save();
        console.log("user saved:");
        console.log(user);
        res.redirect("/login");
    } catch (e) {
        console.log("couldn't save user :(");
        console.error(e);
        return res.render("signup", {
            message: "Email already exists in DB!"
        });
    }
});

app.get("/login", isNotAuthenticated, (req, res) => {
    res.render("login", {
        message: ""
    });
});

app.post("/login", async (req, res) => {
    const {
        username,
        password
    } = req.body;


    // check if user is already logged in. if it is then try again and show error message
    if (onlineUsers.find((userObj) => userObj.username === username)) {
        console.log(`Login fail from user ${username}: user with this name already logged in`);
        return res.render("login", {
            message: "User with this name already logged in!"
        });
    }

    // search for user in DB
    let user = await userModel.findOne({
        username: username
    });

    // if user cannot be found, then user does not exist in DB. try again and show error message
    if (!user) {
        console.log(`Login fail from user ${username}: user does not exist`);
        return res.render("login", {
            message: "User does not exist!"
        });
    }

    // compare passwords
    const pwdMatch = await bcrypt.compare(password, user.password);

    // if there is no match, retry and error message
    if (!pwdMatch) {
        console.log(`Login fail from user ${username}: password incorrect`);
        return res.render("login", {
            message: "Password incorrect!"
        });
    }

    req.session.isAuth = true; // if everything is fine, user is authenticated
    req.session.authenticatedUser = user.username; // save username in session for later use
    console.log(`Authentication succesfull for user ${user.username}`);
    res.redirect("/"); // redirect to main page
});

io.on("connection", (socket) => {
    socket.on("add-username", async (user) => {
        console.log("users-array in the moment of connection:");
        onlineUsers.forEach((element) => {
            console.log(element);
        });

        // check if user is already logged in (if it is in the "onlineUsers" array)
        let userIsAlreadyLoggedIn = onlineUsers.find((userObj) => userObj.username === user);
        // if it is then search for its socket id and disconnect it. only the newer connection remains
        if (userIsAlreadyLoggedIn) {
            const sockets = await io.fetchSockets(); // fetch all the connected sockets
            const oldUserConnection = sockets.find((socket) => socket.id === userIsAlreadyLoggedIn.socketID); // find socket by id
            oldUserConnection.disconnect(); // on the disconnected event the user will be removed of the onlinUsers array

            onlineUsers.push({ // storing users in an extra array
                username: user,
                socketID: socket.id
            });

            console.log("users-array after connected with the same name again: ");
            onlineUsers.forEach((element) => {
                console.log(element);
            });
        } else {
            onlineUsers.push({ // storing users in an extra array
                username: user,
                socketID: socket.id
            });

            console.log("users-array after a new user connected normally");
            onlineUsers.forEach((element) => {
                console.log(element);
            });
        }
        socket.username = user;
        socket.join("Lobby"); // join every socket to the room lobby

        let connectMsg = `${user} connected`;

        // just console log it on the server
        console.log(connectMsg);


        try {
            // clear the lists because it is easier than modifiing them. atleast for now
            everyRegisteredUser = [];
            OnlineOfflineUserList = [];
            // get every registered users from the DB
            everyRegisteredUser = await userModel.find({}, {
                _id: 0,
                username: 1
            }); // get only username; id comes by default but we dont need that so 0

            // make the list of online and offline users from two arrays. one contains only the online users, 
            //the other every single user in the DB
            everyRegisteredUser.forEach((registeredUser) => {
                //loop through the users found in the DB and check if they are in the onlineUsers array as well 
                let onlineUser = onlineUsers.find(onlineUser => onlineUser.username === registeredUser.username);
                // if the user is online push it into the main array and set online to TRUE
                if (onlineUser) {
                    // let index = onlineUsers.indexOf(onlineUser);
                    OnlineOfflineUserList.push({
                        username: registeredUser.username,
                        online: true,
                        socketID: onlineUser.socketID
                    });
                } else {
                    // if the user is offline push it into the main array and set online to FALSE
                    OnlineOfflineUserList.push({
                        username: registeredUser.username,
                        online: false,
                        socketID: "empty"
                    });
                }

            });
            // information for the server
            console.log("                                                                  ");
            console.log("                                                                  ");
            console.log("                                                                  ");
            console.log("status of all users on the server");
            console.log(OnlineOfflineUserList);
            console.log("                                                                  ");
            console.log("                                                                  ");
            console.log("                                                                  ");

        } catch (e) {
            console.log(e);
        }

        try { // emit to the latest connected socket the list which contains who is online and who is not
            socket.emit("broadcast-userlist", OnlineOfflineUserList);
            // upon the CONNECTION of a socket the server broadcasts a message to the other connected sockets to let them know
            // broadcast to everyone else number of users, name of connected user, and a message
            socket.to("Lobby").emit("user-connected", onlineUsers[onlineUsers.length - 1], onlineUsers.length, connectMsg);
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("get-past-messages", async (user, recipient) => {
        try {
            console.log("search started...");
            let conversation = undefined;

            if (recipient === "Lobby") {
                conversation = await messageModel.find({
                    recipient: recipient
                });
            } else {
                conversation = await messageModel.find({
                    $or: [{
                            $and: [{
                                sender: user
                            }, {
                                recipient: recipient
                            }]
                        },
                        {
                            $and: [{
                                sender: recipient
                            }, {
                                recipient: user
                            }]
                        }
                    ]
                });
            }

            if (conversation.length < 1) {
                console.log("no messages for this user yet");
                return;
            }

            socket.emit("got-past-messages", conversation);
            console.log(`${conversation.length
                } messages found`);
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("disconnect", (reason) => {
        var disconnectMsg;
        let disconnectedUser = onlineUsers.find((userObj) => userObj.socketID == socket.id); // find the disconnected user by socket id

        if (disconnectedUser == undefined) { // if undefined than not found. this happens only when the server restarts

            disconnectMsg = `someone disconnected due to "${reason}"`;
            console.log("some problem that i dont understand yet :P");
        } else {
            let userIndex = onlineUsers.indexOf(disconnectedUser); // get the index of the userobject
            onlineUsers.splice(userIndex, 1); // remove from the onlineUsers array the disconnected user
            disconnectMsg = `${disconnectedUser.username} disconnected due to "${reason}"`;
        }

        console.log("users-array after one disconnected");
        onlineUsers.forEach((element) => {
            console.log(element);
        });

        console.log(disconnectMsg);
        /* upon the DISCONNECTION of a socket the server broadcasts a message, the disconnected user
         and the new length of the users array to the other connected sockets to let them know */
        socket.to("Lobby").emit("user-disconnected", disconnectedUser, onlineUsers.length, disconnectMsg);
    });

    socket.on("send-message", async (sender, recipient, message) => {
        let toLobby = undefined; // variable to say if the message goes  to lobby or not

        const msgToSaveToDB = new messageModel({
            sender: sender,
            recipient: recipient,
            message: message
        });

        msgToSaveToDB.save();

        if (recipient === "Lobby") {
            toLobby = true;
            /* send to room "lobby" and send the "toLobby variable too because on the client side one function handles all the received messages
            this can be solved differently. There could be another event "receive-message-to-lobby" which is emitted when the recipient is "lobby".
            Then on the client side the socket.on("receive-message-to-lobby",(sender, message)=>{ .... }) 
            would append the messages only to the lobby tab */
            socket.to("Lobby").emit("receive-message", sender, message, toLobby);
        } else {
            toLobby = false; // message isn't going to lobby
            const sockets = await io.fetchSockets();
            let sendMessageToThisSocket = sockets.find((userObj) => userObj.username === recipient);
            // but instead to someone directly

            // check the socket is found at all by recipient name
            if (sendMessageToThisSocket != undefined) { // if it is then send message to the id of the socket (its own room)
                console.log(`message sent from ${sender} to ${sendMessageToThisSocket.id} (${sendMessageToThisSocket.username})`);
                socket.to(sendMessageToThisSocket.id).emit("receive-message", sender, message, toLobby);
            } else {
                console.log("something went wrong sorry :(. ");
                console.log("I think the user is not online because it was not found in the array of online users");
            }
        }
    });
});