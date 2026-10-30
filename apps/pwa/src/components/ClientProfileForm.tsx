import React from 'react';
import { ClientProfile } from './ClientDashboard';
import { useAuth } from '@/context/AuthContext';

interface ClientProfileFormProps {
  profile: ClientProfile;
  onSave: (profile: ClientProfile) => void;
}

export const ClientProfileForm: React.FC<ClientProfileFormProps> = ({ profile, onSave }) => {
  const [form, setForm] = React.useState(profile);
  const { role } = useAuth();
  const isWorker = role === 'worker';

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="font-semibold mb-2 dark:text-white">Editar Perfil</div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-200">Nome</label>
        <input name="name" value={form.name} onChange={handleChange} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-200">Endereço</label>
        <input name="address" value={form.address} onChange={handleChange} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-200">Bairro/Condomínio</label>
        <input name="neighborhood" value={form.neighborhood || ''} onChange={handleChange} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-200">Telefone {isWorker && '(Somente Leitura)'}</label>
        <input 
          name="phone" 
          value={form.phone} 
          onChange={handleChange} 
          disabled={isWorker}
          className={`w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 ${isWorker ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-gray-500' : ''}`} 
        />
      </div>
      {/* Geolocalização pode ser editada futuramente */}
      <button type="submit" className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded w-full">Salvar Alterações</button>
    </form>
  );
};
