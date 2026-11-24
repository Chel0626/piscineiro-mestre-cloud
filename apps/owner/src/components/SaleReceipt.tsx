'use client';

import * as React from 'react';

export interface SaleReceiptItem {
  name: string;
  un: string; // sempre 'UN'
  qty: number;
  unitPrice: number;
  total: number;
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

const formatMoney = (value: number): string =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const SaleReceipt = React.forwardRef<HTMLDivElement, SaleReceiptProps>(
  ({ client, items, subtotal, total }, ref) => {
    const containerStyle: React.CSSProperties = {
      fontFamily: "'Courier New', monospace",
      background: '#ffffff',
      color: '#000000',
      width: '400px',
      padding: '16px',
      fontSize: '12px',
      lineHeight: 1.5,
      boxSizing: 'border-box',
    };

    const centerStyle: React.CSSProperties = {
      textAlign: 'center',
    };

    const thBase: React.CSSProperties = {
      borderBottom: '1px solid #000000',
      padding: '2px 4px',
      fontWeight: 'bold',
    };

    const tdBase: React.CSSProperties = {
      padding: '2px 4px',
      verticalAlign: 'top',
    };

    const rightAlign: React.CSSProperties = { textAlign: 'right' };

    return (
      <div ref={ref} style={containerStyle}>
        <div style={centerStyle}>
          <div style={{ fontWeight: 'bold' }}>***** MHM PISCINAS *****</div>
          <div>VENDA</div>
          <div>VENDA VIRTUAL</div>
        </div>

        <div
          style={{
            borderTop: '1px dashed #000000',
            margin: '10px 0',
          }}
        />

        <div>
          <div>CLIENTE: {client.name}</div>
          {client.address ? <div>ENDEREÇO: {client.address}</div> : null}
          {client.phone ? <div>FONE: {client.phone}</div> : null}
        </div>

        <div
          style={{
            borderTop: '1px dashed #000000',
            margin: '10px 0',
          }}
        />

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
          }}
        >
          <thead>
            <tr>
              <th style={{ ...thBase, textAlign: 'left' }}>DESCRIÇÃO</th>
              <th style={{ ...thBase, textAlign: 'center' }}>UN</th>
              <th style={{ ...thBase, ...rightAlign }}>QTDE</th>
              <th style={{ ...thBase, ...rightAlign }}>VALOR UNT</th>
              <th style={{ ...thBase, ...rightAlign }}>VALOR TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td style={{ ...tdBase, textAlign: 'left' }}>{item.name}</td>
                <td style={{ ...tdBase, textAlign: 'center' }}>{item.un}</td>
                <td style={{ ...tdBase, ...rightAlign }}>{item.qty}</td>
                <td style={{ ...tdBase, ...rightAlign }}>
                  {formatMoney(item.unitPrice)}
                </td>
                <td style={{ ...tdBase, ...rightAlign }}>
                  {formatMoney(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            borderTop: '1px dashed #000000',
            margin: '10px 0',
          }}
        />

        <div style={{ textAlign: 'right' }}>
          <div>SUBTOTAL: R$ {formatMoney(subtotal)}</div>
          <div style={{ fontWeight: 'bold' }}>TOTAL: R$ {formatMoney(total)}</div>
        </div>
      </div>
    );
  }
);

SaleReceipt.displayName = 'SaleReceipt';
