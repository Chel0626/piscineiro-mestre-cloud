
"use client";

// Client Component minimalista para página de erro
export default function Error() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <main style={{ textAlign: 'center', padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold' }}>Algo deu errado</h1>
        <p style={{ marginTop: 16, color: '#888' }}>Ocorreu um erro ao gerar esta página. Tente novamente mais tarde.</p>
      </main>
    </div>
  );
}
