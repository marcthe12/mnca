import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOption: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            credentials: {
                username: { label: "Username", type: "text" },
            },
            async authorize(credentials, req) {
                const user = { id: "1", name: credentials?.username }
                return user
            }
        })
    ],
    secret: "V+moVCbTt/Tar0uLa4sXkkf3vqaJ8F3VGdo0lRRoL9E="
}

const handler = NextAuth(authOption)

export { handler as GET, handler as POST }
