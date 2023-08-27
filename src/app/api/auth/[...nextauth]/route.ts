import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/db"

export const authOption: any = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        CredentialsProvider({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                const user = await authOption.adapter.getUser(credentials?.username) 
                return user ?? null
            }
        })
    ],
    secret: "V+moVCbTt/Tar0uLa4sXkkf3vqaJ8F3VGdo0lRRoL9E=",
    callbacks: {
        session({ token, session }) {
            if (session.user) {
                session.user.id = token.id;
            }

            return session;
        }
    }
}


const handler = NextAuth(authOption)

export { handler as GET, handler as POST }
