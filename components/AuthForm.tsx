
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
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to generate a random salt
  const generateSalt = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Helper function for Salted SHA-256 hashing
  const hashPassword = async (password: string, salt: string): Promise<string> => {
    const encoder = new TextEncoder();
    // Combinamos a senha com o sal único do usuário antes de hashear
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const getUsersFromStorage = (): User[] => {
    const stored = localStorage.getItem('sigalab_all_users');
    return stored ? JSON.parse(stored) : [];
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);
    const newErrors = [];
    
    if (email !== emailConfirm) newErrors.push("Os e-mails não coincidem.");
    if (password.length < 6) newErrors.push("A senha deve ter pelo menos 6 caracteres.");
    if (username.length < 3) newErrors.push("O nome de usuário deve ter pelo menos 3 caracteres.");
    
    const allUsers = getUsersFromStorage();
    if (allUsers.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      newErrors.push("Este nome de usuário já está em uso.");
    }
    if (allUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      newErrors.push("Este e-mail já está cadastrado.");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const salt = generateSalt();
      const hashedPassword = await hashPassword(password, salt);
      
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        birthDate,
        email,
        username,
        salt, // Guardamos o sal para validar o login futuramente
        password: hashedPassword,
        preExistingConditions: conditions
      };

      const updatedUsers = [...allUsers, newUser];
      localStorage.setItem('sigalab_all_users', JSON.stringify(updatedUsers));
      
      // Auto-login (removendo a senha do objeto de sessão por segurança extra)
      const sessionUser = { ...newUser };
      delete sessionUser.password;
      onLogin(sessionUser);
    } catch (err) {
      setErrors(["Erro ao processar segurança. Tente novamente."]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    try {
      const allUsers = getUsersFromStorage();
      // Encontrar o usuário ignorando case para o username
      const foundUser = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (foundUser && foundUser.salt) {
        // Hashear a tentativa com o sal do usuário encontrado
        const attemptHash = await hashPassword(password, foundUser.salt);
        
        if (attemptHash === foundUser.password) {
          const sessionUser = { ...foundUser };
          delete sessionUser.password; // Segurança: não manter o hash na sessão ativa
          onLogin(sessionUser);
          return;
        }
      }
      
      // Mensagem genérica para evitar enumeração de usuários
      setErrors(["Usuário ou senha incorretos."]);
    } catch (err) {
      console.error(err);
      setErrors(["Erro na autenticação. Tente novamente."]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Se este e-mail estiver cadastrado, um link de recuperação será enviado para " + email);
    setMode('login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in duration-500">
        <div className="bg-indigo-600 p-10 text-white text-center">
          <div className="flex justify-center mb-4">
             <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
             </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">SigaLab</h1>
          <p className="text-indigo-100 opacity-90 font-medium italic">Monitoramento Biométrico & Criptografia</p>
        </div>

        <div className="p-8 md:p-10">
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold animate-in slide-in-from-top-4">
              <ul className="list-disc list-inside">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bem-vindo de volta</h2>
                <p className="text-slate-500 text-sm">Acesse sua conta para gerenciar seus exames.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
                  <input 
                    type="text" 
                    placeholder="Seu nome de usuário" 
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition pr-12 font-medium" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Acessar Prontuário'}
              </button>
              
              <div className="flex flex-col gap-3 pt-2">
                <button type="button" onClick={() => setMode('register')} className="text-indigo-600 font-bold hover:underline">Ainda não tenho uma conta</button>
                <button type="button" onClick={() => setMode('reset')} className="text-slate-400 text-xs font-semibold hover:text-slate-600">Esqueci meus dados de acesso</button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1 mb-4">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Criar Conta</h2>
                <p className="text-slate-500 text-sm">Seus dados serão protegidos com criptografia Salted SHA-256.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <input 
                  type="text" 
                  placeholder="Nome Completo" 
                  required 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                />
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nascimento</label>
                     <input 
                        type="date" 
                        required 
                        value={birthDate}
                        onChange={e => setBirthDate(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                     />
                  </div>
                  <div className="flex-1 space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Usuário</label>
                     <input 
                        type="text" 
                        placeholder="Ex: joao123" 
                        required 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                     />
                  </div>
                </div>
                <input 
                  type="email" 
                  placeholder="Seu melhor e-mail" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                />
                <input 
                  type="email" 
                  placeholder="Confirme o e-mail" 
                  required 
                  value={emailConfirm}
                  onChange={e => setEmailConfirm(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                />
                <textarea 
                  placeholder="Histórico médico relevante (opcional)" 
                  value={conditions}
                  onChange={e => setConditions(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none h-20 resize-none focus:ring-2 focus:ring-indigo-500 text-sm"
                ></textarea>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Defina uma senha forte" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 pr-12 font-medium" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition shadow-lg disabled:opacity-50"
              >
                {isLoading ? 'Protegendo dados...' : 'Criar minha conta segura'}
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-center text-slate-500 font-bold hover:underline">Já sou cadastrado</button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recuperar Acesso</h2>
                <p className="text-slate-500 text-sm">Informe seu e-mail para receber as instruções de redefinição.</p>
              </div>
              <input 
                type="email" 
                placeholder="E-mail de cadastro" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
              />
              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl"
              >
                Solicitar nova senha
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-center text-slate-500 font-bold hover:underline">Voltar para entrar</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
