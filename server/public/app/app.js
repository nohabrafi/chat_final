var messages = document.getElementById('messages');
var messageHolder = document.getElementById("message-holder");
var form = document.getElementById('form');
var input = document.getElementById('input');
var printUsername = document.getElementById('curr-user');
var logOutButton = document.getElementById('log-out-button');
var logInButton = document.getElementById('log-in-button');
var userTabList = document.getElementById('all-users-tabs');
var allTabContents = document.getElementById("all-tab-contents");
var listTitle = document.getElementById('list-title');

var socket = io("http://localhost:3000");


var username = prompt("Enter your username:");
printUsername.innerHTML = `${username} is logged in`;


socket.on("connect", () => {
    // console.log(`${user} with id ${socket.id} connected.`);
    appendTechnicalMsg(`you with name ${username} connected.`);
    socket.emit("add-username", username);
});

socket.on("broadcastUserList", (userList) => fillUserList(userList));

socket.on("disconnect", () => {
    console.log(`you disconnected.`)
    appendTechnicalMsg(`you disconnected.`);
    // socket.emit("remove-username", username);
});

socket.on("receive-message", (user, message) => { // aztán figyelünk a válaszra  szervertől. ha ez a válasz megegyezik az eventünkel amit akarunk akkor
    // csinaljuk amit kell
    appendMessage(user, message);
});

socket.on("user-connected", (userList, connectMsg) => {
    fillUserList(userList);
    appendTechnicalMsg(connectMsg);
});

socket.on("user-disconnected", (userList, disconnectMsg) => {
    fillUserList(userList);
    appendTechnicalMsg(disconnectMsg);
});


const appendTechnicalMsg = (message) => {

    let item = document.createElement('li');
    item.innerHTML = message;
    messages.appendChild(item);
    messageHolder.scrollTop = messageHolder.scrollHeight;

}

const appendMessage = (user, message) => {

    // let theMessage = message + "----" + new Date(Date.now()).toString().substring(0, 24);
    let item = document.createElement('li');
    if (username == user) {
        item.style.textAlign = 'right';
        item.innerHTML = `YOU-> ${message}`;
    } else {
        item.innerHTML = `${user}-> ${message}`;
    }

    messages.appendChild(item);
    messageHolder.scrollTop = messageHolder.scrollHeight;

}

const fillUserList = (allUsers) => {

    // show the count of all online users
    listTitle.innerHTML = `Number of users on the server: ${allUsers.length}`;

    // the user list is refreshed by first deleting it and then recreating it
    removeAllChildNodesExceptLobby(userTabList);
    removeAllChildNodesExceptLobby(allTabContents);
    // it is recreated by looping throug the users array which comes from the server
    allUsers.forEach(user => {

        if (user.username != username) { // do not list the user where this script is running
            let btn = document.createElement('button'); // every user will be a button; so create it
            btn.innerHTML = user.username; // set the button text to the username
            btn.className = "tablinks"; // set its classname

            btn.addEventListener("click", () => { // adding an event listener for click events and than calling a function
                openUserChat(event, user.username); // this function changes which user is shown
            });
            userTabList.appendChild(btn); // add the users(buttons) to the list

            // creation of the tab contents
            let h3 = document.createElement('h3'); // create an h3 for some info
            h3.innerHTML = `Send message to ${user.username}`; // set some info in the h3

            let ul = document.createElement('ul'); //create the unordered list for the messages 
            ul.id = "messages"; // give it the id "messages"

            let div = document.createElement('div'); // create the div that holds all of this
            div.id = user.username; // the id of the div is the username which it belongs to 
            div.className = "tabcontent"; // set its class name
            div.appendChild(h3); // append the h3 
            div.appendChild(ul); // and the ul to the div

            allTabContents.appendChild(div); // put the tabs inside the div that holds all of the user messages
        }

    });
}

function openUserChat(evt, user) {

    // console.log(valami);
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(user).style.display = "block";
    evt.currentTarget.className += " active";
}

const removeAllChildNodesExceptLobby = (parent) => {
    while (parent.lastChild.id !== "lobby") {
        parent.removeChild(parent.lastChild);
    }
}

const removeAllChildNodes = (parent) => {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent form from refreshing page

    if (input.value) {
        socket.emit("send-message", username, input.value); // 1. eloszor emit elünk valamit egy custom event névvel a serverre
        appendMessage(username, input.value);
        input.value = "";
    }
});

logOutButton.addEventListener('click', () => {
    socket.disconnect();
});

logInButton.addEventListener('click', () => {
    socket.connect();
});


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