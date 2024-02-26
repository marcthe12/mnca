import { useEffect, useState } from "react";
import MainChatArea from "./MainChatArea.jsx";
import TabButton from "./TabButton.jsx";
import UserMenu from "./UserMenu.jsx";
import { useUser } from "./UserProvider.jsx";

export default function MainArea() {
	const user = useUser();
	const [activeTab, setActiveTab] = useState(0);
	const [groups, setGroups] = useState([]);

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
		<div className="bg-primary-bg text-primary-text flex flex-col w-50 sm:w-80 overflow-auto resize-x" >
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
