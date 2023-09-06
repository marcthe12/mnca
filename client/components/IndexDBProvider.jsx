import {createContext, useContext, useEffect, useState} from "react"
import {openDB} from "idb"
import {useUser} from "./UserProvider.jsx"

const IndexDBContex = createContext(null)

export function useIndexDB () {

	return useContext(IndexDBContex)

}

export function IndexDBProvider ({children}) {

	const user = useUser(),
	 [
			db,
			setDB
		] = useState(null)
	useEffect(
		() => {

			(async () => {

				const result = user.token
					? await openDB(
						user.data.body.user,
						3,
						{
							upgrade (db) {

								db.createObjectStore(
									"groups",
									{"keyPath": "groupId"}
								)
								const messageStore = db.createObjectStore(
									"messages",
									{"keyPath": "messageId"}
								)
								messageStore.createIndex(
									"groupIndex",
									"groupId",
									{"unique": false}
								)

							}
						}
					)
					: null
				setDB(result)
				return () => db.close()

			})()

		},
		[user]
	)

	return <IndexDBContex.Provider value={db}>{children}</IndexDBContex.Provider>

}
