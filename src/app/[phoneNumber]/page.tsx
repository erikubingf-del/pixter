import { redirect } from 'next/navigation';
import { getPublicPaymentPath } from '@/lib/utils/payment';

export default function LegacyDriverPaymentPage({
  params,
}: {
  params: { phoneNumber: string };
}) {
  redirect(getPublicPaymentPath(params.phoneNumber));
}
