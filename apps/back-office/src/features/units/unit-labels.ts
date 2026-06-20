/**
 * The single home for the words the Unit screen shows. The active⇄inactive
 * verb pairing and the create/edit pairing each live here once, so the label,
 * the toast, and the error message can never word the same state differently.
 */

export function unitFormTitle(isEditing: boolean): string {
  return isEditing ? "Edit Unit" : "Create Unit";
}

export function unitSubmitLabel(
  isSubmitting: boolean,
  isEditing: boolean
): string {
  if (isSubmitting) {
    return isEditing ? "Saving..." : "Creating...";
  }

  return isEditing ? "Save Unit" : "Create Unit";
}

/** Imperative verb for a save outcome, e.g. "Could not {update} unit". */
export function unitSaveAction(isEditing: boolean): string {
  return isEditing ? "update" : "create";
}

/** Past-tense verb for a save outcome, e.g. "{name} {updated}". */
export function unitSaveResult(isEditing: boolean): string {
  return isEditing ? "updated" : "created";
}

/** Imperative verb for the active-state toggle, e.g. button and aria labels. */
export function unitActiveStateAction(active: boolean): string {
  return active ? "Deactivate" : "Reactivate";
}

export function unitActiveStateBadge(active: boolean): string {
  return active ? "Active" : "Inactive";
}

/** Past-tense verb for an active-state change, keyed on the new state. */
export function unitActiveStateResult(nowActive: boolean): string {
  return nowActive ? "reactivated" : "deactivated";
}
