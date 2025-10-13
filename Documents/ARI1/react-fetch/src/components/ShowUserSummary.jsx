export default function ShowUserSummary({ user }) {
  return (
    <li style={{ marginBottom: "10px" }}>
      <strong>{user.name}</strong> <br />
      <em>{user.email}</em>
    </li>
  );
}
