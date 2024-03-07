import { useEffect, useState } from "react";
import MainChatArea from "./MainChatArea.jsx";
import TabButton from "./TabButton.jsx";
import UserMenu from "./UserMenu.jsx";
import { useUser } from "./UserProvider.jsx";
import ChevronRightIcon from "@heroicons/react/24/solid/ChevronRightIcon";
import ChevronLeftIcon from "@heroicons/react/24/solid/ChevronLeftIcon";

function Hide({ children, show }) {
	return show ? children : null;
}

export default function MainArea() {
	const user = useUser();
	const [activeTab, setActiveTab] = useState(0);
	const [groups, setGroups] = useState([]);
	const [isFirstDivVisible, setIsFirstDivVisible] = useState(true);
	async function GroupAddHandler(group) {
		user.createGroup(group);
	}
	useEffect(
		() => {
			user.onGroupChange = (grouplist) => setGroups(grouplist);
			user.getGroups();
			return () => user.onGroupChange = undefined;
		},
		[user]
	);
	//overflow-auto and resize-x for the below className for resizability.                                        
	return (
		<>
			<button
				onClick={() => setIsFirstDivVisible(!isFirstDivVisible)}
				className="bg-primary-bg sm:bg-primary-bg sm:hover:bg-secondary-bg focus:outline-none focus:ring-2 focus:ring-gray-400"
			>
				{isFirstDivVisible ? (
					<ChevronLeftIcon className="w-6 h-6 text-menu-bg" />
				) : (
					<ChevronRightIcon className="w-6 h-6 text-menu-bg" />
				)}
			</button>
			<Hide show={isFirstDivVisible}>
				<div className="bg-primary-bg text-primary-text flex flex-col w-50 sm:w-80 overflow-auto resize-x">
					<UserMenu onGroupCreate={GroupAddHandler}></UserMenu>
					<nav className="overflow-y-auto flex-grow">
						{groups.map((tab, index) => (
							<TabButton
								key={index}
								onClick={() => setActiveTab(index)}
								group={tab}
							></TabButton>
						))}
					</nav>
				</div>
			</Hide>
			<div className="flex flex-col flex-grow">
				{groups.map((tab, index) => (
					<MainChatArea
						group={tab}
						isactive={index == activeTab}
						key={index}
					/>
				))}
			</div>
		</>
	);

}
