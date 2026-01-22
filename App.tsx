
import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ExamList from './components/ExamList';
import Reports from './components/Reports';
import Profile from './components/Profile';
import { User, LabExam } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [exams, setExams] = useState<LabExam[]>([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isReady, setIsReady] = useState(false);

  // Carregamento inicial com verificações de segurança
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('sigalab_user');
      const savedExams = localStorage.getItem('sigalab_exams');
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      
      if (savedExams) {
        const parsedExams = JSON.parse(savedExams);
        setExams(Array.isArray(parsedExams) ? parsedExams : []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados locais:", error);
    } finally {
      setIsReady(true);
    }
  }, []);

  // Persistência automática
  useEffect(() => {
    if (isReady) {
      if (user) {
        localStorage.setItem('sigalab_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('sigalab_user');
      }
      localStorage.setItem('sigalab_exams', JSON.stringify(exams));
    }
  }, [user, exams, isReady]);

  const handleLogin = (u: User) => {
    setUser(u);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  const addExam = (examData: Omit<LabExam, 'id' | 'userId'>) => {
    if (!user) return;
    const newExam: LabExam = {
      ...examData,
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id
    };
    setExams(prev => [...prev, newExam]);
  };

  const deleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">SigaLab está iniciando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard exams={exams} />;
      case 'exams': return <ExamList exams={exams} onAddExam={addExam} onDeleteExam={deleteExam} />;
      case 'reports': return <Reports exams={exams} user={user} />;
      case 'profile': return <Profile user={user} />;
      default: return <Dashboard exams={exams} />;
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      onNavigate={setCurrentPage}
      currentPage={currentPage}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;
