var socket = io();
var messages = document.getElementById('messages');
var activeUsersList = document.getElementById('active-users');
var form = document.getElementById('form');
var input = document.getElementById('input');
var recipientInput = document.getElementById('recipient');
const messagesContainer = document.getElementById('messages');
var currentUser = localStorage.getItem("nickname");; // Store the current user's nickname

function Scroll() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Function to prompt the user for a nickname until they enter one
function promptForNickname() {
    const nickname = prompt("Enter your nickname...");
    if (nickname) {
        currentUser = nickname;
        localStorage.setItem("nickname", nickname);
        socket.emit('setNickname', nickname);
    } else {
        promptForNickname(); // Keep asking until a nickname is provided
    }
}
if (!currentUser) {
    promptForNickname(); // Call the function to start prompting for a nickname
}
else{
    socket.emit('useNickname', currentUser);
}



form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value) {
        if (input.value.startsWith('/msg ')) {
            const [command, recipient, ...messageArr] = input.value.split(' ');
            const message = messageArr.join(' ');
            socket.emit('private message', { recipient, message });
        } else {
            socket.emit('chat message', input.value, recipientInput.value);
        }
        input.value = '';
    }
});


socket.on('chat message', function (msg) {
    var item = document.createElement('li');
    if (msg.nickname === currentUser) {
        item.innerHTML = `<b>You</b>: ${msg.msg}`;
        messages.appendChild(item);
    }
    else {
        item.innerHTML = `<b>${msg.nickname}</b>: ${msg.msg}`;
        messages.appendChild(item);
    }
    Scroll()
});

function updateActiveUsers(activeUsers) {
    activeUsersList.innerHTML = ''; // Clear the existing list
    recipientInput.innerHTML = '<option value="">--select--</option>'; // Clear the existing dropdown and add the default option
    activeUsers.forEach(user => {
        var activeUserItem = document.createElement('li');
        activeUserItem.textContent = user;
        activeUsersList.appendChild(activeUserItem);

        var activeUserOption = document.createElement('option');
        activeUserOption.textContent = user;
        activeUserOption.value = user;
        recipientInput.appendChild(activeUserOption);
    });
}


socket.on('active users', function (activeUsers) {
    // Update the active users list only if the user's nickname is not present
    updateActiveUsers(activeUsers);
});

socket.on('user connected', (nickname) => {
    var item = document.createElement('li');
    item.textContent = `${nickname} connected`;
    item.style.backgroundColor = "rgba(0, 0, 0, 0.20)";
    messages.appendChild(item);
    Scroll()

    // Update the active users list
    var activeUserItem = document.createElement('li');
    activeUserItem.textContent = nickname;
    activeUsersList.appendChild(activeUserItem);
});

socket.on('user disconnected', (nickname) => {
    var item = document.createElement('li');
    item.textContent = `${nickname} disconnected`;
    item.style.backgroundColor = "rgba(0, 0, 0, 0.20)";
    messages.appendChild(item);
    Scroll()

    // Remove the user from the active users list
    const userListItems = activeUsersList.getElementsByTagName('li');
    for (let i = 0; i < userListItems.length; i++) {
        if (userListItems[i].textContent === nickname) {
            activeUsersList.removeChild(userListItems[i]);
            break;
        }
    }

    // Remove the user from the recipient input dropdown
    const disconnectedOption = recipientInput.querySelector(`option[value="${nickname}"]`);
    if (disconnectedOption) {
        recipientInput.removeChild(disconnectedOption);
    }
});

socket.on('nickname already exists',function(nickname){
    alert(`Nickname ${nickname} already exists! Please enter a different nickname.`);
    promptForNickname();
})

socket.on('private message', function (msg) {
    var item = document.createElement('li');
    if (msg.nickname === currentUser) {
        item.innerHTML = `Private message from <b>You</b> to <b>${msg.recipient}</b>: ${msg.msg}`;
        messages.appendChild(item);
    }
    else {
        item.innerHTML = `Private message from <b>${msg.nickname}</b> to <b>You</b>: ${msg.msg}`;
        messages.appendChild(item);
    }
    Scroll()
});
