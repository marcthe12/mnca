import React, { useRef } from 'react';

export default function GroupInfo({ onClose, group }) {
  const groupIdRef = useRef(null);

  const copyGroupIdToClipboard = () => {
    groupIdRef.current.select();
    document.execCommand('copy');
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
            ref={groupIdRef}
            className="w-32 bg-white border border-gray-300 p-2 rounded-md text-gray-700"
          />
          <button
            onClick={copyGroupIdToClipboard}
            className="px-4 py-2 bg-primary-bg text-white rounded-md hover:bg-primary-dark ml-2"
          >
            Copy
          </button>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-primary-bg text-white rounded-md hover:bg-primary-dark"
        >
          Close
        </button>
      </div>
    </div>
  );
}
