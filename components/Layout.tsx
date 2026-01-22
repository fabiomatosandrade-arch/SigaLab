
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigate, currentPage }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-indigo-900 text-white p-6 shrink-0">
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-white p-2 rounded-lg">
             <svg className="w-6 h-6 text-indigo-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
          </div>
          <h1 className="text-xl font-bold">SigaLab</h1>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${currentPage === 'dashboard' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => onNavigate('exams')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${currentPage === 'exams' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}
          >
            Meus Exames
          </button>
          <button 
            onClick={() => onNavigate('reports')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${currentPage === 'reports' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}
          >
            Relatórios
          </button>
          <button 
            onClick={() => onNavigate('profile')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${currentPage === 'profile' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}
          >
            Meu Perfil
          </button>
        </nav>

        <div className="mt-auto pt-10 border-t border-indigo-800">
          <div className="mb-4">
            <p className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">Usuário</p>
            <p className="font-medium truncate">{user.name}</p>
          </div>
          <button 
            onClick={onLogout}
            className="w-full text-left px-4 py-2 text-indigo-200 hover:text-white transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
