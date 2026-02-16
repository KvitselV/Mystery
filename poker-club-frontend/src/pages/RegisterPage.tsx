import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [clubCardNumber, setClubCardNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register({ name, clubCardNumber, phone, password });
      navigate('/');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-black p-4">
      <div className="glass-card w-full max-w-md p-8 border border-amber-900/30">
        <h1 className="text-2xl font-bold text-amber-400 mb-6 text-center">Регистрация</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-amber-900/30 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            required
          />
          <input
            type="text"
            placeholder="Номер клубной карты"
            value={clubCardNumber}
            onChange={(e) => setClubCardNumber(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-amber-900/30 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            required
          />
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
            Зарегистрироваться
          </button>
        </form>
        <p className="mt-4 text-center text-zinc-400 text-sm">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
