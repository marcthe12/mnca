import {useEffect, useState} from "react"
import MainChatArea from "./MainChatArea.jsx"
import TabButton from "./TabButton.jsx"
import UserMenu from "./UserMenu.jsx"
import {useIndexDB} from "./IndexDBProvider.jsx"

export default function MainArea () {

	const db = useIndexDB(),
	 [
			activeTab,
			setActiveTab
		] = useState(0),
	 [
			groups,
			setGroups
		] = useState([])

	async function GroupList () {

		const message = await db?.getAll("groups") ?? []
		setGroups(message)

	}

	async function GroupAddHandler (name) {

		db?.add(
			"groups",
			{
				name,
				"groupId": crypto.getRandomValues(new Uint8Array(8)).toString()
			}
		)
		await GroupList()

	}

	useEffect(
		() => {

			GroupList()

		},
		[
			db,
			groups
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


