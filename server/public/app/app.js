var messages = document.getElementById("messages");
var form = document.getElementById("form");
var input = document.getElementById("input");
var currentUser = document.getElementById("current-user");
var logOutButton = document.querySelector(".logout-button");
var allUserButtons = document.getElementById("all-users-tabs");
var allUserButtonContents = document.getElementById("all-tab-contents");
var userCount = document.getElementById("user-count");
var lobbyButton = document.getElementById("default-message-tab");
var onlineCnt = 0;
var offlineCnt = 0;
var allUserCnt = 0;
// var socket = io("https://chat-rafi.herokuapp.com");
var socket = io("http://localhost:3000");

var username = currentUser.innerText;
window.document.title = username;

socket.on("connect", () => {
    socket.emit("add-username", username);
});

socket.on("broadcast-userlist", (OnlineOfflineUserList) => fillUserList(OnlineOfflineUserList));

socket.on("disconnect", () => {
    console.log(`you disconnected.`);
    window.location.href = "/logout";
});

socket.on("receive-message", (sender, message, toLobby) => {
    appendMessageFromONLINEUser(sender, message, toLobby);
});

socket.on("user-connected", (connectedUser, OnlineOfflineUserList, connectMsg) => {
    changeUserCounter(OnlineOfflineUserList);
    refreshUserList(connectedUser, true);
    appendTechnicalMsg(connectMsg);
});

socket.on("user-disconnected", (disconnectedUser, OnlineOfflineUserList, disconnectMsg) => {
    changeUserCounter(OnlineOfflineUserList);
    refreshUserList(disconnectedUser, false);
    appendTechnicalMsg(disconnectMsg);
});

socket.on("got-past-messages", (conversation, fromFillUserListTrueOrFalse) => {
    loadPastConversations(conversation, fromFillUserListTrueOrFalse);
});

const getPastMessages = (username, recipient, fromFillUserListTrueOrFalse) => {
    socket.emit("get-past-messages", username, recipient, fromFillUserListTrueOrFalse);
};

const loadPastConversations = (conversation, fromFillUserListTrueOrFalse) => {
    // get all the past messages
    conversation.forEach((msg) => {
        if (msg.recipient === "Lobby" && msg.sender === username) {
            return appendMessageFromLOCALUser(msg.recipient, msg.message);
        } else if (msg.recipient === "Lobby" && msg.sender !== username) {
            return appendMessageFromONLINEUser(msg.sender, msg.message, true, fromFillUserListTrueOrFalse);
        } else if (msg.recipient !== "Lobby" && msg.sender === username) {
            return appendMessageFromLOCALUser(msg.recipient, msg.message);
        } else if (msg.recipient !== "Lobby" && msg.sender !== username) {
            return appendMessageFromONLINEUser(msg.sender, msg.message, false, fromFillUserListTrueOrFalse);
        }
    });
    appendTechnicalMsg(`you with name ${username} connected.`); // give this message after the other messages have been loaded
};

