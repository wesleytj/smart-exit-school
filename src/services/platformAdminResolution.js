export function isSameUserRevalidation(resolvedUserId, sessionUserId) {
  return Boolean(resolvedUserId) && resolvedUserId === sessionUserId;
}
