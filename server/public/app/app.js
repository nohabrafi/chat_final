var messages = document.getElementById("messages");
var form = document.getElementById("form");
var input = document.getElementById("input");
var currentUser = document.getElementById("current-user");
var logOutButton = document.getElementById("log-out-button");
var logInButton = document.getElementById("log-in-button");
var allUserButtons = document.getElementById("all-users-tabs");
var allUserButtonContents = document.getElementById("all-tab-contents");
var userCount = document.getElementById("user-count");
var lobbyButton = document.getElementById("default-message-tab");
var onlineCnt = 0;
var offlineCnt = 0;
// var socket = io("https://chat-rafi.herokuapp.com");
var socket = io("http://localhost:3000");

// var username = prompt("Enter your username:");
var username = currentUser.innerText;
window.document.title = username;
// currentUser.innerHTML = `user in this tab: <span style="color: rgb(142, 10, 218);">${username}</span>`;

socket.on("connect", () => {
    socket.emit("add-username", username);
});

socket.on("broadcast-userlist", (OnlineOfflineUserList) => fillUserList(OnlineOfflineUserList));

socket.on("disconnect", () => {
    console.log(`you disconnected.`);
    appendTechnicalMsg(`you disconnected.`);
    // on disconnect remove all users
    removeAllUserButtonsExceptLobby(allUserButtons);
    removeAllContentTabsExceptLobby(allUserButtonContents);
    changeUserCounter(0, 0, 0);
});

socket.on("receive-message", (sender, message, toLobby) => {
    appendMessageFromONLINEUser(sender, message, toLobby);
});

socket.on("user-connected", (connectedUser, numberOfOnlioneUsers, connectMsg) => {
    // changeUserCounter(numberOfUsers);
    refreshUserList(connectedUser, true);
    appendTechnicalMsg(connectMsg);
});

socket.on("user-disconnected", (disconnectedUser, numberOfUsers, disconnectMsg) => {
    // changeUserCounter(numberOfUsers);
    refreshUserList(disconnectedUser, false);
    appendTechnicalMsg(disconnectMsg);
});

socket.on("got-past-messages", (conversation) => {
    loadPastConversations(conversation);
});

const getPastMessages = (username, recipient) => {
    socket.emit("get-past-messages", username, recipient);
    console.log("reqest sent");
};

const loadPastConversations = (conversation) => {
    conversation.forEach((msg) => {
        if (msg.recipient === "Lobby" && msg.sender === username) {
            return appendMessageFromLOCALUser(msg.recipient, msg.message);
        } else if (msg.recipient === "Lobby" && msg.sender !== username) {
            return appendMessageFromONLINEUser(msg.sender, msg.message, true);
        } else if (msg.recipient !== "Lobby" && msg.sender === username) {
            return appendMessageFromLOCALUser(msg.recipient, msg.message);
        } else if (msg.recipient !== "Lobby" && msg.sender !== username) {
            return appendMessageFromONLINEUser(msg.sender, msg.message, false);
        }
    });
    appendTechnicalMsg(`you with name ${username} connected.`); // give this message after the other messages have been loaded
};

const changeUserCounter = (online, offline, all) => {
    userCount.innerHTML = `Users <span style="color: green">online</span>: ${online}; Users <span style="color: red">offline</span>: ${offline}; All users: ${all};`; // change the number of users
};

const scrollToBottom = (scrollElement) => {
    scrollElement.parentElement.scrollTop = scrollElement.scrollHeight;
};

const appendTechnicalMsg = (message) => {
    let item = document.createElement("li"); // create list element for message
    item.innerHTML = message; // set innerHTML to message

    let messageHolder = document.querySelector("#messages-Lobby");
    messageHolder.appendChild(item); // append the message to the list of messages
    scrollToBottom(messageHolder);
};

const appendMessageFromLOCALUser = (recipient, message) => {
    // let theMessage = message + "----" + new Date(Date.now()).toString().substring(0, 24);
    let item = document.createElement("li");
    item.style.textAlign = "right";
    item.innerHTML = `YOU-> ${message}`;

    let messageHolder = document.getElementById(`messages-${recipient}`);
    messageHolder.appendChild(item);
    scrollToBottom(messageHolder);
};

