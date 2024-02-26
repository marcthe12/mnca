import { useState, useEffect } from "react";
import { useUser } from "./UserProvider.jsx";
import Hide from "./Hide.jsx";
import api from "../api.js";

function UserItem({ user, connection, onDelete }) {
	const userContext = useUser();
	const current_user = user === userContext.data.body.user;

	return <li className="p-4 w-full grid grid-cols-[1fr,auto,auto] rounded shadow">
		<span className="grid-cols-1">{user}</span>
		<span className="grid-cols-2 px-2">{current_user ? connection + 1 : connection} Client</span>
		<Hide show={!current_user}>
			<button
				className="grid-cols-3 hover:bg-delete-bg text-gray-800 font-bold py-0.2 px-2 rounded-full shadow"
				onClick={() => onDelete()}
			>
				-
			</button>
		</Hide>
	</li>;
}
function UserList({ users, onAdd, onRemove }) {
	const [search, setSearch] = useState("");
	const [errorMsg, setErrorMsg] = useState("");
	const [status, setStatus] = useState([]);
	const user = useUser();

	useEffect(() => {
		setStatus(user.connect.socketMap.values);
		user.connect.socketMap.onChange = values => setStatus(values);
		return () => {
			user.connect.socketMap.onChange = undefined;
		};
	}, []);

	async function addUser() {
		const searchRequest = api("/search", user.token);
		if (users.has(search)) {
			setErrorMsg("User already added!");
			return;
		}
		const { success, message = "" } = await searchRequest({ username: search });
		if (!success) {
			setErrorMsg(message);
			return;
		}
		await onAdd(search);
	}
	async function removeUser(user) {
		await onRemove(user);
	}

	return <div className=" px-2 border w-full h-40 overflow-auto">
		<div>
			<input
				type="search"
				className="border"
				value={search}
				onChange={(e) => setSearch(e.target.value)} />
			<button className="hover:bg-secondary-bg text-gray-800 font-semibold px-2 rounded shadow" onClick={() => addUser(users)}>Add User</button>
			<Hide show={errorMsg}><p>{errorMsg}</p></Hide>
		</div>
		<ul>
			{[...users]
				.map((user, index) =>
					(<UserItem 
						key={index} 
						user={user} 
						connection={status.filter(row => row.user === user).length} 
						onDelete={() => removeUser(user)} 
					/>)
				)
			}
		</ul>
	</div>;
}

export default function GroupInfo({ onClose, group }) {
	const [name, setName] = useState(group.name);
	const user = useUser();

	async function copyGroupIdToClipboard() {
		await navigator.clipboard.writeText(group.groupId);
	}

	function rename() {
		user.renameGroup(name, { ...group, name });
	}

	async function AddUsers(userId) {
		await user.addUser(userId, { ...group, users: new Set([...group.users, userId]) });
		await user.addGroupCall(userId, group);
	}

	async function RmUsers(userId) {
		const newGroupObj = { ...group, users: new Set(group.users) };
		newGroupObj.users.delete(userId);
		await user.removeUser(userId, newGroupObj);
		await user.deleteGroupCall(userId, group.groupId);
	}


	return (
		<div className="p-4 space-y-4">
			<div className="grid grid-cols-[1fr,auto] gap-4">
				<input
					type="text"
					className="w-full text-2xl font-semibold mb-4 text-menu-text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Enter a new name"
				/>
				<button
					onClick={rename}
					className="px-3 bg-secondary-bg text-white rounded-md hover:bg-primary-dark"
				>
					Rename
				</button>
			</div>
			<div className="flex flex-col space-y-4">
				<label className="text-gray-700">Group ID:</label>
				<div className="flex items-center space-x-2">
					<input
						type="text"
						value={group.groupId}
						readOnly
						className="w-32 bg-white border border-gray-300 p-2 rounded-md text-gray-700"
					/>
					<button
						onClick={copyGroupIdToClipboard}
						className="px-4 py-2 bg-primary-bg text-white rounded-md hover:bg-primary-dark"
					>
						Copy
					</button>
				</div>
				<UserList users={group.users} onAdd={AddUsers} onRemove={RmUsers} />
				<div className="inline-flex space-x-2">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2 bg-primary-bg text-white rounded-l-md hover:bg-primary-dark"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);

}
