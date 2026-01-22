
import React from 'react';
import { User } from '../types';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-indigo-600 h-32 relative">
        <div className="absolute -bottom-12 left-8 bg-white p-2 rounded-2xl shadow-lg border border-slate-100">
           <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center text-indigo-600">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
           </div>
        </div>
      </div>
      <div className="pt-16 p-8">
        <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
        <p className="text-slate-500 mb-8">@{user.username}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Dados Pessoais</h3>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">E-mail</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Data de Nascimento</p>
              <p className="font-medium">{new Date(user.birthDate).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Informações Médicas</h3>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Doenças Preexistentes</p>
              <p className="font-medium whitespace-pre-wrap">{user.preExistingConditions || "Nenhuma informada"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
