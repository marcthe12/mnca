import { useState, useEffect } from "react";
import GroupModal from "./GroupModal.jsx";
import Modal from "./Modal.jsx";
import Menu from "./Menu.jsx";
import { useUser } from "./UserProvider.jsx";
import PeersConnectedModalContent from "./PeersConnectedModalContent.jsx";
import isDefined from "../isDefined.js";

export default function UserMenu({ onGroupCreate }) {
	const user = useUser();
	const [
		showCreateGroupModal,
		setShowCreateGroupModal
	] = useState(false);
	const [showPeersConnectedModal, setShowPeersConnectedModal] = useState(false);
	const [status, setStatus] = useState("Offline"); // Initialize status as 'offline'
	//when the status changes
	useEffect(() => {
		if (isDefined(user?.connect)) {
			user.connect.onChange = values => setStatus(values);
			user.connect.handleChange()
			console.log(user.connect)
		}
		return () => {
			if(isDefined(user?.connect)){
				user.connect.onChange = undefined;
			}
		};
	}, []);
	function closegroupmodal() {
		setShowCreateGroupModal(false);
	}

	function closePeersConnectedmodal() {
		setShowPeersConnectedModal(false);
	}

	function openPeersConnectedModal() {
		setShowPeersConnectedModal(true);
	}

	function opengroupmodal() {
		setShowCreateGroupModal(true);
	}
	async function refresh() {
		await user.groupMap.refresh();
	}
	async function handleCreateGroup(group) {
		await onGroupCreate({
			...group,
			users: new Set([user.data.body.user])
		});
		closegroupmodal();
	}

	return (
		<div className="flex items-center justify-between px-4 py-2 bg-secondary-bg shadow-md">
			<div className="flex items-center space-x-4">
				<div>
					<p className="font-semibold">{user.data.body.user}</p>
					<p className="text-lime-50">{status}</p>
				</div>
			</div>
			<div className="relative inline-block text-left">
				<Menu>
					<button
						onClick={() => refresh()}
						className="block w-full px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
						role="menuitem"
					>
						Refresh
					</button>
					<button
						onClick={() => openPeersConnectedModal()}
						className="block w-full px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
						role="menuitem"
					>
						New Group
					</button>
					<Modal show={showPeersConnectedModal}>
						<GroupModal onClose={closePeersConnectedmodal} onCreate={handleCreateGroup} />
					</Modal>
					<button
						onClick={() => opengroupmodal()}
						className="block w-full px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
						role="menuitem"
					>
						Peers Connected
					</button>
					<Modal show={showCreateGroupModal}>
						<PeersConnectedModalContent onClose={closegroupmodal} />
					</Modal>
					<button
						onClick={() => user.signOut()}
						className="block w-full px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
						role="menuitem"
					>
						Sign Out
					</button>
				</Menu>
			</div>
		</div>
	);

}
