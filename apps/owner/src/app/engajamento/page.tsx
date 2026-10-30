"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Ajuste para o seu cliente do Supabase no ADM

interface ClienteEngajamento {
  id: string;
  name: string;
  phone: string;
  auth_user_id: string | null;
  last_access: string | null;
  neighborhood: string;
}

export default function EngajamentoPage() {
  const [clientes, setClientes] = useState<ClienteEngajamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "logados" | "pendentes" | "sumidos">("todos");

  useEffect(() => {
    async function fetchClientes() {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone, auth_user_id, last_access, neighborhood")
        .order("name", { ascending: true });

      if (!error && data) {
        setClientes(data);
      }
      setLoading(false);
    }
    fetchClientes();
  }, []);

  // Helpers para cálculo de engajamento
  const totalClientes = clientes.length;
  const totalLogados = clientes.filter(c => c.auth_user_id !== null).length;
  const totalPendentes = clientes.filter(c => c.auth_user_id === null).length;

  const limiteSumido = new Date();
  limiteSumido.setDate(limiteSumido.getDate() - 10); // Consideramos "sumido" quem não entra há 10 dias

  const totalSumidos = clientes.filter(c => {
    if (!c.last_access || !c.auth_user_id) return false;
    return new Date(c.last_access) < limiteSumido;
  }).length;

  // Filtragem da lista exibida
  const clientesFiltrados = clientes.filter(c => {
    if (filtro === "logados") return c.auth_user_id !== null;
    if (filtro === "pendentes") return c.auth_user_id === null;
    if (filtro === "sumidos") {
      return c.auth_user_id !== null && c.last_access && new Date(c.last_access) < limiteSumido;
    }
    return true;
  });

  // Função para formatar a data de último acesso de forma amigável
  const formatarUltimoAcesso = (dataIso: string | null, logado: boolean) => {
    if (!logado) return <span className="text-gray-400">Nunca logou (Pendente)</span>;
    if (!dataIso) return <span className="text-amber-500 font-medium">Ainda não abriu o painel</span>;

    const data = new Date(dataIso);
    const hoje = new Date();
    const diferencaTempo = Math.abs(hoje.getTime() - data.getTime());
    const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24)) - 1;

    if (diferencaDias === 0) {
      return <span className="text-emerald-600 font-semibold">Ativo hoje</span>;
    }
    if (diferencaDias === 1) {
      return <span className="text-emerald-500">Ontem</span>;
    }
    if (diferencaDias < 10) {
      return <span className="text-slate-600">Há {diferencaDias} dias</span>;
    }
    return <span className="text-rose-500 font-bold">Inativo há {diferencaDias} dias ⚠️</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <p className="text-lg font-medium text-slate-600">Carregando dados de engajamento...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50 text-slate-800">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Painel de Engajamento</h1>
        <p className="text-slate-500">Monitore o comportamento de uso do aplicativo pelos seus clientes.</p>
      </header>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">Total de Clientes</p>
          <p className="text-3xl font-bold text-slate-900">{totalClientes}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-emerald-600">Já Logaram (Instalado)</p>
          <p className="text-3xl font-bold text-emerald-600">{totalLogados}</p>
          <p className="text-xs text-slate-400 mt-1">{((totalLogados/totalClientes)*100).toFixed(0)}% da base ativa</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-amber-600">Ainda Não Logaram</p>
          <p className="text-3xl font-bold text-amber-600">{totalPendentes}</p>
          <p className="text-xs text-slate-400 mt-1">Aguardando primeiro acesso</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-rose-600">Sumidos (+10 dias)</p>
          <p className="text-3xl font-bold text-rose-600">{totalSumidos}</p>
          <p className="text-xs text-slate-400 mt-1">Precisam de atenção comercial</p>
        </div>
      </div>

      {/* SELETOR DE FILTROS */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFiltro("todos")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filtro === "todos" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border"
          }`}
        >
          Todos ({totalClientes})
        </button>
        <button
          onClick={() => setFiltro("logados")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filtro === "logados" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border"
          }`}
        >
          Logados ({totalLogados})
        </button>
        <button
          onClick={() => setFiltro("pendentes")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filtro === "pendentes" ? "bg-amber-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border"
          }`}
        >
          Pendentes ({totalPendentes})
        </button>
        <button
          onClick={() => setFiltro("sumidos")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filtro === "sumidos" ? "bg-rose-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border"
          }`}
        >
          Sumidos (+10 dias) ({totalSumidos})
        </button>
      </div>

      {/* TABELA DE CLIENTES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold border-b">
              <th className="py-4 px-6">Cliente</th>
              <th className="py-4 px-6">Bairro</th>
              <th className="py-4 px-6">Status Login</th>
              <th className="py-4 px-6">Último Acesso ao App</th>
              <th className="py-4 px-6 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {clientesFiltrados.map(cliente => (
              <tr key={cliente.id} className="hover:bg-slate-50 transition">
                <td className="py-4 px-6 font-medium text-slate-900">{cliente.name}</td>
                <td className="py-4 px-6 text-slate-500">{cliente.neighborhood || "Não informado"}</td>
                <td className="py-4 px-6">
                  {cliente.auth_user_id ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Conta Ativada
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Pendente
                    </span>
                  )}
                </td>
                <td className="py-4 px-6">
                  {formatarUltimoAcesso(cliente.last_access, !!cliente.auth_user_id)}
                </td>
                <td className="py-4 px-6 text-right">
                  <a
                    href={`https://wa.me/55${cliente.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-bold text-cyan-600 hover:text-cyan-800"
                  >
                    Mandar WhatsApp 💬
                  </a>
                </td>
              </tr>
            ))}
            {clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  Nenhum cliente encontrado para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}