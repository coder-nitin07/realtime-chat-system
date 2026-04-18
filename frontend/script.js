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
    div.innerHTML += `<p>${data.message.content}</p>`;
  });
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

  messages.forEach(msg => {
    div.innerHTML += `<p>${msg.content}</p>`;
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