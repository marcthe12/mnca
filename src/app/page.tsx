import { Header } from '../component/Header'
import { MessageBox } from '../component/MessageBox'
import { MainArea } from '../component/MainArea'
import { SendBox } from '../component/SendBox'

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
