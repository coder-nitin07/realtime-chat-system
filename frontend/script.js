const BASE_URL = "http://localhost:3000"; // change if needed
let socket;
let currentChatId = null;

// run on page load
window.onload = async () => {
  connectSocket();
  await loadChats();
};


// auto socket connection
function connectSocket() {
  const token = localStorage.getItem("token");

  socket = io(BASE_URL, {
    auth: { token }
  });

  socket.on("connect", () => {
    console.log("Connected:", socket.id);
  });

  socket.on("receive_message", (data) => {
    const div = document.getElementById("messages");
    div.innerHTML += `
      <p>
        <small>${data.message.senderId?.name}</small><br>
        ${data.message.content}
      </p>
    `;
  });
}



// search Users
async function searchUsers() {
  const token = localStorage.getItem("token");
  const query = document.getElementById("searchInput").value;

  const res = await fetch(
    `${BASE_URL}/users/getUsers?search=${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await res.json();

  const users = data.users.users; // ✅ correct path

  renderSearchResults(users);
}

function renderSearchResults(users) {
  const container = document.getElementById("searchResults");
  container.innerHTML = "";

  users.forEach(user => {
    const div = document.createElement("div");

    div.innerText = `${user.name}`;

    div.style.cursor = "pointer";

    // 👇 IMPORTANT CHANGE
    // div.onclick = () => toggleUserSelection(user, div);
    div.onclick = () => createPrivateChat(user._id);

    container.appendChild(div);
  });
}

// create private chat
async function createPrivateChat(userId) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/chat/createRoom`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      type: "private",
      participants: [userId]
    })
  });

  const data = await res.json();

  // reload chats
  // await loadChats();
    const chatId = data.room._id;
  selectChat(chatId);
}


// function toggleUserSelection(user) {
//   const exists = selectedUsers.find(u => u._id === user._id);

//   if (exists) {
//     selectedUsers = selectedUsers.filter(u => u._id !== user._id);
//   } else {
//     selectedUsers.push(user);
//   }

//   console.log("Selected:", selectedUsers);
// }

let selectedUsers = [];

function toggleUserSelection(user, element) {
  const exists = selectedUsers.find(u => u._id === user._id);

  if (exists) {
    selectedUsers = selectedUsers.filter(u => u._id !== user._id);
    element.style.background = "";
  } else {
    selectedUsers.push(user);
    element.style.background = "lightgreen";
  }

  console.log("Selected:", selectedUsers);
}

// open Group
function openGroupCreator() {
  const div = document.getElementById("groupCreator");
  div.style.display = "block";
}

//  fetch chats
async function loadChats() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/chat/getChats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const chats = await res.json();

  renderChats(chats.getChat);
}


// render chat lists
function renderChats(chats) {
  const container = document.getElementById("chatList");
  container.innerHTML = "";

  const token = localStorage.getItem("token");
  const payload = JSON.parse(atob(token.split(".")[1]));
  const currentUserId = payload.id;

  chats.forEach(chat => {
    const div = document.createElement("div");

    if (chat.type === "group") {
      // ✅ Group chat
      div.innerText = chat.groupName || "Unnamed Group";
    } else {
      // ✅ Private chat
      const otherUser = chat.participants.find(
        p => p._id.toString() !== currentUserId
      );

      div.innerText = otherUser?.name || otherUser?.username || "User";
    }

    div.style.cursor = "pointer";
    div.style.padding = "8px";
    div.style.borderBottom = "1px solid #ccc";

    div.onclick = () => selectChat(chat._id);

    container.appendChild(div);
  });
}


// selec chats
async function selectChat(chatId) {
  currentChatId = chatId;

  socket.emit("join_room", chatId);

  await loadMessages(chatId);
}


// load messages
async function loadMessages(chatId) {
  const token = localStorage.getItem("token");

  const res = await fetch(
  `${BASE_URL}/chat/getMessages?conversationId=${chatId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

  const data = await res.json();
  const messages = data.data;

  const div = document.getElementById("messages");
  div.innerHTML = "";
console.log("first", messages);
  messages.forEach(msg => {
    div.innerHTML += `
       <p>
          <small>${msg.senderId?.name}</small><br>
          ${msg.content}
      </p>
    `;
  });
}

// ---------------- LOGIN ----------------
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.accessToken);

    window.location.href = "chat.html";

  } catch (err) {
    document.getElementById("error").innerText = err.message;
  }
}

// ---------------- SOCKET ----------------
// function connectSocket() {
//   const token = localStorage.getItem("token");

//   socket = io(BASE_URL, {
//     auth: { token }
//   });

//   socket.on("connect", () => {
//     console.log("Connected:", socket.id);
//   });

//   socket.on("receive_message", (data) => {
//     const div = document.getElementById("messages");
//     div.innerHTML += `<p>${data.message.content}</p>`;
//   });
// }

// ---------------- ROOM ----------------
// function joinRoom() {
//   const roomId = document.getElementById("roomId").value;
//   socket.emit("join_room", roomId);
// }

// ---------------- SEND MESSAGE ----------------
function sendMessage() {
  if (!currentChatId) {
    alert("Please select a chat first");
    return;
  }

  const content = document.getElementById("messageInput").value;

  socket.emit("send_message", {
    conversationId: currentChatId,
    content
  });
}


async function createGroup() {
  const token = localStorage.getItem("token");
  const groupName = document.getElementById("groupName").value;

  if (!groupName) {
    alert("Enter group name");
    return;
  }

  if (selectedUsers.length < 2) {
    alert("Select at least 2 users");
    return;
  }

  const participantIds = selectedUsers.map(u => u._id);

  try {
    const res = await fetch(`${BASE_URL}/chat/createRoom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        type: "group",
        groupName,
        participants: participantIds
      })
    });

    const data = await res.json();

    console.log("Group created:", data);

    // reset UI
    selectedUsers = [];
    document.getElementById("groupName").value = "";
    document.getElementById("groupCreator").style.display = "none";
    document.getElementById("searchResults").innerHTML = "";

    // reload chats
    await loadChats();

  } catch (err) {
    console.error(err);
    alert("Error creating group");
  }
}



// register user
async function register() {
  const name = document.getElementById("name").value;
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, username, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Register failed");
    }

    // save token
    localStorage.setItem("token", data.token);

    // redirect to chat
    window.location.href = "chat.html";

  } catch (err) {
    document.getElementById("error").innerText = err.message;
  }
}