import { Code2 } from 'lucide-react'
import { ComingSoon } from '@/components/ui/ComingSoon'

export default function CodePracticePage() {
  return (
    <ComingSoon
      icon={<Code2 size={28} />}
      title="Code practice"
      description="A Python or JavaScript editor with a sandboxed test runner. Expected outputs come from running a reference solution, never guessed."
    />
  )
}
