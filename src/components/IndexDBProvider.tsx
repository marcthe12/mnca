"use client";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";
import { openDB } from "idb";
import type { IDBPDatabase, DBSchema } from "idb";

export interface users {
    id: string;
    name: string;
    image: Blob;
}

export interface group {
    groupId: string;
    name: string;
}

export interface message {
    name: string;
    message: string;
    date: Date;
    groupId: group["groupId"];
    messageId: string;
}

interface MyDB extends DBSchema {
    groups: {
        value: group 
        key: group["groupId"];
    };
    messages: {
        value: message 
        key: message["messageId"]
        indexes: { 'groupIndex': message["groupId"] };
    }
}

const IndexDBContex = createContext<IDBPDatabase<MyDB> | null>(null);

export function useIndexDB() {
    return useContext(IndexDBContex);
}

export function IndexDBProvider({ children }: { children: JSX.Element; }) {
    const session = useSession();
    const [db, setDB] = useState<IDBPDatabase<MyDB> | null>(null);
    useEffect(() => {
        (async () => {
            if (session.status === "authenticated") {
                const name = session.data.user?.name;
                if (name !== undefined && name !== null) {
                    const result = await openDB<MyDB>(name, 3, {
                        upgrade(db) {
                            db.createObjectStore('groups', { keyPath: 'groupId' });
                            const messageStore = db.createObjectStore('messages', { keyPath: 'messageId' });
                            messageStore.createIndex('groupIndex', 'groupId', { unique: false });
                        }
                    });
                    setDB(result);
                }
            }
        })();
    }, [session]);

    return <IndexDBContex.Provider value={db}>{children}</IndexDBContex.Provider>;
}
