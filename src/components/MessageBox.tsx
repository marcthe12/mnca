type MessageData = {
  name: string;
  children: string;
  date: Date;
};

export function MessageBox({ name, children, date }: MessageData): JSX.Element {
  return <div className="bg-gray-250">
    <p>{name}</p>
    <p>{children}</p>
    <p><time>{date.toUTCString()}</time></p>
  </div>;
}
