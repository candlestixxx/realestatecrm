import { Metadata } from 'next';
import MCPSettingsClient from '@/components/MCPSettingsClient';

export const metadata: Metadata = {
  title: 'MCP Server - Settings',
};

export default function MCPSettingsPage() {
  return <MCPSettingsClient />;
}
