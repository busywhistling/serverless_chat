import { useState } from "react";
import "@/styles/App.scss";
import { Chatbox, Form } from "@/components/";

//import io from "socket.io-client";
// const socket = io("ws://localhost:6001");

let websocket: WebSocket;

type Message = {
	room: string;
	author: string;
	message: string;
	timestamp: string;
};

function App() {
	const [user, setUser] = useState("");
	const [room, setRoom] = useState("");
	const [messages, setMessages] = useState([] as Message[]);
	const [dummy, setDummy] = useState(0);

	const createChatroom = () => {
		if (room === "" || user === "") {
			return;
		}
		websocket = new WebSocket(
			`wss://edge-chat-demo.busywhistling.workers.dev/api/room/${room}/websocket`,
		);
		// socket.emit("join_room", room);
		websocket.onopen = () => websocket.send(JSON.stringify({ name: user }));
		console.log(`${user} has joined ${room}`);
	};

	const sendToSocket = (msg: Message) => {
		websocket.send(JSON.stringify({ message: msg.message }));

		// socket.emit("send_message", msg);
		// setMessages(messages.concat(msg));
		setDummy(dummy + 1);

		console.log(messages);
	};

	if (websocket !== undefined) {
		websocket.onmessage = msg => {
			// console.log(JSON.parse(msg.data));
			console.log(msg.data);
			const info = JSON.parse(msg.data);

			if (info.joined) return;

			setMessages(
				messages.concat({
					room: room,
					author: info.name,
					message: info.message,
					timestamp: new Date(info.timestamp).toString(),
				}),
			);
		};
	}
	// socket.on("receive_message", (message: Message) => {
	// 	setMessages(messages.concat(message));
	// });

	return (
		<main>
			<Form setUser={setUser} setRoom={setRoom} createChatroom={createChatroom} />
			<Chatbox user={user} room={room} messages={messages} sendToSocket={sendToSocket} />
		</main>
	);
}

export default App;
