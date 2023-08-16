export async function openGroupDB(userId: string, groupId: string): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const DB_NAME = `userGroupDB_${userId}_${groupId}`;
        const STORE_NAME = 'groupData';

        const request = indexedDB.open(DB_NAME, 1);

        request.addEventListener("error", function () {
            reject('Error opening database');
        });

        request.addEventListener("success", function() {
            const db = this.result;
            resolve(db);
        });

        request.addEventListener("upgradeneeded", function() {
            const db = this.result;
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        });
    });
}

export async function saveGroupData(userId: string, groupId: string, data: any) {
    const db = await openGroupDB(userId, groupId);
    const transaction = db.transaction(['groupData'], 'readwrite');
    const store = transaction.objectStore('groupData');

    store.put(data);
}

export async function fetchGroupData(userId: string, groupId: string): Promise<any> {
    const db = await openGroupDB(userId, groupId);
    const transaction = db.transaction(['groupData'], 'readonly');
    const store = transaction.objectStore('groupData');
    const request = store.getAll();

    return new Promise<any>((resolve, reject) => {
        request.onerror = function () {
            reject('Error fetching data');
        };

        request.addEventListener("success", function () {
            resolve(this.result);
        });
    });
}
