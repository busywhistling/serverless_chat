import "./Form.scss";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface FormProps {
	setUser: (u: string) => void;
	setRoom: (r: string) => void;
	createChatroom: () => void;
}

const Form = ({ setUser, setRoom, createChatroom }: FormProps) => {
	const [draftUser, setDraftUser] = useState("");
	const [draftRoom, setDraftRoom] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);

	const setDetails = () => {
		setUser(draftUser);
		setRoom(draftRoom);
		setIsSubmitted(true);
	}

	useEffect(() => {
		createChatroom();
	}, [isSubmitted])

	return (
		<div className="credentials">
			<fieldset>
				{/* Live chat form */}
				<motion.legend>Just add in your details here...</motion.legend>
				<div className="inputbox">
					<div className="label">What should we call you?</div>
					<input
						type="text"
						id="name"
						name="name"
						placeholder="E.g., John"
						readOnly={isSubmitted}
						required
						// onChange={e => {
						// 	setDraftUser(e.target.value);
						// }}
						onBlur={e => setDraftUser(e.target.value)}
					/>
					<div className="comment">
						{draftUser ?
							<div>Nice to have you here, {draftUser}!</div> : <br />}
					</div>
				</div>
				<br />

				<div className="inputbox">
					<div className="label">Which virtual room do you want to join?</div>
					<input
						type="text"
						id="name"
						name="name"
						placeholder="E.g., House of Commons"
						readOnly={isSubmitted}
						required
						onBlur={e => setDraftRoom(e.target.value)}
					/>
					<div className="comment">
						{draftRoom ?
							<div>Oooh, "{draftRoom}" is one of the coolest rooms!</div> : <br />}
					</div>
				</div>
				<br />
				<div className="submissionDialog">
					{isSubmitted ?
						<div>Great, now chat away at the right :)<br />
						</div> :
						<button disabled={isSubmitted} onClick={() => setDetails()}>
							Submit
						</button>
					}
					<div className="rules">Please note the following rules.
						1. No spam please.
						2. Only four participants can connect to a room at a time.
						3. Messages only persist till there is atleast one connected participant.
						4. Refresh the page if you want to start a new session.
					</div>

				</div>
			</fieldset>
		</div>
	);
};

export default Form;
