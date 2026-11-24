# Implementation Plan — Botão "Gerar nota" (nota de venda PNG) em Solicitações de Produtos

Feature puramente de frontend no app `apps/owner`. Na aba "Aprovados" da página de Solicitações de Produtos, cada card ganha um botão "Gerar nota" ACIMA de "Concluir Entrega". O clique gera uma imagem PNG (cupom de venda modelo fixo "MHM PISCINAS") e baixa o arquivo. Sem preview, sem PDF.

## Decisões de design (com justificativa breve)

- **Biblioteca de captura: `html-to-image` (`toPng`).** Explicitamente pedido na tarefa; converte um nó DOM real em PNG no cliente, sem servidor. Alternativa `canvas`/`dom-to-image` descartada: `html-to-image` é mais leve e mantido, e a tarefa já o especifica.
- **Componente dedicado `SaleReceipt.tsx` recebendo dados já calculados por props.** Mantém a montagem de preço/total na página (onde `getItemPrice`/`catalogue` vivem) e deixa o componente puramente apresentacional. Evita duplicar a lógica de catálogo e respeita o padrão de componentes do owner (named export, `@/*`).
- **Renderização off-screen via container controlado por estado + `ref`, com `position: fixed; left: -9999px`.** `display:none` não é capturado pelo `html-to-image`; a tarefa exige nó com dimensões reais fora da viewport. O componente só é montado durante a geração e desmontado depois (estado `receiptData`).
- **Cálculo dos itens replicando o padrão existente.** `name = typeof p === 'object' ? p.name : p`; `qty = typeof p === 'object' ? (p.quantity || 1) : 1`; `unitPrice = getItemPrice(p)`; `total = unitPrice * qty`. Subtotal = soma dos totais = total (sem desconto), idêntico a `requestTotal`. Garante consistência com o valor já exibido no card.
- **Valores monetários formatados em pt-BR com 2 casas decimais** (`toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`) sem símbolo de moeda dentro da tabela do cupom, para manter alinhamento monoespaçado limpo; o prefixo `R$` aparece nas linhas de SUBTOTAL/TOTAL.
- **Tipagem estrita.** Owner não ignora erros de TS. `SaleReceipt` define interfaces próprias (`SaleReceiptItem`, `SaleReceiptProps`). O parsing de `products` continua usando `any` (o campo já é `any[]` na interface `ProductRequest`), seguindo o padrão do arquivo — nenhum `any` novo além desse ponto já existente.

## Itens

- [ ] 1. Instalar a dependência `html-to-image` no workspace do owner.
      A partir da raiz do monorepo, rodar o install com flags do projeto. Confirma que `html-to-image` aparece em `dependencies` de `apps/owner/package.json`.
      Files: `apps/owner/package.json` (atualizado pelo npm), `package-lock.json` (raiz)
      Verify (da raiz `c:\dev\piscineiro-mestre`): `npm install html-to-image --workspace @piscineiro/owner --no-audit --no-fund` termina sem erro; abrir `apps/owner/package.json` e confirmar a linha `"html-to-image": "^<versão>"` em `dependencies`.

