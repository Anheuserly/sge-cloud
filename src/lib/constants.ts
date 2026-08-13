import { DatabasePreset } from '@/types/database';

export const DATABASE_PRESETS: DatabasePreset[] = [
  {
    id: 'amcmep',
    name: 'AMC MEP App DB',
    url: process.env.AMCMEP_DATABASE_URL || 'postgresql://localhost:5432/amcmep',
    description: 'AMC MEP App Database (businesses, memberships, listings, chat & requests)',
    badge: 'AMC MEP App',
    color: 'emerald',
  },
  {
    id: 'workofhuman',
    name: 'WorkOfHuman App DB',
    url: process.env.WORKOFHUMAN_DATABASE_URL || 'postgresql://localhost:5432/workofhuman',
    description: 'WorkOfHuman App Database (empty schema for custom WorkOfHuman models)',
    badge: 'WorkOfHuman App',
    color: 'blue',
  },
  {
    id: 'sge_datahub',
    name: 'SGE DataHub Control DB',
    url: process.env.CONTROL_DATABASE_URL || 'postgresql://localhost:5432/sge_datahub',
    description: 'SGE DataHub Control Plane registry & node metadata',
    badge: 'Control Plane',
    color: 'purple',
  },
];

export function resolveConnectionString(presetOrUrl?: string | null): string {
  if (!presetOrUrl) {
    return DATABASE_PRESETS[0].url;
  }
  const preset = DATABASE_PRESETS.find((p) => p.id === presetOrUrl);
  if (preset) {
    return preset.url;
  }
  return presetOrUrl;
}
