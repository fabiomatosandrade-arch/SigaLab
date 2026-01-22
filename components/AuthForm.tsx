
import React, { useState } from 'react';
import { User } from '../types';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration state
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [conditions, setConditions] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = [];
    if (email !== emailConfirm) newErrors.push("Os e-mails não coincidem.");
    if (password.length < 6) newErrors.push("A senha deve ter pelo menos 6 caracteres.");
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      birthDate,
      email,
      username,
      password,
      preExistingConditions: conditions
    };

    // Auto-login
    onLogin(newUser);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would validate against a DB. 
    // For this demo, we'll create a dummy user or check local storage.
    const dummyUser: User = {
      id: '123',
      name: 'Usuário Teste',
      birthDate: '1990-01-01',
      email: 'teste@exemplo.com',
      username: username || 'admin',
      preExistingConditions: 'Nenhuma'
    };
    onLogin(dummyUser);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Um link de recuperação foi enviado para o e-mail: " + email);
    setMode('login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 p-10 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">SigaLab</h1>
          <p className="text-indigo-100 opacity-90">Gestão inteligente de exames</p>
        </div>

        <div className="p-8 md:p-10">
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Entrar</h2>
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Usuário" 
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition" 
                  />
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Senha" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition pr-12" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                  >
                    {showPassword ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>
                    )}
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
              >
                Acessar Sistema
              </button>
              <div className="flex justify-between text-sm">
                <button type="button" onClick={() => setMode('reset')} className="text-indigo-600 hover:underline">Esqueci minha senha</button>
                <button type="button" onClick={() => setMode('register')} className="text-slate-600 hover:underline">Criar conta</button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800">Nova Conta</h2>
              {errors.length > 0 && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {errors.map((err, i) => <p key={i}>{err}</p>)}
                </div>
              )}
              <input 
                type="text" 
                placeholder="Nome Completo" 
                required 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border rounded-xl outline-none" 
              />
              <div className="flex gap-4">
                <input 
                  type="date" 
                  placeholder="Data Nasc." 
                  required 
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 border rounded-xl outline-none" 
                />
                <input 
                  type="text" 
                  placeholder="Usuário" 
                  required 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 border rounded-xl outline-none" 
                />
              </div>
              <input 
                type="email" 
                placeholder="E-mail" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border rounded-xl outline-none" 
              />
              <input 
                type="email" 
                placeholder="Confirme o E-mail" 
                required 
                value={emailConfirm}
                onChange={e => setEmailConfirm(e.target.value)}
                className="w-full p-3 bg-slate-50 border rounded-xl outline-none" 
              />
              <textarea 
                placeholder="Doenças Preexistentes" 
                value={conditions}
                onChange={e => setConditions(e.target.value)}
                className="w-full p-3 bg-slate-50 border rounded-xl outline-none h-20 resize-none"
              ></textarea>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Senha" 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 border rounded-xl outline-none pr-10" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
              </div>
              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
              >
                Cadastrar
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-center text-slate-500 hover:underline">Já tenho conta</button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Recuperar Senha</h2>
              <p className="text-slate-500">Informe seu e-mail para receber um link de redefinição.</p>
              <input 
                type="email" 
                placeholder="E-mail cadastrado" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" 
              />
              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold"
              >
                Enviar Link
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-center text-slate-500 hover:underline">Voltar</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
