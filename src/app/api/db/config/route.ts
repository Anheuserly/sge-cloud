export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getConfiguredDatabasePresets } from '@/lib/constants';

export async function GET() {
  const presets = getConfiguredDatabasePresets().map((preset) => ({
    id: preset.id,
    name: preset.name,
    description: preset.description,
    badge: preset.badge,
    color: preset.color,
  }));

  return NextResponse.json({
    success: true,
    presets,
    hasConfiguredDatabase: presets.length > 0,
  });
}
