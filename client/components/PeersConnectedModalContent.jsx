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
		<h2 className="text-xl font-semibold mb-4 text-menu-text">Connected Peers</h2>
		<div className="mb-4">
			<p>This shows the user list</p>
			<div className="overflow-x-auto">
				<table className="min-w-full bg-white border border-gray-300">
					<thead>
						<tr>
							<th className="px-4 py-2">ID</th>
							<th className="px-4 py-2">User</th>
							<th className="px-4 py-2">Status</th>
						</tr>
					</thead>
					<tbody>
						{user.connect.socketMap.values.map((row) => (
							<tr key={row.id} className="border-t border-gray-300">
								<td className="px-4 py-2">{row.id}</td>
								<td className="px-4 py-2">{row.user}</td>
								<td className="px-4 py-2">{row.rtc.connectionState}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="mt-4 flex justify-end">
				<button
					onClick={() => {
						onClose()
					}}
					className="px-4 py-2 bg-primary-bg text-white rounded-md mr-2"
				>
					Close
				</button>
			</div>
		</div>
	</>

}
