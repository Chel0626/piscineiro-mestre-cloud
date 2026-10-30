// Página 404 server-safe para evitar erros de build/prerender
export default function NotFound() {
  return (
    <html>
      <body>
        <h1>404 - Página não encontrada</h1>
        <p>Desculpe, não encontramos o que você procura.</p>
      </body>
    </html>
  );
}
