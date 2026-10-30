import { CalendarDays } from 'lucide-react'
import { ComingSoon } from '@/components/ui/ComingSoon'

export default function PlannerPage() {
  return (
    <ComingSoon
      icon={<CalendarDays size={28} />}
      title="Planner"
      description="A month calendar with your exam dates, study sessions and countdowns — plus a generated study plan built from your quiz results."
    />
  )
}
