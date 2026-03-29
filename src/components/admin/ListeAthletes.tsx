import { useEffect, useState } from 'react';

async function fetchAthletes(validated?: boolean) {
  const token = localStorage.getItem('token');
  let url = 'http://137.74.133.131/auth/admin/athletes';
  if (validated !== undefined) url += `?validated=${validated}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Erreur API');
  return res.json();
}

export default function ListeAthletes({ validated }: { validated?: boolean }) {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAthletes(validated)
      .then(setAthletes)
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, [validated]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Liste des athlètes</h2>
      <ul>
        {athletes.map(a => (
          <li key={a.id}>
            {a.username} - {a.email} - {a.validated ? 'Validé' : 'Non validé'}
          </li>
        ))}
      </ul>
    </div>
  );
}
