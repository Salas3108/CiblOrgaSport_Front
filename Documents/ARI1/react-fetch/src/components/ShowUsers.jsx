import ShowUserSummary from "./ShowUserSummary";
import useGetAllUsers from "../services/UsersServices";

export default function ShowUsers() {
  const { data: users, loading, error } = useGetAllUsers("https://jsonplaceholder.typicode.com/users");

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: "red" }}>Erreur : {error}</p>;

  return (
    <div>
      <h2>Liste des utilisateurs (avec Hook personnalisé)</h2>
      <ul>
        {users.map((user) => (
          <ShowUserSummary key={user.id} user={user} />
        ))}
      </ul>
    </div>
  );
}
