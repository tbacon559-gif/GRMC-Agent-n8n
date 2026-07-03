import { taskRepository } from "@/core/repositories/task.repository";
import { calendarRepository } from "@/core/repositories/calendar.repository";
import { getFinanceSummary } from "@/core/services/finance.service";
import { MODULES } from "@/core/modules/registry";

/**
 * Rule-based recommendations rather than an AI call on every dashboard
 * load — keeps the home screen fast, free, and available even without an
 * ANTHROPIC_API_KEY configured. The natural-language AI Assistant and the
 * on-demand AI Chief of Staff briefing are where an actual model call
 * makes sense, because those are explicit, occasional user actions.
 */
function buildRecommendations(input: { overdueTaskCount: number; upcomingEventCount: number }): string[] {
  const recommendations: string[] = [];
  if (input.overdueTaskCount > 0) {
    recommendations.push(`${input.overdueTaskCount} task(s) are overdue across your businesses.`);
  }
  if (input.upcomingEventCount > 0) {
    recommendations.push(`${input.upcomingEventCount} upcoming calendar item(s) this week.`);
  }
  if (!recommendations.length) {
    recommendations.push("Nothing urgent — you're on top of things.");
  }
  return recommendations;
}

/**
 * The unified "what should I work on today" dashboard: Core aggregates
 * (tasks due across every module, upcoming calendar, cross-module
 * revenue) alongside each registered module's own widget — Core never
 * branches on a module's identity, it just iterates MODULES.
 */
export async function getDashboardData(now: Date = new Date()) {
  const [tasksDue, upcomingEvents, finance, moduleWidgets] = await Promise.all([
    taskRepository.listDue(now, 10),
    calendarRepository.listUpcoming(now, 10),
    getFinanceSummary(now),
    Promise.all(MODULES.map((module) => module.dashboardWidget?.())),
  ]);

  return {
    tasksDue,
    upcomingEvents,
    finance,
    moduleWidgets: moduleWidgets.filter((widget) => widget != null),
    recommendations: buildRecommendations({
      overdueTaskCount: tasksDue.length,
      upcomingEventCount: upcomingEvents.length,
    }),
    generatedAt: now,
  };
}
