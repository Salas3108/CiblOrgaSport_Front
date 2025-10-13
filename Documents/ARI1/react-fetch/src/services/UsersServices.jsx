import { useEffect, useState } from "react";

export default function useGetAllUsers(url) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // sécurité pour éviter un setState après démontage

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur réseau lors de la récupération des utilisateurs");
        }
        return response.json();
      })
      .then((data) => {
        if (isMounted) {
          setData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    // Nettoyage
    return () => {
      isMounted = false;
    };
  }, [url]);

  return { data, loading, error };
}
