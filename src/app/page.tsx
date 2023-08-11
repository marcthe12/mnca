import { Header } from '@/components/Header'
import { getServerSession } from "next-auth/next";
import UserMenu from '@/components/UserMenu';
import LogoutPage from './LogoutPage';
import { authOption } from './api/auth/[...nextauth]/route';

import './globals.css'

export default async function Home() {
  const session = await getServerSession(authOption);

  return (
    <>
      <Header />
      {session !== null ? <UserMenu /> : <LogoutPage />}
    </>
  )
}
