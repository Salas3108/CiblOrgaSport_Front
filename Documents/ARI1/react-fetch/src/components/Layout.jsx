export default function Layout({ children }) {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <header>
        <h1>TP React Fetch & Hooks</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}