const appendMessageFromONLINEUser = (sender, message, toLobby) => {
    /* "toLobby" variable is needed, because the sender has to be a username. it cannot be "lobby" because then the actual sender 
      would be unknown. this is important, because the "sender" tells the function where to append the message. if it would say "lobby",
      the message would go to lobby but the user who sent it would be unknown */
    // let theMessage = message + "----" + new Date(Date.now()).toString().substring(0, 24);
    let item = document.createElement("li");
    item.innerHTML = `${sender} -> ${message}`;

    if (toLobby) {
        // it needs to go to the lobby
        console.log(`recipient lobby`);
        let messageHolder = document.getElementById(`messages-Lobby`);
        messageHolder.appendChild(item);
        scrollToBottom(messageHolder);
    } else {
        // it needs to go to a user directly
        console.log(`recipient messages-${sender}`);
        let messageHolder = document.getElementById(`messages-${sender}`);
        messageHolder.appendChild(item);
        scrollToBottom(messageHolder);
    }
};

// used later AFTER initially filling the user list
const refreshUserList = (user, connected) => {

    /* get all the user buttons in the "all-users-tabs" div and convert them to an array*/
    const allUserButtonsArray = Array.from(allUserButtons.querySelectorAll("button.tablinks"));

    /* try to find the user in the list. if it is found then "refreshUserList" has been called from a user disconnect event.
       in that case the user needs to be deleted from the list. The array.find function returns the user for deletion.*/
    const UserButton = allUserButtonsArray.find((button) => button.innerHTML === user.username);

    if (connected) {
        UserButton.className.replace("offline", "online");
    } else {
        UserButton.className.replace("online", "offline");
    }


    // /* get all the user buttons in the "all-users-tabs" div and convert them to an array*/
    // const allUserButtonsArray = Array.from(
    //     allUserButtons.querySelectorAll("button.tablinks")
    // );
    // /* get all the user buttons in the "all-tab-contents" div and convert them to an array*/
    // const allUserButtonContentsArray = Array.from(
    //     allUserButtonContents.querySelectorAll("div.tabcontent")
    // );

    // /* try to find the user in the list. if it is found then "refreshUserList" has been called from a user disconnect event.
    //    in that case the user needs to be deleted from the list. The array.find function returns the user for deletion.*/
    // const oneUserButton = allUserButtonsArray.find(
    //     (button) => button.innerHTML == user.username
    // );
    // /* the same happens for the button content tabs */
    // const oneUserButtonContent = allUserButtonContentsArray.find(
    //     (div) => div.id == user.username
    // );

    // /* if both of them are undefined then this means that array.find did not find users with the provided name
    //   and it returned "undefined". in this case new button and button content elements will be created for the new user
    //   */
    // if (oneUserButton == undefined && oneUserButtonContent == undefined) {
    //     // creation of the tab buttons //
    //     createUserTabButton(user);
    //     // creation of the tab contents
    //     createUserTabContent(user);
    //     // get the past messages and load them when the response comes back from the server //
    //     getPastMessages(username, user.username);
    // } else {
    //     /* if array.find finds the specified element then it returns it, meaning it can  be removed*/
    //     //remove button
    //     allUserButtons.removeChild(oneUserButton);
    //     // remove content
    //     allUserButtonContents.removeChild(oneUserButtonContent);
    // }
};

// initially fill the user list
const fillUserList = (OnlineOfflineUserList) => {
    // show the count of all online users
    OnlineOfflineUserList.forEach(userObj => {
        if (userObj.online == true) onlineCnt += 1;
    });

    offlineCnt = OnlineOfflineUserList.length - onlineCnt;

    changeUserCounter(onlineCnt, offlineCnt, OnlineOfflineUserList.length);

    OnlineOfflineUserList.forEach((user) => {
        if (user.username != username) {
            // do not list the user where this script is running
            // creation of the tab buttons //
            createUserTabButton(user);
            // creation of the tab contents //
            createUserTabContent(user);
            // get the past messages and load them when the response comes back from the server //
            getPastMessages(username, user.username);
        }
    });

    getPastMessages(username, "Lobby"); // load messages to lobby
    addEventListenerToForm("form-lobby", "lobby"); // add eventlistener to the lobby form only after the user list is loaded
    lobbyButton.click(); // click the lobby button so it is the default messaging tab
};

const openUserChat = (evt, user) => {
    // Declare all variables
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");

    // Get all elements with class="tabcontent" and hide them
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    if (typeof user === "object") {
        document.getElementById(user.username).style.display = "block";
    } else {
        document.getElementById(user).style.display = "block";
    }
    evt.currentTarget.className += " active";

};

