import { useState } from "react";
import "@/styles/App.scss";
import { Chatbox, Form } from "@/components/";

const WEBSOCKET_URL = "chat.busywhistling.workers.dev"
// const WEBSOCKET_URL = "localhost:8787"
let websocket: WebSocket;

type Message = {
	author: string;
	message: string;
	timestamp: string;
};

function App() {
	const [user, setUser] = useState("");
	const [room, setRoom] = useState("");
	const [messages, setMessages] = useState([] as Message[]);
	const [participants, setParticipants] = useState([] as string[])
	const [msgCount, setMsgCount] = useState(0);

	const createChatroom = () => {
		if (room === "" || user === "") {
			return;
		}
		websocket = new WebSocket(`wss://${WEBSOCKET_URL}/api/room/${room}/websocket`);
		if (websocket) {
			websocket.onopen = () => websocket && websocket.send(JSON.stringify({ user: user, joined: room }));
			// initially announce { user: User, joined: Room } to websocket
			setMsgCount(msgCount => msgCount + 1); // to invoke a re-render of the App component 
		}
	};

	const sendToSocket = (msg: Message) => {
		if (websocket) {
			websocket.send(JSON.stringify({ message: msg.message }));
			setMsgCount(msgCount => msgCount + 1); // to invoke a re-render of the App component 
		}
	};

	if (websocket) {
		websocket.onmessage = msg => {
			const msgData = JSON.parse(msg.data);
			// msgData is of form {joined:user} or {quit:user} or {name:user, message:msg, timestamp:time}
			if (msgData.joined) {
				setParticipants(participants => [...participants, msgData.joined]);
			} else if (msgData.quit) {
				setParticipants(participants => participants.filter(user => user !== msgData.quit));
			} else if (msgData.ready) {
				return;
			} else {
				setMessages(messages =>
					[...messages,
					{
						author: msgData.name,
						message: msgData.message,
						timestamp: new Date(msgData.timestamp).toString(),
					}]);
			}
			setMsgCount(msgCount => msgCount + 1); // to invoke a re-render of the App component 
		};
	}

	return (
		<main>
			<Form setUser={setUser} setRoom={setRoom} createChatroom={createChatroom} />
			<Chatbox user={user} participants={participants} messages={messages} sendToSocket={sendToSocket} />
		</main>
	);
}

export default App;
