import { Header } from '../components/Header'
import { MessageBox } from '../components/MessageBox'
import { MainArea } from '../components/MainArea'
import { SendBox } from '../components/SendBox'

export default function Home() {
  return (
    <>
      <Header></Header>
      <MainArea>
        <MessageBox name="Marc" date={new Date()}>
          Hello
        </MessageBox>
      </MainArea>
      <SendBox></SendBox>
    </>
  )
}
