import { useState } from "react";
import "@/styles/App.scss";
import { Chatbox, Form } from "@/components/";

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
	const [loginTime, setLoginTime] = useState(0);
	const [messages, setMessages] = useState([] as Message[]);
	const [dummy, setDummy] = useState(0);
	const [isRoomJoined, setIsRoomJoined] = useState(false);

	const createChatroom = () => {
		if (room === "" || user === "") {
			return;
		}
		console.log("Function being run")
		websocket = new WebSocket(
			`wss://edge-chat-demo.busywhistling.workers.dev/api/room/${room}/websocket`,
		);
		setDummy(dummy + 1);

		websocket.onopen = () => websocket.send(JSON.stringify({ name: user }));
		console.log(`${user} has joined ${room}`);
	};

	const sendToSocket = (msg: Message) => {
		websocket.send(JSON.stringify({ message: msg.message }));
		setDummy(dummy + 1);
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

	return (
		<main>
			<Form setUser={setUser} setRoom={setRoom} createChatroom={createChatroom} setIsRoomJoined={setIsRoomJoined} />
			<Chatbox user={user} room={room} messages={messages} sendToSocket={sendToSocket} isRoomJoined={isRoomJoined} />
		</main>
	);
}

export default App;
