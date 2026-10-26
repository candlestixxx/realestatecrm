import { Metadata } from 'next';
import SignClient from './SignClient';

export const metadata: Metadata = {
  title: 'Sign Contract | Excel Legacy Realty',
  description: 'Review and sign your real estate documents electronically.',
};

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SignClient token={token} />;
}
