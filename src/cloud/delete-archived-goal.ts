/**
 * Explicit permanent deletion, never used by ordinary Goal archiving.
 * Every statement repeats the same workspace/status/ownership fence inside one
 * D1 transaction. Malformed legacy cross-Action history fails closed.
 */
export async function deleteArchivedGoalData(
  db: D1Database,
  workspaceId: string,
  goalId: string,
): Promise<boolean> {
  const eligibleGoal = `
    SELECT g.id FROM goals g
    WHERE g.workspace_id = ? AND g.id = ? AND g.status IN ('completed', 'cancelled')
    AND NOT EXISTS (
      SELECT 1 FROM completions c
      JOIN actions owner ON owner.workspace_id = c.workspace_id AND owner.id = c.action_id
      JOIN schedules s ON s.workspace_id = c.workspace_id AND s.id = c.schedule_id
      JOIN actions scheduled ON scheduled.workspace_id = s.workspace_id AND scheduled.id = s.action_id
      WHERE c.workspace_id = g.workspace_id
        AND (owner.goal_id IS g.id) <> (scheduled.goal_id IS g.id)
    )
    AND NOT EXISTS (
      SELECT 1 FROM ritual_item_completions c
      JOIN ritual_items i ON i.workspace_id = c.workspace_id AND i.id = c.ritual_item_id
      JOIN actions owner ON owner.workspace_id = i.workspace_id AND owner.id = i.ritual_action_id
      JOIN schedules s ON s.workspace_id = c.workspace_id AND s.id = c.schedule_id
      JOIN actions scheduled ON scheduled.workspace_id = s.workspace_id AND scheduled.id = s.action_id
      WHERE c.workspace_id = g.workspace_id
        AND (owner.goal_id IS g.id) <> (scheduled.goal_id IS g.id)
    )`;

  const results = await db.batch([
    // Overrides have a restrictive schedule FK; remove only this Goal's rows first.
    db
      .prepare(
        `DELETE FROM occurrence_overrides WHERE workspace_id = ? AND schedule_id IN (
      SELECT s.id FROM schedules s JOIN actions a
        ON a.workspace_id = s.workspace_id AND a.id = s.action_id
      WHERE s.workspace_id = ? AND a.goal_id IN (${eligibleGoal})
    )`,
      )
      .bind(workspaceId, workspaceId, workspaceId, goalId),
    // Existing composite, workspace-scoped ON DELETE CASCADE foreign keys remove:
    // schedules, completions (also schedule_id=NULL), ritual items + item history,
    // attachments (including archived ones), and action_life_areas. No shared catalog rows.
    db
      .prepare(`DELETE FROM actions WHERE workspace_id = ? AND goal_id IN (${eligibleGoal})`)
      .bind(workspaceId, workspaceId, goalId),
    db
      .prepare(`DELETE FROM goals WHERE workspace_id = ? AND id IN (${eligibleGoal})`)
      .bind(workspaceId, workspaceId, goalId),
  ]);
  return results[2]?.meta.changes === 1;
}
