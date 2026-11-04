import { Metadata } from 'next';
import AILearningMemory from '@/components/AILearningMemory';

export const metadata: Metadata = {
  title: 'AI Learning & Memory - Settings',
};

export default function AIMemorySettingsPage() {
  return <AILearningMemory />;
}
