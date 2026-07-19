type DiagnosticDetails = Record<string, unknown>;

function isDevelopmentBuild(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function logDevDiagnostic(
  label: string,
  details?: DiagnosticDetails,
): void {
  if (!isDevelopmentBuild()) return;
  console.log(label, details ?? {});
}

export function warnDevDiagnostic(
  label: string,
  details?: DiagnosticDetails,
): void {
  if (!isDevelopmentBuild()) return;
  console.warn(label, details ?? {});
}
