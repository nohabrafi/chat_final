var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');
var printUsername = document.getElementById('curr-user');
var logOutButton = document.getElementById('log-out-button');

var username = prompt("Enter your username:");
printUsername.innerHTML = `${username} is logged in`;
// window.sessionStorage.setItem("user", user);

const socket = io("http://localhost:3000");

socket.on("connect", () => {
    // console.log(`${user} with id ${socket.id} connected.`);
    appendTechnicalMsg(`you with name ${username} connected.`);
    socket.emit("add-username", username);
});

socket.on("disconnect", () => {
    console.log(`you disconnected.`)
    appendTechnicalMsg(`you disconnected.`);
    // socket.emit("remove-username", username);
});

socket.on("receive-message", (user, message) => { // aztán figyelünk a válaszra  szervertől. ha ez a válasz megegyezik az eventünkel amit akarunk akkor
    // csinaljuk amit kell
    appendMessage(user, message);
});

socket.on("user-connected", connectMsg => {
    appendTechnicalMsg(connectMsg);
});

socket.on("user-disconnected", disconnectMsg => {
    appendTechnicalMsg(disconnectMsg);
});

form.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent form from refreshing page

    if (input.value) {
        socket.emit("send-message", username, input.value); // 1. eloszor emit elünk valamit egy custom event névvel a serverre
        appendMessage(username, input.value);
        input.value = "";
    }
});

logOutButton.addEventListener('click', () => {
    socket.disconnect(username);
})

const appendTechnicalMsg = (message) => {

    let messageHolder = document.getElementById("message-holder");
    let item = document.createElement('li');
    item.innerHTML = message;
    messages.appendChild(item);
    messageHolder.scrollTop = messageHolder.scrollHeight;

}


const appendMessage = (user, message) => {

    // let theMessage = message + "----" + new Date(Date.now()).toString().substring(0, 24);

    let messageHolder = document.getElementById("message-holder");
    let item = document.createElement('li');

    if (username == user) {
        item.style.textAlign = 'right';
    }

    item.innerHTML = `${user}-> ${message}`;
    messages.appendChild(item);
    messageHolder.scrollTop = messageHolder.scrollHeight;

}

document.addEventListener('keydown', e => {
    if (e.target.matches('input')) return;
    if (e.key === 'c') socket.connect();
    if (e.key === 'd') socket.disconnect();
});










// const usernameStyle = (username) => {
//     return "<span id='username-style'>" + username + ":" + "</span>";
// }

// const messageStyle = (message) => {
//     return "<span id='message-style'>" + message + "</span>";
// }

// const sentAtStyle = (sentAt) => {
//     return "<span id='sentAt-style'>" + sentAt + "</span>";
// }

// const üzenetÖsszefűzőFüggvény = (username, message, sentAt) => {
//     return `<span id='username-style'>${username}:</span><span id='message-style'>${message}</span><span id='sentAt-style'>${sentAt}</span>`;
// }

// if (sessionStorage.getItem("username")) {

//     window.onload = () => {
//         user = sessionStorage.getItem("username");
//         document.getElementById('curr-user').innerHTML = "logged in: " + sessionStorage.getItem("username");
//         console.log("user" + user + " entered the chat");
//         document.title = "Chat of " + user;
//         getAllMessages();

//     }

// } else {
//     window.location.href = "http://localhost:8000/login_page";
// }



// function appendMessageDB(username, message, sentAt) {

//     let messageHolder = document.getElementById("message-holder");
//     let item = document.createElement('li');
//     // if (username == user) {
//     //     item.style.textAlign = 'right';
//     // }
//     item.innerHTML = üzenetÖsszefűzőFüggvény(username, message, sentAt);
//     messages.appendChild(item);
//     messageHolder.scrollTop = messageHolder.scrollHeight;
//     //window.scrollTo(0, document.body.scrollHeight);
// }

// const logOutUser = () => {
//     sessionStorage.clear();
//     console.log(sessionStorage);
//     console.log("session storage cleared, user logged out");
//     window.location.href = "http://localhost:8000/login_page";
// }



// const myPostMessage = (user, message) => {

//     fetch('http://localhost:8000/post_message', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 username: user,
//                 message: message
//             })
//         }).then(res => {
//             return res.json();
//         }).then(data => {
//             getOneMessage();
//             console.log(data);
//         })
//         .catch(error => console.log(error));
// }

// const getAllMessages = () => { /// leegyszerusiteni !!!

//     fetch('http://localhost:8000/get_messages')
//         .then(res => res.json())
//         .then(data => {


//             for (var i = 0; i < data.length; i++) {

//                 let username = data[i].username;
//                 let message = data[i].message;
//                 let sentAt = new Date(data[i].date).toString().substring(0, 24);

//                 let messageHolder = document.getElementById("message-holder");
//                 let item = document.createElement('li');
//                 if (username == user) {
//                     item.style.textAlign = 'right';
//                 }
//                 item.innerHTML = usernameStyle(username) + " " + messageStyle(message) + " " + sentAtStyle(sentAt);
//                 messages.appendChild(item);
//                 messageHolder.scrollTop = messageHolder.scrollHeight;
//                 //window.scrollTo(0, document.body.scrollHeight);
//             }
//         })
//         .catch(error => console.log(error));

//     console.log("got all messages")
// }

// const getOneMessage = () => { // itt is visszajön az összes üzenet, nem ideális

//     fetch('http://localhost:8000/get_messages')
//         .then(res => res.json())
//         .then(data => {
//             console.log("message came back");

//             let username = data[data.length - 1].username;
//             let message = data[data.length - 1].message;
//             let sentAt = new Date(data[data.length - 1].date).toString().substring(0, 24);

//             console.log("username: " + username + ";" + " " + "message: " + message + " " + "sentAt: " + sentAt + ";");

//             let messageHolder = document.getElementById("message-holder");
//             var item = document.createElement('li');
//             if (username == user) {
//                 item.style.textAlign = 'right';
//             }
//             item.innerHTML = usernameStyle(username) + " " + messageStyle(message) + " " + sentAtStyle(sentAt);
//             messages.appendChild(item);
//             messageHolder.scrollTop = messageHolder.scrollHeight;

//         })
//         .catch(error => console.log(error));

// }

// const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }; // opciók a showtime fügvényhez

// function showTime(givenTime) {
//     var timeNow = new Date(givenTime);
//     var hours = timeNow.getHours();
//     var minutes = timeNow.getMinutes();
//     var seconds = timeNow.getSeconds();
//     //var timeString = "" + ((hours > 12) ? hours - 12 : hours);
//     var timeString = "" + hours;
//     timeString += ((minutes < 10) ? ":0" : ":") + minutes;
//     timeString += ((seconds < 10) ? ":0" : ":") + seconds;
//     //timeString += (hours >= 12) ? " P.M." : " A.M.";
//     //document.htmlClock.timeField.value = timeString;
//     //timerID = setTimeout("showTime()", 1000);
//     return timeString;
// }