- [ ] 2. Criar o componente apresentacional `SaleReceipt.tsx` (cupom MHM PISCINAS).
      Componente client-side (named export `SaleReceipt`) que recebe por props os dados já calculados e renderiza o cupom em layout monoespaçado, fundo branco, texto preto, largura fixa ~400px. Encaminhar `ref` para o nó raiz capturável.
      Props/tipos:
      ```ts
      export interface SaleReceiptItem {
        name: string;
        un: string;        // sempre 'UN'
        qty: number;
        unitPrice: number; // número cru
        total: number;     // unitPrice * qty
      }
      export interface SaleReceiptClient {
        name: string;
        address?: string;
        phone?: string;
      }
      export interface SaleReceiptProps {
        client: SaleReceiptClient;
        items: SaleReceiptItem[];
        subtotal: number;
        total: number;
      }
      ```
      Usar `React.forwardRef<HTMLDivElement, SaleReceiptProps>` para o container raiz (o handler captura esse nó). Layout:
      - Container raiz: `fontFamily: "'Courier New', monospace"`, `background: '#ffffff'`, `color: '#000000'`, `width: 400px`, `padding`, `fontSize: ~12-13px`.
      - Cabeçalho centralizado: linha `***** MHM PISCINAS *****`, abaixo `VENDA`, abaixo `VENDA VIRTUAL`. Sem endereço/telefone/CNPJ da empresa, sem número de pedido, sem data/hora.
      - Dados do cliente: `CLIENTE: <name>`; `ENDEREÇO: <address>` apenas se `address` truthy (omitir a linha inteira se vazio); `FONE: <phone>` apenas se `phone` truthy. Sem campo VENDEDOR.
      - Tabela `<table>` HTML simples (ou grid de larguras fixas) com cabeçalho `DESCRIÇÃO | UN | QTDE | VALOR UNT | VALOR TOTAL` (sem coluna CÓDIGO). Cada linha: `item.name`, `item.un` (`UN`), `item.qty`, `formatMoney(item.unitPrice)`, `formatMoney(item.total)`. Alinhar números à direita.
      - Rodapé: linha `SUBTOTAL: R$ <formatMoney(subtotal)>` e `TOTAL: R$ <formatMoney(total)>`. Sem ASS (assinatura) e sem OBS.
      - `formatMoney` helper local: `v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
      Files: `apps/owner/src/components/SaleReceipt.tsx` (criar)
      Verify (da raiz): `npx tsc --noEmit -p apps/owner/tsconfig.json` passa sem erros no novo arquivo.

- [ ] 3. Em `page.tsx`, importar o novo componente e os ícones/API necessários.
      Adicionar `import { toPng } from 'html-to-image';`, `import { SaleReceipt, type SaleReceiptItem } from '@/components/SaleReceipt';`, e incluir `FileText` (ou `Receipt`) na lista de ícones importados de `lucide-react`. Também importar `useRef` do React (ajustar o import existente `import { useEffect, useState } from 'react'`).
      Files: `apps/owner/src/app/product-requests/page.tsx`
      Verify (da raiz): `npx tsc --noEmit -p apps/owner/tsconfig.json` passa (imports resolvidos, sem usados-não-declarados que quebrem o build).

- [ ] 4. Adicionar estado/ref e o handler de geração dentro de `RequestCard`.
      Dentro do componente `RequestCard` (que já tem acesso a `getItemPrice` do escopo de `ProductRequestsPage`):
      - `const [receiptData, setReceiptData] = useState<{ client: { name: string; address?: string; phone?: string }; items: SaleReceiptItem[]; subtotal: number; total: number } | null>(null);`
      - `const [generating, setGenerating] = useState(false);`
      - `const receiptRef = useRef<HTMLDivElement>(null);`
      - Handler `handleGenerateNota`: monta `items` a partir de `request.products` com o mesmo padrão já usado no card (`name`, `qty`, `unitPrice = getItemPrice(product)`, `total = unitPrice * qty`, `un: 'UN'`); calcula `subtotal`/`total` como soma dos `total` (igual a `requestTotal`); monta `client` com `name: request.client_name || request.clients?.name || 'Cliente'`, `address: request.clients?.address`, `phone: request.clients?.phone || request.client_phone`; chama `setReceiptData(...)` e `setGenerating(true)`.
      - A captura ocorre após o componente off-screen montar: usar `useEffect` que observa `receiptData` e, quando não-nulo e `receiptRef.current` existir, aguardar um frame (ex.: `await new Promise(r => requestAnimationFrame(() => r(null)))` ou pequeno `setTimeout`) e então chamar `toPng(receiptRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' })`; criar `<a>` com `download = nota-<nomeSanitizado>-<YYYY-MM-DD>.png` (sanitizar nome: minúsculas, trocar não-alfanuméricos por `-`), `a.href = dataUrl`, `a.click()`; em `finally` fazer `setReceiptData(null)` e `setGenerating(false)`. Tratar erro com `toast.error('Erro ao gerar nota')` + `console.error`.
      Files: `apps/owner/src/app/product-requests/page.tsx`
      Verify (da raiz): `npx tsc --noEmit -p apps/owner/tsconfig.json` passa (tipos de estado/ref e retorno de `toPng` corretos).

- [ ] 5. Adicionar o botão "Gerar nota" e renderizar o `SaleReceipt` off-screen no bloco `status === 'approved'`.
      No `<CardFooter>`, dentro do bloco `{request.status === 'approved' && ( <> ... </> )}`, inserir ANTES do botão "Concluir Entrega":
      ```tsx
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={generating}
        onClick={handleGenerateNota}
      >
        <FileText className="mr-1 h-3 w-3" /> {generating ? 'Gerando...' : 'Gerar nota'}
      </Button>
      ```
      E renderizar o componente off-screen apenas quando `receiptData` existir, dentro do mesmo bloco (ou ao final do JSX do card), com wrapper fora da viewport:
      ```tsx
      {receiptData && (
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }} aria-hidden>
          <SaleReceipt
            ref={receiptRef}
            client={receiptData.client}
            items={receiptData.items}
            subtotal={receiptData.subtotal}
            total={receiptData.total}
          />
        </div>
      )}
      ```
      (Não usar `display:none` — `html-to-image` não captura.) Manter o botão "Concluir Entrega" e o badge de "Empresa/Cliente Providencia" inalterados, apenas acima/abaixo conforme ordem pedida.
      Files: `apps/owner/src/app/product-requests/page.tsx`
      Verify (da raiz): `npx tsc --noEmit -p apps/owner/tsconfig.json` passa.

- [ ] 6. Verificação final de tipos e build do Owner.
      Rodar a checagem de tipos e o build de produção do owner a partir da raiz do monorepo.
      Files: nenhum (validação)
      Verify (da raiz `c:\dev\piscineiro-mestre`):
      - `npx tsc --noEmit -p apps/owner/tsconfig.json` termina sem erros.
      - `npm run build --workspace @piscineiro/owner` conclui com sucesso (compila a rota `/product-requests` sem erros de tipo/lint que quebrem o build).

- [ ] 7. Verificação manual (smoke, opcional mas recomendada).
      Rodar o dev server e validar o fluxo visual.
      Files: nenhum
      Verify (da raiz): `npm run dev --workspace @piscineiro/owner`; abrir `/product-requests`, aba "Aprovados"; em um card, clicar "Gerar nota" e confirmar que um PNG `nota-<cliente>-<data>.png` é baixado, com cabeçalho `***** MHM PISCINAS *****`, `VENDA`, `VENDA VIRTUAL`, dados do cliente (sem VENDEDOR), tabela sem coluna CÓDIGO, e SUBTOTAL/TOTAL iguais ao "Total Estimado" do card (sem ASS/OBS). Obs. ambiente Windows: separador de comandos no PowerShell é `;`.

## Resultado da verificação (iteração 1)

Comandos rodados a partir da raiz `c:\dev\piscineiro-mestre`:

- `npm install html-to-image --workspace @piscineiro/owner --no-audit --no-fund` → exit 0; `"html-to-image"` adicionado em `dependencies` de `apps/owner/package.json`.
- `npx tsc --noEmit -p apps/owner/tsconfig.json` → exit 0 (sem erros de tipo).
- `npm run build --workspace @piscineiro/owner` → exit 0; build de produção concluído, rota `/product-requests` compilada e lint/type-check válidos. (O aviso "Supabase: Variáveis de ambiente ausentes no servidor" é esperado no build sem env NEXT_PUBLIC e não impede a conclusão.)

## Observações / suposições

- A imagem-modelo anexada pelo usuário não está no repositório; o layout do cupom segue a descrição textual da tarefa (modelo fixo MHM PISCINAS). Se houver divergência visual, ajustar só o `SaleReceipt.tsx` (apresentacional), sem tocar na lógica.
- `request.products` pode conter itens string soltos ou objetos; o plano trata ambos com o padrão já existente no arquivo — nenhum `any` novo é introduzido além do já presente na interface `ProductRequest`.
- Nenhuma alteração em schema, rotas de API, status, multi-tenancy, autenticação ou outros apps. A dependência nova (`html-to-image`) é a única mudança fora de `page.tsx`/`SaleReceipt.tsx`.
