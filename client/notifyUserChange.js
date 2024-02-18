export default function notifyUserChange(msg) {
	if ("Notification" in window) {
		Notification.requestPermission().then(permission => {
			if (permission === "granted") {
				new Notification(msg);
			}
		});
	} else {
		console.error("Browser does not support notifications.");
	}
}

