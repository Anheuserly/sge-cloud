import { DatabasePreset } from '@/types/database';

export const DATABASE_PRESETS: DatabasePreset[] = [
  {
    id: 'amcmep',
    name: 'AMC MEP App DB',
    envVars: ['AMCMEP_DATABASE_URL', 'DATABASE_URL'],
    description: 'AMC MEP App Database (businesses, memberships, listings, chat & requests)',
    badge: 'AMC MEP App',
    color: 'emerald',
  },
  {
    id: 'workofhuman',
    name: 'WorkOfHuman App DB',
    envVars: ['WORKOFHUMAN_DATABASE_URL'],
    description: 'WorkOfHuman App Database (empty schema for custom WorkOfHuman models)',
    badge: 'WorkOfHuman App',
    color: 'blue',
  },
  {
    id: 'sge_datahub',
    name: 'SGE DataHub Control DB',
    envVars: ['CONTROL_DATABASE_URL'],
    description: 'SGE DataHub Control Plane registry & node metadata',
    badge: 'Control Plane',
    color: 'purple',
  },
];

export function isUsableConnectionString(url?: string): url is string {
  return Boolean(
    url &&
      !/change-me|real_password|your[_-]?password|user:password|localhost|127\.0\.0\.1|vps\.example\.com/i.test(url)
  );
}

export function getConfiguredDatabasePresets(): DatabasePreset[] {
  return DATABASE_PRESETS.filter((preset) =>
    preset.envVars.some((envVar) => isUsableConnectionString(process.env[envVar]))
  );
}

export function resolveConnectionString(presetOrUrl?: string | null): string {
  const target = presetOrUrl || DATABASE_PRESETS[0].id;
  const preset = DATABASE_PRESETS.find((p) => p.id === target);

  if (!preset) {
    if (/^postgres(ql)?:\/\//i.test(target)) {
      return target;
    }

    throw new Error(`Unknown database target "${target}". Select a configured database preset or provide a PostgreSQL connection URL.`);
  }

  const url = preset.envVars.map((envVar) => process.env[envVar]).find(isUsableConnectionString);
  if (!url) {
    throw new Error(`Database preset "${preset.name}" is not configured. Set one of these Cloudflare secrets to the real VPS PostgreSQL URL: ${preset.envVars.join(', ')}.`);
  }

  return url;
}
