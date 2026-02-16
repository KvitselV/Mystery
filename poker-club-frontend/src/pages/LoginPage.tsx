import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(phone, password);
      navigate('/');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка входа');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-black p-4">
      <div className="glass-card w-full max-w-md p-8 border border-amber-900/30">
        <h1 className="text-2xl font-bold text-cyan-300 mb-6 text-center">Mystery</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="tel"
            placeholder="Телефон"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-amber-900/30 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-amber-900/30 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="w-full glass-btn py-3 rounded-xl font-medium">
            Войти
          </button>
          <p className="text-center text-zinc-400 text-sm mt-2">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-amber-400 hover:text-amber-300">
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
