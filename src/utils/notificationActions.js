// Pure function: given a notification payload + the persisted action state
// (investigating, ignored, tagged), return the action button set to render
// on a notification card. Extracted from PushNotifications.jsx so it can be
// unit-tested - the per-state action set is critical (e.g. Dismiss was
// removed from Ongoing, Tag CTA only on End of Leak, etc.).

// Rule (Rami 2026-06-06): every notification, no matter its type or state,
// must offer at least a 'View' action that navigates to the system page.
// Specific states layer additional actions on top (Tag, Ignore, On it, etc.)
// but View is the constant - the user always has a way out of the notification
// into the source system.
export function buildActions(n, { investigating, ignored, tagged }) {
  // Non-water notifications: just View. Specific non-water alert types
  // (valve error, power lost, offline, etc.) don't have actionable
  // states beyond navigating to the system to investigate.
  if (n.type !== 'leak') {
    return [{ key: 'view', label: 'View', primary: true }];
  }
  // Once ignored, every action collapses to View. Subsequent pushes for the
  // SAME event respect this (a NEW Warning push clears the ignored flag via
  // applyPushEvent).
  if (ignored) return [{ key: 'view', label: 'View', primary: true }];
  switch (n.state) {
    case 'Warning':
      return [
        { key: 'view',        label: 'View',  primary: true },
        ...(investigating ? [] : [{ key: 'investigate', label: 'On it' }]),
        { key: 'ignore',      label: 'Ignore' },
      ];
    case 'Ongoing':
      // No Dismiss action - swipe-to-dismiss is native on iOS / Android.
      return [
        { key: 'view',    label: 'View', primary: true },
      ];
    case 'Shutoff':
      // No Ignore on Critical state.
      return [
        { key: 'view',        label: 'View',  primary: true },
        ...(investigating ? [] : [{ key: 'investigate', label: 'On it' }]),
      ];
    case 'End of Leak':
      // PRD 15 § 7.1 - readable label, no Dismiss (swipe-to-dismiss native).
      // 'tagCta' flag marks this as the Wint-blue primary CTA on the push.
      // Tag is the primary action; View stays available as the secondary
      // path into the system page.
      return [
        { key: 'tag',  label: tagged ? '✓ Tagged' : 'Tag the cause', primary: !tagged, done: tagged, tagCta: !tagged },
        { key: 'view', label: 'View' },
      ];
    default:
      return [{ key: 'view', label: 'View', primary: true }];
  }
}
