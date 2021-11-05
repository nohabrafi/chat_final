var messages = document.getElementById('messages');
var messageHolder = document.getElementById("message-holder");
var form = document.getElementById('form');
var input = document.getElementById('input');
var currentUser = document.getElementById('current-user');
var logOutButton = document.getElementById('log-out-button');
var logInButton = document.getElementById('log-in-button');
var allUserButtons = document.getElementById('all-users-tabs');
var allUserButtonContents = document.getElementById("all-tab-contents");
var userCount = document.getElementById('user-count');
var lobbyButton = document.getElementById('default-message-tab');

var socket = io("http://localhost:3000");

var username = prompt("Enter your username:");
window.document.title = username;
currentUser.innerHTML = `user in this tab: <span class="name-color">${username}</span>`;

socket.on("connect", () => {
    appendTechnicalMsg(`you with name ${username} connected.`);
    socket.emit("add-username", username);
});

socket.on("broadcastUserList", (userList) => fillUserList(userList));

socket.on("disconnect", () => {
    console.log(`you disconnected.`)
    appendTechnicalMsg(`you disconnected.`);
    // on disconnect remove all users
    removeAllUserButtonsExceptLobby(allUserButtons);
    removeAllContentTabsExceptLobby(allUserButtonContents);
    changeUserCounter(0);
});

socket.on("receive-message", (user, message) => { // aztán figyelünk a válaszra  szervertől. ha ez a válasz megegyezik az eventünkel amit akarunk akkor
    // csinaljuk amit kell
    appendMessage(user, message);
});

socket.on("user-connected", (connectedUser, numberOfUsers, connectMsg) => {
    changeUserCounter(numberOfUsers);
    refreshUserList(connectedUser);
    appendTechnicalMsg(connectMsg);
});

socket.on("user-disconnected", (disconnectedUser, numberOfUsers, disconnectMsg) => {
    changeUserCounter(numberOfUsers);
    refreshUserList(disconnectedUser);
    appendTechnicalMsg(disconnectMsg);
});


const changeUserCounter = (numberOfUsers) => {
    userCount.innerHTML = `Users online: ${numberOfUsers}`;
}

const appendTechnicalMsg = (message) => {

    let item = document.createElement('li');
    item.innerHTML = message;

    document.querySelector('#messages-lobby').appendChild(item);
    // messages.appendChild(item);
    // messageHolder.scrollTop = messageHolder.scrollHeight;

}

const appendMessage = (user, message) => {

    // let theMessage = message + "----" + new Date(Date.now()).toString().substring(0, 24);
    let item = document.createElement('li');
    if (username == user) {
        item.style.textAlign = 'right';
        item.innerHTML = `YOU-> ${message}`;
    } else {
        item.innerHTML = `${user} -> ${message}`;
    }

    document.querySelector('#messages-lobby').appendChild(item);
    // messages.appendChild(item);
    // messageHolder.scrollTop = messageHolder.scrollHeight;

}
// used later AFTER initially filling the user list
const refreshUserList = (user) => {

    /* get all the user buttons in the "all-users-tabs" div and convert them to an array*/
    const allUserButtonsArray = Array.from(allUserButtons.querySelectorAll('button.tablinks'));
    /* get all the user buttons in the "all-tab-contents" div and convert them to an array*/
    const allUserButtonContentsArray = Array.from(allUserButtonContents.querySelectorAll('div.tabcontent'));

    /* try to find the user in the list. if it is found then "refreshUserList" has been called from a user disconnect event.
     in that case the user needs to be deleted from the list. The array.find function returns the user for deletion.*/
    const oneUserButton = allUserButtonsArray.find(button => button.innerHTML == user.username);
    /* the same happens for the button content tabs */
    const oneUserButtonContent = allUserButtonContentsArray.find(div => div.id == user.username);

    /* if both of them are undefined then this means that array.find did not find users with the provided name
    and it returned "undefined". in this case new button and button content elements will be created for the new user
    */
    if (oneUserButton == undefined && oneUserButtonContent == undefined) {

        // creation of the tab buttons //
        createUserTabButton(user);

        // creation of the tab contents
        createUserTabContent(user);

    } else {

        /* if array.find finds the specified element then it returns it, which means that it can easily be removed*/
        //remove button
        allUserButtons.removeChild(oneUserButton);
        // remove content
        allUserButtonContents.removeChild(oneUserButtonContent);

    }
}

