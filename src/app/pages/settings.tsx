import { Settings } from 'lucide-react'
import { ComingSoon } from '@/components/ui/ComingSoon'

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={<Settings size={28} />}
      title="Settings"
      description="Choose your AI provider, base URL, model and API key — or run the built-in mock provider. Your key stays on your device."
    />
  )
}
