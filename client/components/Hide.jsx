export default function({ children, show }) {
  return show ? children : (<></>);
}
