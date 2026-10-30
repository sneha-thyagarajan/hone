import { GraduationCap } from 'lucide-react'
import { ComingSoon } from '@/components/ui/ComingSoon'

export default function StudySessionPage() {
  return (
    <ComingSoon
      icon={<GraduationCap size={28} />}
      title="Study session"
      description="A distraction-free focus mode for flashcards with spaced-repetition ratings (Again / Hard / Good / Easy) that update your readiness."
    />
  )
}
