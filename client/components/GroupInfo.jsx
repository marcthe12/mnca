export default function GroupInfo({ onClose, group}) {
	return <>
		<h2 className="text-xl font-semibold mb-4 text-menu-text">{group.name}</h2>
		<div className="mb-4 ">
			<div className="flex justify-end">
				<p>{group.groupId}</p>
				<button
					onClick={() => onClose()}
					className="px-4 py-2 bg-primary-bg rounded-md mr-2"
				>
          Close
				</button>
				
			</div>
		</div>
	</>

}
