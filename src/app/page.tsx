import { getServerSession } from "next-auth/next";
import ContextHandlers from '@/components/ContextHandlers';
import LogoutPage from './LogoutPage';
import { authOption } from './api/auth/[...nextauth]/route';

import './globals.css'

export default async function Home() {
  const session = await getServerSession(authOption);

  return (
    <>
      {session !== null ? <ContextHandlers /> : <LogoutPage />}
    </>
  )
}
