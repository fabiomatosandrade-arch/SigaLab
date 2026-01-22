
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

  // Persistence Mock
  useEffect(() => {
    const savedUser = localStorage.getItem('sigalab_user');
    const savedExams = localStorage.getItem('sigalab_exams');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedExams) setExams(JSON.parse(savedExams));
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('sigalab_user', JSON.stringify(user));
    localStorage.setItem('sigalab_exams', JSON.stringify(exams));
  }, [user, exams]);

  const handleLogin = (u: User) => setUser(u);
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sigalab_user');
    setCurrentPage('dashboard');
  };

  const addExam = (examData: Omit<LabExam, 'id' | 'userId'>) => {
    if (!user) return;
    const newExam: LabExam = {
      ...examData,
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id
    };
    setExams([...exams, newExam]);
  };

  const deleteExam = (id: string) => {
    setExams(exams.filter(e => e.id !== id));
  };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

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
