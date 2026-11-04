import { Metadata } from 'next';
import SignClient from './SignClient';

/**
 * Public signing page. Branding comes from the workspace settings
 * (white-label): brokerages see their own logo and colors, not ours.
 */

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sign Contract',
    description: 'Review and sign your real estate documents electronically.',
  };
}

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SignClient token={token} />;
}
