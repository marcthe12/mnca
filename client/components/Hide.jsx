export default function Hide({ children, show }) {
  return show ? children : (<></>);
}