const removeAllUserButtonsExceptLobby = (parent) => {
    /* search for all the elements with classname "tablinks" (those are the buttons)
      and iterate over them. if the innerHTML is "Lobby", leave it alone otherwise delete it */
    parent.querySelectorAll(".tablinks").forEach((userButton) => {
        if (userButton.innerHTML != "Lobby") userButton.remove();
    });
    // if the lobby button is not open when the others are deleted then click on lobby automatically
    //   if (
    //     document.querySelector("#default-message-tab").className !=
    //     "tablinks active"
    //   )
    //     document.querySelector("#default-message-tab").className =
    //       "tablinks active";
    lobbyButton.click();
};

const removeAllContentTabsExceptLobby = (parent) => {
    /* search for all the elements with classname "tabcontent" (those are the contents for the buttons)
      and iterate over them. if the id is "Lobby", leave it alone otherwise delete it */
    parent.querySelectorAll(".tabcontent").forEach((messageTab) => {
        if (messageTab.id != "Lobby") messageTab.remove();
    });
};

const createUserTabButton = user => {
    let btn = document.createElement("button"); // every user will be a button; so create it
    btn.innerHTML = user.username; // set the button text to the username
    // set its classname based on status online/offline
    if (user.online === true) {
        btn.className = "tablinks online";
    } else {
        btn.className = "tablinks offline";
    }
    btn.addEventListener("click", () => {
        // adding an event listener for click events and than calling a function
        openUserChat(event, user); // this function changes which user is shown
    });
    allUserButtons.appendChild(btn); // add the users(buttons) to the list
};

const createUserTabContent = (user) => {
    let div = document.createElement("div"); // create the div that holds everything
    div.id = user.username; // the id of the div is the username which it belongs to
    div.className = "tabcontent"; // set its class name

    let h3 = document.createElement("h3"); // create an h3 for some info
    h3.innerHTML = `Send message to ${user.username}`; // set some info in the h3
    h3.className = "content-heading";

    let messageDiv = document.createElement("div"); // div for ul
    messageDiv.className = "message-holder";

    let ul = document.createElement("ul"); //create the unordered list for the messages
    ul.id = `messages-${user.username}`; // give it the id "messages-'username for which this is created'"
    ul.className = "messages-ul";

    let form = document.createElement("form"); // create the form
    form.className = "form";
    form.id = `form-${user.username}`;

    let input = document.createElement("input"); // the input
    input.id = "input";
    input.autocomplete = "off";
    // make the send button behave how it should

    let sendButton = document.createElement("button"); // and the sendbutton
    sendButton.innerHTML = "Send";

    /* append everything the right way */
    messageDiv.appendChild(ul);
    form.appendChild(input);
    form.appendChild(sendButton);

    div.appendChild(h3);
    div.appendChild(messageDiv);
    div.appendChild(form);
    /* append everything the right way */

    /* if style.display is set to "none" right away, then the newly 
      added content tab will not show up automatically, which would look bad */
    div.style.display = "none";

    allUserButtonContents.appendChild(div); // put the tabs inside the div that holds all of the user messages
    // add a custom event listener to the newly created form (custom because it is for the choosen person(tab))

    addEventListenerToForm(form.id, user.username);
};

const addEventListenerToForm = (formID) => {
    document.getElementById(formID).addEventListener("submit", (e) => {
        e.preventDefault(); // prevent form from refreshing page

        let input = document
            .getElementById(formID)
            .getElementsByTagName("input")[0];
        let recipient = document.querySelector(".tablinks.active").innerHTML; // select recipient by active tab

        if (input.value) {
            let sender = username;
            socket.emit("send-message", sender, recipient, input.value); // 1. eloszor emit elünk valamit egy custom event névvel a serverre
            appendMessageFromLOCALUser(recipient, input.value); // append the message
            input.value = ""; // clear input upon sending
        }
    });
};

// getPastMessages.addEventListener("click", () => {
//   let recipient = document.querySelector(".tablinks.active").innerHTML; // select recipient by active tab
//   socket.emit("get-past-messages", username, recipient);
//   console.log("reqest sent");
// });

document.addEventListener("keydown", (e) => {
    if (e.target.matches("input")) return;
    if (e.key === "c") socket.connect();
    if (e.key === "d") socket.disconnect();
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