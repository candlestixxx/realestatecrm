import { Metadata } from 'next';
import AIModelsSettingsClient from '@/components/AIModelsSettingsClient';

export const metadata: Metadata = {
  title: 'AI Model Keys - Settings',
};

export default function AIModelsPage() {
  return <AIModelsSettingsClient />;
}
