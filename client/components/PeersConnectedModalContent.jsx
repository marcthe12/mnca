import { useEffect } from "react"
import {useState} from "react"
import { useUser } from "./UserProvider"

export default function PeersConnectedModalContent({ onClose }) {
	const user = useUser()
	const [status,setStatus] = useState([])
	useEffect(() => {
		setStatus(user.connect.socketMap.values)
		user.connect.socketMap.onChange = values => setStatus(values)
		return () =>{
			user.connect.socketMap.onChange = undefined
		}
	},[])
	return <>
		<h2 className="text-xl font-semibold mb-4 text-menu-text">Create a New Group</h2>
		<div className="mb-4 ">
			<p>Ths shows the user list</p>
			<table className="table-auto">
				<thead>
					<tr>
						<th>ID</th>
						<th>User</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{
						user.connect.socketMap.values.map((row) => (
							<tr key={row.id}>
								<td>
									{row.id}
								</td>
								<td></td>
								<td>{row.rtc.connectionState}</td>
							</tr>
						))
					}
				</tbody>
			</table>
			<div className="flex justify-end">
				<button
					onClick={() => {

						onClose()

					}}
					className="px-4 py-2 bg-primary-bg rounded-md mr-2"
				>
          Close
				</button>
				
			</div>
		</div>
	</>

}
