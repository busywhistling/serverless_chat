import { useState, useRef, useEffect } from "react";
import "./Chatbox.scss";

type Message = {
	author: string;
	message: string;
	timestamp: string;
};

interface ChatboxProps {
	user: string;
	participants: string[];
	messages: Message[];
	sendToSocket: (msg: Message) => void;
	msgCount: number;
}

const Chatbox = ({ user, participants, messages, sendToSocket, msgCount }: ChatboxProps) => {
	// const participants = [...new Set(messages.map(msg => msg.author).concat(user))]; // get unique participants, including user (before any message has been sent)

	const [draft, setDraft] = useState("");

	const composeBoxRef = useRef<null | HTMLTextAreaElement>(null);
	const sendMessage = () => {
		if (draft !== "") {
			const msg = {
				author: user,
				message: draft,
				timestamp: new Date().toString(),
			};
			sendToSocket(msg);
			setDraft("");
			if (typeof composeBoxRef.current?.value == 'string') {
				composeBoxRef.current.value = "";
			}
		}
	};

	const messagesEndRef = useRef<null | HTMLDivElement>(null);
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	return (
		<div className="chatbox">
			<div className="header">
				&#128172; {participants.join(", ")}
				{/* {room && `(${room})`} */}
			</div>
			<div className="body">
				<div className="messages">
					{messages.map(msg => (
						msg.author &&
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
					<div ref={messagesEndRef} />
				</div>
			</div>
			<div className="composebox">
				<div className="messageinput">
					<textarea
						id="messageinput"
						name="messageinput"
						placeholder="Type something..."
						ref={composeBoxRef}
						onBlur={e => setDraft(e.target.value)}></textarea>
					<button onClick={() => sendMessage()}>Send</button>
				</div>
			</div>
			<div className="dummy">{msgCount}</div>
		</div>
	);
};

export default Chatbox;
