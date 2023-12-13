export default function UploadModal ({onClose}) {
  const handleFileChange = (e) => {
    // Handle file change logic here
    const selectedFile = e.target.files[0];
    console.log('Selected file:', selectedFile);
  };
  return (
		<div className="p-4">
			<h2 className="text-2xl font-semibold mb-4 text-menu-text">{group.name}</h2>
			<div className="flex flex-col">
				<label className="text-gray-700 mb-2">Group ID:</label>
				<div className="flex items-center mb-2">
					<input
						type="text"
						value={group.groupId}
						readOnly
						className="w-32 bg-white border border-gray-300 p-2 rounded-md text-gray-700"
					/>
				</div>
        <button
					onClick={on}
					className="px-4 py-2 bg-primary-bg text-white rounded-md hover:bg-primary-dark"
				>
          Upload
				</button>
				<button
					onClick={onClose}
					className="px-4 py-2 bg-primary-bg text-white rounded-md hover:bg-primary-dark"
				>
          Close
				</button>
			</div>
		</div>
	)
}