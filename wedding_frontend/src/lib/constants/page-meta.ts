export type PageMeta = {
  title: string
  subtitle: string
}

export const pageMeta: Record<string, PageMeta> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of bookings, quotations, payments, and operations',
  },
  calendar: {
    title: 'Calendar',
    subtitle: 'Manage event dates, bookings, and venue availability',
  },
}