// initially fill the user list 
const fillUserList = (userList) => {

    // show the count of all online users
    changeUserCounter(userList.length);

    userList.forEach(user => {
        if (user.username != username) { // do not list the user where this script is running
            // creation of the tab buttons //
            createUserTabButton(user);
            // creation of the tab contents //
            createUserTabContent(user);
        }
    });

    addEventListenerToForm("form-lobby");
    lobbyButton.click();

}

const openUserChat = (evt, user) => {

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

const removeAllUserButtonsExceptLobby = (parent) => {

    console.log(parent.querySelector("button").innerHTML);

    parent.querySelectorAll('.tablinks').forEach((userButton) => {
        if (userButton.innerHTML != "Lobby") userButton.remove();
    });

    if (parent.querySelector('#default-message-tab').className != "tablinks active") lobbyButton.click();

}

const removeAllContentTabsExceptLobby = (parent) => {

    console.log(parent.querySelector("div").id);

    parent.querySelectorAll('.tabcontent').forEach((messageTab) => {
        if (messageTab.id != "Lobby") messageTab.remove();
    });

}

const createUserTabButton = (user) => {

    let btn = document.createElement('button'); // every user will be a button; so create it
    btn.innerHTML = user.username; // set the button text to the username
    btn.className = "tablinks"; // set its classname

    btn.addEventListener("click", () => { // adding an event listener for click events and than calling a function
        openUserChat(event, user.username); // this function changes which user is shown
    });
    allUserButtons.appendChild(btn); // add the users(buttons) to the list

}

const createUserTabContent = (user) => {

    let div = document.createElement('div'); // create the div that holds everything
    div.id = user.username; // the id of the div is the username which it belongs to 
    div.className = "tabcontent"; // set its class name

    let h3 = document.createElement('h3'); // create an h3 for some info
    h3.innerHTML = `Send message to ${user.username}`; // set some info in the h3
    h3.className = "content-heading";

    let messageDiv = document.createElement('div');
    messageDiv.className = "message-holder";

    let ul = document.createElement('ul'); //create the unordered list for the messages 
    ul.id = `messages-${user.username}`; // give it the id "messages-'username for which this is created'"

    let form = document.createElement('form'); // create the form
    form.className = "form";
    form.id = `form-${user.username}`;

    let input = document.createElement('input'); // the input
    input.id = "input";
    input.autocomplete = "off";
    // make the send button behave how it should


    let sendButton = document.createElement('button'); // and the sendbutton
    sendButton.innerHTML = "Send";


    /* append everything the right way */
    messageDiv.appendChild(ul);
    form.appendChild(input);
    form.appendChild(sendButton);

    div.appendChild(h3); // append the h3 
    div.appendChild(messageDiv);
    div.appendChild(form);
    /* append everything the right way */

    /* if style.display is set to "none" right away, then the newly 
    added content tab will not show up automatically, which would look bad */
    div.style.display = "none";

    allUserButtonContents.appendChild(div); // put the tabs inside the div that holds all of the user messages
    addEventListenerToForm(form.id);
}

const addEventListenerToForm = (formID) => {

    document.getElementById(formID).addEventListener('submit', (e) => {
        e.preventDefault(); // prevent form from refreshing page

        if (input.value) {
            socket.emit("send-message", username, input.value); // 1. eloszor emit elünk valamit egy custom event névvel a serverre
            appendMessage(username, input.value);
            input.value = "";
        }
    });

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