export const TRACKS = {
  T1: {
    code: 'T1',
    name: 'Pipeline Driver',
    color: 'blue',
    description: 'Net-new revenue. Reps need to find, qualify, and close new business.',
    defaultActivities: {
      education: ['Help Docs', 'Video Overview', 'Feature Announcement Email'],
      enablement: ['Live ILT: Positioning + Pitch', 'Async Video: Product Demo', 'One-Pager / Battlecard'],
    },
  },
  T2: {
    code: 'T2',
    name: 'Blocker Buster',
    color: 'pink',
    description: 'Objection or competitor. Reps are losing deals due to a specific blocker.',
    defaultActivities: {
      education: ['FAQ Doc', 'Competitive Comparison Page'],
      enablement: ['Objection Drill (Live)', 'Competitive Battlecard', 'Gong Clip Library'],
    },
  },
  T3: {
    code: 'T3',
    name: 'Unlearn / Relearn',
    color: 'amber',
    description: 'Behavior change. Reps need to stop doing X and start doing Y.',
    defaultActivities: {
      education: ['Updated Help Docs', 'Migration Guide', 'In-App Notification'],
      enablement: ['Live ILT: Before/After Workshop', 'Terminology Cheat Sheet', 'Manager Reinforcement Guide'],
    },
  },
  T4: {
    code: 'T4',
    name: 'New Audience',
    color: 'green',
    description: 'New role or segment. Expanding to a new buyer, user type, or market.',
    defaultActivities: {
      education: ['Audience-Specific Help Docs', 'Onboarding Video'],
      enablement: ['Persona Profile Card', 'Discovery Question Guide', 'Live ILT: New Audience Pitch'],
    },
  },
  T5: {
    code: 'T5',
    name: 'Retire + Replace',
    color: 'orange',
    description: 'Sunset. Something old is going away and reps need to stop using/saying it.',
    defaultActivities: {
      education: ['Deprecation Notice', 'Updated Help Docs', 'Email Announcement'],
      enablement: ['Terminology Cheat Sheet', 'Slack Drip Campaign', 'Gong Monitoring Alert'],
    },
  },
  T6: {
    code: 'T6',
    name: 'Partner / Migration',
    color: 'purple',
    description: 'Partner play or migration path. Help reps sell with or migrate from a third party.',
    defaultActivities: {
      education: ['Integration Docs', 'Partner One-Pager'],
      enablement: ['Migration Battlecard', 'Live ILT: Migration Play', 'ROI Calculator / Talk Track'],
    },
  },
  Custom: {
    code: 'Custom',
    name: 'Custom',
    color: 'slate',
    description: "Doesn't fit a standard track. Define your own activities.",
    defaultActivities: {
      education: [],
      enablement: [],
    },
  },
} as const

export type TrackCode = keyof typeof TRACKS

// Given tier + tracks, return pre-selected activities
export function suggestActivities(tier: string, tracks: TrackCode[]) {
  const edu: string[] = []
  const enb: string[] = []
  tracks.forEach(code => {
    const t = TRACKS[code]
    if (!t) return
    t.defaultActivities.education.forEach(a => { if (!edu.includes(a)) edu.push(a) })
    t.defaultActivities.enablement.forEach(a => { if (!enb.includes(a)) enb.push(a) })
  })
  // Large/XL gets the full list; Medium drops last item from each; Small keeps first 2 only
  if (tier === 'small') return { education: edu.slice(0, 2), enablement: enb.slice(0, 2) }
  if (tier === 'medium') return { education: edu.slice(0, -1), enablement: enb.slice(0, -1) }
  return { education: edu, enablement: enb }
}