const changeUserCounter = (OnlineOfflineUserList) => {
    // change user statistics
    onlineCnt = 0;
    offlineCnt = 0;
    allUserCnt = 0;

    OnlineOfflineUserList.forEach(userObj => {
        if (userObj.online == true) {
            onlineCnt += 1;
        } else {
            offlineCnt += 1;
        };
    });
    allUserCnt = OnlineOfflineUserList.length;

    userCount.innerHTML = `Users <span style="color: green">online</span>: ${onlineCnt}; Users <span style="color: red">offline</span>: ${offlineCnt}; All users: ${allUserCnt};`; // change the number of users
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

const appendMessageFromONLINEUser = (sender, message, toLobby, fromFillUserListTrueOrFalse) => {
    /* "toLobby" variable is needed, because the sender has to be a username. it cannot be "lobby" because then the actual sender 
      would be unknown. this is important, because the "sender" tells the function where to append the message. if it would say "lobby",
      the message would go to lobby but the user who sent it would be unknown */
    let item = document.createElement("li");
    item.innerHTML = `${sender} -> ${message}`;

    if (toLobby) {
        // it needs to go to the lobby
        let messageHolder = document.getElementById(`messages-Lobby`);
        messageHolder.appendChild(item);
        scrollToBottom(messageHolder);
        // we dont want this on the initial load 
        if (!fromFillUserListTrueOrFalse) {
            if (messageHolder.parentNode.parentNode.style.display == "none") {
                makeUserUnread("Lobby");
            }
        }

    } else {
        // it needs to go to a user directly
        let messageHolder = document.getElementById(`messages-${sender}`);
        messageHolder.appendChild(item);
        scrollToBottom(messageHolder);
        // we dont want this on the initial load 
        if (!fromFillUserListTrueOrFalse) {
            if (messageHolder.parentNode.parentNode.style.display == "none") {
                makeUserUnread(sender);
            }
        }
    }
};

const makeUserUnread = (sender) => {
    // get the button where there is a new message and make it unread by changing the calssname
    let allUserButtonsArray = Array.from(allUserButtons.querySelectorAll("button.tablinks"));
    userButtonToChange = allUserButtonsArray.find(button => button.innerHTML === sender);
    if (!(userButtonToChange.className.includes("unread"))) {
        userButtonToChange.className += " unread";
    }
}

// used later AFTER initially filling the user list
const refreshUserList = (user, connected) => {
    let fromFillUserListTrueOrFalse = false;
    // get all the user buttons in the "all-users-tabs" div and convert them to an array
    const allUserButtonsArray = Array.from(allUserButtons.querySelectorAll("button.tablinks"));
    // get all the user button tabs in the "all-tab-contents" div and convert them to an array
    const allUserButtonContentsArray = Array.from(allUserButtonContents.querySelectorAll("div.tabcontent"));
    // try to find the user in the list. 
    const UserButton = allUserButtonsArray.find(button => button.innerHTML === user.username);
    // the same happens for the button content tabs 
    const UserButtonContent = allUserButtonContentsArray.find(div => div.id === user.username);

    // if buttons and tabs don't exist, create them. this happens when a new user registers 
    if (UserButton == undefined && UserButtonContent == undefined) {
        // creation of the tab buttons
        createUserTabButton(user);
        // creation of the tab contents
        createUserTabContent(user);
        // get the past messages and load them when the response comes back from the server
        getPastMessages(username, user.username, fromFillUserListTrueOrFalse);
    } else {
        // if they exist, change the look depending on the status
        if (connected) {
            UserButton.className = UserButton.className.replace("offline", "online");
        } else {
            UserButton.className = UserButton.className.replace("online", "offline");
        }
    }
};

// initially fill the user list
const fillUserList = (OnlineOfflineUserList) => {
    // fromFillUserListTrueOrFalse variabe is needed because on initial load the unread class should not be applied
    let fromFillUserListTrueOrFalse = true;
    // show the count of all online users
    changeUserCounter(OnlineOfflineUserList);

    OnlineOfflineUserList.forEach((user) => {
        if (user.username != username) {
            // do not list the user where this script is running
            // creation of the tab buttons //
            createUserTabButton(user);
            // creation of the tab contents //
            createUserTabContent(user);
            // get the past messages and load them when the response comes back from the server //
            getPastMessages(username, user.username, fromFillUserListTrueOrFalse);
        }
    });

    getPastMessages(username, "Lobby", fromFillUserListTrueOrFalse); // load messages to lobby
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
    if (typeof user === "object") { // check if the passed in user is an object, because Lobby is not an object and user.username would not work
        document.getElementById(user.username).style.display = "block";
    } else {
        document.getElementById(user).style.display = "block";
    }
    if (evt.currentTarget.className.includes("unread")) { // if the button already has the unread class do nothing
        if (evt.currentTarget.innerHTML == "Lobby") { // if the clicked button is the lobby than don't apply the online class
            evt.currentTarget.className = evt.currentTarget.className.replace(" unread", "");
        } else {
            evt.currentTarget.className = evt.currentTarget.className.replace(" unread", " online");
        }
    }

    evt.currentTarget.className += " active";

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

    // add a custom event listener to the newly created form 
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

logOutButton.addEventListener("click", () => {
    // this also works but the disconnection reason will be "transport closed" 
    // socket.connected = false; 
    // socket.disconnected = true;
    socket.disconnect();
});
// good for debugging
document.addEventListener("keydown", (e) => {
    if (e.target.matches("input")) return;
    if (e.key === "c") socket.connect();
    if (e.key === "d") socket.disconnect();
});