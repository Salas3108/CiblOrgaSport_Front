import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout";
import NotFound from "./components/NotFound";
import ShowUsersExample from "./components/ShowUsersExample";

function App() {
  return (
    <Router>
      <Layout>
        <nav style={{ marginBottom: "1rem" }}>
          <Link to="/">Accueil</Link> |{" "}
          <Link to="/users/showusersexample">Show Users Example</Link>
        </nav>

        <Routes>
          <Route path="/" element={<h2>Bienvenue dans React Fetch</h2>} />
          <Route path="/users/showusersexample" element={<ShowUsersExample />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
