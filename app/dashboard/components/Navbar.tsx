'use client';

import React from 'react';

type Props = {
  onLogout: () => void;
  title?: string;
  username?: string;
};

export default function Navbar({ onLogout, title = 'CiblOrgaSport', username }: Props) {
  return (
    <nav style={{ backgroundColor: 'white', padding: '1rem 2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{title}</h1>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {username && <div style={{ color: '#374151' }}>{username}</div>}
        <button onClick={onLogout} style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none' }}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
