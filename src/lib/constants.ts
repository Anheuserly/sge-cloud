export function isUsableConnectionString(url?: string): url is string {
  return Boolean(
    url &&
      !/change-me|real_password|your[_-]?password|user:password|localhost|127\.0\.0\.1|vps\.example\.com/i.test(url)
  );
}

export function resolveConnectionString(presetOrUrl?: string | null): string {
  const target = presetOrUrl || 'sge_datahub';
  
  // 1. Get the base control URL
  const controlUrl = process.env.SGE_CONTROL_DATABASE_URL || process.env.CONTROL_DATABASE_URL;
  
  if (!controlUrl || !isUsableConnectionString(controlUrl)) {
    throw new Error('SGE_CONTROL_DATABASE_URL is not configured or invalid.');
  }

  // 2. If the target is the control database itself, return the control URL
  if (target === 'sge_datahub') {
    return controlUrl;
  }

  // 3. For project databases, dynamically construct the URL by replacing the database name at the end
  // Expected format: postgresql://user:pass@host:port/dbname
  try {
    const url = new URL(controlUrl);
    url.pathname = `/${target}`;
    return url.toString();
  } catch (e) {
    throw new Error('Failed to parse SGE_CONTROL_DATABASE_URL as a valid connection string.');
  }
}
