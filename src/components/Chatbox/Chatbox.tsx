import { useState } from "react";
import "./Chatbox.scss";

type Message = {
	room: string;
	author: string;
	message: string;
	timestamp: string;
};

interface ChatboxProps {
	user: string;
	room: string;
	messages: Message[];
	sendToSocket: (msg: Message) => void;
}

const Chatbox = ({ user, room, messages, sendToSocket }: ChatboxProps) => {
	const participants = [...new Set(messages.map(msg => msg.author).concat(user))]; // get unique participants, including user (before any message has been sent)

	const [draft, setDraft] = useState("");

	const sendMessage = () => {
		if (draft !== "") {
			const msg = {
				room: room,
				author: user,
				message: draft,
				timestamp: new Date().toString(),
			};
			sendToSocket(msg);
		}
	};

	return (
		<div className="chatbox">
			<div className="header">
				&#128172; {participants.join(", ")} {room && `(${room})`}
			</div>

			<div className="body">
				<div className="messages">
					{messages.map(msg => (
						<div
							key={new Date(msg.timestamp).toString()}
							className={`message ${msg.author === user ? "sent" : "received"}`}>
							{msg.author !== user && (
								<div className="messageAvatar" title={msg.author}>
									{Array.from(msg.author)[0]}
								</div>
							)}
							<div className="messageContent">
								{msg.message}
								<div className="time">
									{new Date(msg.timestamp).toLocaleTimeString()}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
			<div className="composebox">
				<div className="messageinput">
					<textarea
						id="messageinput"
						name="messageinput"
						placeholder="Write your message..."
						onChange={e => setDraft(e.target.value)}></textarea>
					<button onClick={() => sendMessage()}>Send</button>
				</div>
			</div>
		</div>
	);
};

export default Chatbox;
