require('dotenv').config();
const cors = require('cors');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*"
    }
});

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public')); // serves static files from the 'public' folder
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(cors()); // allow requests from anywhere ('*')



// const uri = process.env.DB_CONNECTON_good;
// const options = { useNewUrlParser: true };
// const callback = () => {
//     console.log('connected to DB!')
// };
// mongoose.connect(uri, options, callback);
// //############ CONNECTION TO DB ############//

server.listen(PORT, () => console.log(`Server listening on port ${process.env.PORT}`));

app.get('/', (req, res) => {
    res.render("app");
});

io.on("connection", (socket) => {
    // the message to display in a variable because it is used more than once
    let connectMsg = `${socket.id} connected`;
    // just console log it on the server
    console.log(connectMsg);
    // upon the CONNECTION of a socket the server broadcasts a message to the other connected sockets to let them know
    socket.broadcast.emit("user-connected", connectMsg);

    socket.on("disconnect", (reason) => {
        // the message to display in a variable because it is used more than once
        let disconnectMsg = `${socket.id} disconnected due to "${reason}"`;
        // just console log it on the server
        console.log(disconnectMsg);
        // upon the DISCONNECTION of a socket the server broadcasts a message to the other connected sockets to let them know
        socket.broadcast.emit("user-disconnected", disconnectMsg);
    });

    socket.on("send-message", message => { // 2. aztan az eventünk a custom event névvel bejön a serverre és eldöntjuk hog ymi legyen vele
        socket.broadcast.emit("receive-message", message); // az lesz vele hogy mivel ez egy egy chat üzenet kiküldjuk akinek kell (itt mindenkinek)
        // itt is egy custom event nevet használunk. a broadcast flaggel kikuldi mindenkinek kivéve a feladónak
    })
});

// Mára: socket.io authentication valahogy valahogy