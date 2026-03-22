'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AvatarGridSelector from '@/components/AvatarGridSelector';
import { isDriverOnboardingComplete } from '@/lib/auth/driver-profile';
import { formatCPF, getCPFValidationError, validateCPF } from '@/lib/validators/cpf';

const avatarOptions = Array.from({ length: 9 }, (_, index) => `/images/avatars/avatar_${index + 1}.png`);

type ProfileResponse = {
  id: string;
  nome?: string | null;
  email?: string | null;
  celular?: string | null;
  cpf?: string | null;
  profissao?: string | null;
  data_nascimento?: string | null;
  avatar_url?: string | null;
  onboarding_completed?: boolean;
  stripe_ready?: boolean;
};

export default function CadastroMotorista() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [phone, setPhone] = useState('');
  const [countryCode] = useState('55');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [profissao, setProfissao] = useState('Motorista de táxi');
  const [dataNascimento, setDataNascimento] = useState('');
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=%2Fmotorista%2Fcadastro');
      return;
    }

    if (status !== 'authenticated') return;

    const hydrateProfile = async () => {
      try {
        setInitializing(true);
        const response = await fetch('/api/profile');
        if (!response.ok) throw new Error('Não foi possível carregar seus dados.');

        const data = await response.json();
        const profile = (data.profile || {}) as ProfileResponse;

        if (isDriverOnboardingComplete(profile) && profile.onboarding_completed) {
          router.replace(profile.stripe_ready ? '/motorista/dashboard/overview' : '/motorista/stripe-onboarding');
          return;
        }

        setNomeCompleto(profile.nome || session?.user?.name || '');
        setEmail(profile.email || session?.user?.email || '');
        setPhone(profile.celular ? profile.celular.replace(/^\+55/, '') : '');
        setCpf(profile.cpf || '');
        setProfissao(profile.profissao || 'Motorista de táxi');
        setDataNascimento(profile.data_nascimento || '');
        if (profile.avatar_url) {
          const avatarIndex = avatarOptions.findIndex((avatar) => avatar === profile.avatar_url);
          if (avatarIndex >= 0) setSelectedAvatar(avatarIndex);
        }
      } catch (profileError: any) {
        setError(profileError.message || 'Não foi possível carregar seu perfil.');
      } finally {
        setInitializing(false);
      }
    };

    hydrateProfile();
  }, [router, session?.user?.email, session?.user?.name, status]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!nomeCompleto || !phone || !cpf || !profissao || !dataNascimento) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    const cpfError = getCPFValidationError(cpf);
    if (cpfError) { setError(cpfError); return; }

    if (!aceitaTermos) {
      setError('Você precisa aceitar os termos para continuar.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('phone', phone);
      formData.append('countryCode', countryCode);
      formData.append('nome', nomeCompleto);
      formData.append('profissao', profissao);
      formData.append('dataNascimento', dataNascimento);
      formData.append('cpf', cpf);
      if (email) formData.append('email', email);
      formData.append('avatarIndex', selectedAvatar.toString());

      const response = await fetch('/api/auth/complete-registration', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erro ao finalizar cadastro.');

      setSuccess('Área de comerciante ativada com sucesso.');
      router.push(data.redirectTo || '/motorista/dashboard/overview');
    } catch (submitError: any) {
      setError(submitError.message || 'Erro ao finalizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || initializing) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="text-sm text-gray-500">Carregando onboarding…</p>
        </div>
      </main>
    );
  }

  if (!session) return null;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Ative sua Área de Comerciante</h1>
          <p className="text-sm text-gray-600">
            Você vai usar o mesmo login da conta atual. Complete seus dados para liberar o Stripe e o seu link de pagamento.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome completo</label>
              <input
                type="text"
                value={nomeCompleto}
                onChange={(event) => setNomeCompleto(event.target.value)}
                required
                autoComplete="name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email da conta</label>
              <input
                type="email"
                value={email}
                readOnly
                disabled
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Celular (com DDD)</label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-3 text-gray-500">
                  +{countryCode}
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="11 98765-4321"
                  required
                  autoComplete="tel"
                  className="flex-1 rounded-r-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={(event) => setCpf(formatCPF(event.target.value))}
                onBlur={() => { const e = getCPFValidationError(cpf); setError(e || ''); }}
                required
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {cpf && !validateCPF(cpf) && cpf.replace(/\D/g, '').length === 11 && (
                <p className="mt-1 text-xs text-red-600">CPF inválido</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Profissão</label>
              <input
                type="text"
                value={profissao}
                onChange={(event) => setProfissao(event.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Data de nascimento</label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(event) => setDataNascimento(event.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <AvatarGridSelector
            currentAvatarUrl={avatarOptions[selectedAvatar]}
            onSelect={(avatarUrl) => {
              const avatarIndex = avatarOptions.findIndex((avatar) => avatar === avatarUrl);
              if (avatarIndex >= 0) setSelectedAvatar(avatarIndex);
            }}
            loading={loading}
          />

          <div className="flex items-start">
            <input
              id="aceita"
              type="checkbox"
              checked={aceitaTermos}
              onChange={(event) => setAceitaTermos(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              required
            />
            <label htmlFor="aceita" className="ml-2 text-sm text-gray-700">
              Aceito os{' '}
              <Link href="/termos" className="text-purple-600 hover:text-purple-800">Termos de Uso</Link>
              {' '}e a{' '}
              <Link href="/privacidade" className="text-purple-600 hover:text-purple-800">Política de Privacidade</Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !aceitaTermos}
            className={`w-full rounded-md px-4 py-3 font-medium text-white transition ${
              loading || !aceitaTermos ? 'cursor-not-allowed bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {loading ? 'Finalizando onboarding…' : 'Ativar Área de Comerciante'}
          </button>
        </form>
      </div>
    </main>
  );
}
