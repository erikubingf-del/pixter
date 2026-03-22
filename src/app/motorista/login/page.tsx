import { redirect } from 'next/navigation';
import { sanitizeInternalCallbackUrl } from '@/lib/utils/navigation';

export default function LegacyMotoristaLoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  const callbackUrl = sanitizeInternalCallbackUrl(
    searchParams?.callbackUrl,
    '/motorista/dashboard/overview'
  );

  const params = new URLSearchParams();
  params.set('callbackUrl', callbackUrl);

  redirect(`/login?${params.toString()}`);
}
