import {useEffect, useState} from "react"
import MainChatArea from "./MainChatArea.jsx"
import TabButton from "./TabButton.jsx"
import UserMenu from "./UserMenu.jsx"
import { useUser } from "./UserProvider.jsx"
export default function MainArea () {
	const user = useUser()
	 const [
			activeTab,
			setActiveTab
		] = useState(0)
	 const [
			groups,
			setGroups
		] = useState([])

	async function GroupAddHandler (name) {
		user.addGroup({name})
	}

	useEffect(
		() => {

			user.onGroupChange = (grouplist) =>  setGroups(grouplist)
			user.getGroups()
			return () => user.onGroupChange = undefined
		},
		[
			user
		]
	)

	return (
		<>
			<div className="bg-primary-bg text-primary-text w-1/4">
				<UserMenu onGroupCreate={GroupAddHandler}></UserMenu>
				<nav>
					{groups.map((tab, index) => <TabButton key={index} onClick={() => setActiveTab(index)} group={tab}></TabButton>)}
				</nav>
			</div>
			<div className="w-3/4">
				{groups.map((tab, index) => <MainChatArea group={tab} isactive={index == activeTab} key={index} />)}
			</div>
		</>
	)

}


