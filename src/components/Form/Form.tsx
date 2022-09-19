import "./Form.scss";

interface FormProps {
	setUser: (u: string) => void;
	setRoom: (r: string) => void;
	createChatroom: () => void;
}

const Form = ({ setUser, setRoom, createChatroom }: FormProps) => {
	return (
		<fieldset className="form">
			<legend>Live chat form</legend>
			<div className="description">Enter your username</div>
			<input
				type="text"
				id="name"
				name="name"
				required
				onChange={e => {
					setUser(e.target.value);
				}}
			/>
			<br />
			<div className="description">Enter name of room</div>
			<input
				type="text"
				id="name"
				name="name"
				required
				onChange={e => {
					setRoom(e.target.value);
				}}
			/>
			<br />
			<button onClick={() => createChatroom()}>Submit</button>
		</fieldset>
	);
};

export default Form;
