import type { message } from "./IndexDBProvider";

export function MessageBox({ message }: { message: message }): JSX.Element {
  const {name, message: msg,date} = message;
  return <div className="bg-gray-250">
    <p>{name}</p>
    <p>{msg}</p>
    <p><time>{date.toUTCString()}</time></p>
  </div>;
}
