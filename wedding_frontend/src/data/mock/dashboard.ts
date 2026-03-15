import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  FilePlus2,
  PackageSearch,
  UserPlus,
} from 'lucide-react'
import type {
  ActivityItem,
  AlertItem,
  BookingRingSummary,
  InventoryAlert,
  InventoryAllocation,
  Metric,
  PaymentSummary,
  QuickActionItem,
  QuoteField,
  RecentBooking,
  ScheduleItem,
} from '@/types/dashboard'

const july = (day: number) => new Date(2024, 6, day)

export const dashboardMetrics: Metric[] = [
  {
    id: 'todayEvents',
    labelKey: 'dashboard.metric.todayEvents',
    value: '5',
    meta: 'Ballroom and decor operations',
    icon: CalendarClock,
  },
  {
    id: 'upcoming',
    labelKey: 'dashboard.metric.upcoming',
    value: '12',
    meta: 'Next premium bookings in queue',
    icon: BriefcaseBusiness,
  },
  {
    id: 'pendingQuotes',
    labelKey: 'dashboard.metric.pendingQuotes',
    value: '3',
    meta: 'Awaiting final client approval',
    icon: ClipboardList,
  },
  {
    id: 'revenue',
    labelKey: 'dashboard.metric.revenue',
    value: '$18,450',
    meta: 'Collected across active accounts',
    icon: CircleDollarSign,
  },
]

export const todaysSchedule: ScheduleItem[] = [
  {
    id: 'sch-1',
    time: '10:00 AM',
    clientName: 'Ahmed & Noor',
    venue: 'Grand Hall',
    status: 'Confirmed',
    focus: 'Stage opening and family seating readiness',
    counter: '3',
  },
  {
    id: 'sch-2',
    time: '04:00 PM',
    clientName: 'Sarah & Ali',
    venue: 'Rose Garden',
    status: 'Pending',
    focus: 'Engagement night floral entrance approval',
    counter: '22',
  },
  {
    id: 'sch-3',
    time: '08:00 PM',
    clientName: 'Omar & Lina',
    venue: 'Crystal Hall',
    status: 'Completed',
    focus: 'Reception handoff and closing checklist',
    counter: '3',
  },
]

export const quickActions: QuickActionItem[] = [
  { id: 'booking', labelKey: 'dashboard.quickActionsList.booking', icon: BriefcaseBusiness },
  { id: 'quote', labelKey: 'dashboard.quickActionsList.quote', icon: FilePlus2 },
  { id: 'customer', labelKey: 'dashboard.quickActionsList.customer', icon: UserPlus },
  { id: 'inventory', labelKey: 'dashboard.quickActionsList.inventory', icon: PackageSearch },
]

export const quoteFields: QuoteField[] = [
  { id: 'client' },
  { id: 'services' },
  { id: 'amount' },
]

export const dashboardAlerts: AlertItem[] = [
  {
    id: 'alert-1',
    title: 'Low stock on white Chiavari chairs',
    description: 'Only 18 units remain after tonight’s ballroom allocation.',
    severity: 'critical',
  },
  {
    id: 'alert-2',
    title: 'Overdue payment on BKG-2403',
    description: 'Engagement night deposit is 3 days late and quote hold expires tonight.',
    severity: 'high',
  },
  {
    id: 'alert-3',
    title: 'Booking missing deposit',
    description: 'VIP Hall Booking has venue hold but only 50% of the required deposit is posted.',
    severity: 'medium',
  },
  {
    id: 'alert-4',
    title: 'Quote expiring soon',
    description: 'Henna Lounge Styling proposal auto-expires tomorrow at 5:00 PM.',
    severity: 'low',
  },
]

export const dashboardPaymentSummary: PaymentSummary = {
  collectedToday: 12450,
  dueToday: 4200,
  overdue: 3800,
  monthTotal: 86200,
}

export const recentBookings: RecentBooking[] = [
  {
    id: 'rb-1',
    bookingNumber: 'BKG-2401',
    clientName: 'Ahmed & Noor',
    eventDate: july(12),
    venue: 'Grand Hall',
    status: 'Confirmed',
    total: 5200,
    balance: 0,
  },
  {
    id: 'rb-2',
    bookingNumber: 'BKG-2402',
    clientName: 'Sarah & Ali',
    eventDate: july(14),
    venue: 'Rose Garden',
    status: 'Pending',
    total: 3500,
    balance: 1100,
  },
  {
    id: 'rb-3',
    bookingNumber: 'BKG-2403',
    clientName: 'Asim & Yasmin',
    eventDate: july(16),
    venue: 'Crystal Hall',
    status: 'Completed',
    total: 4500,
    balance: 0,
  },
  {
    id: 'rb-4',
    bookingNumber: 'BKG-2404',
    clientName: 'Omar & Lina',
    eventDate: july(16),
    venue: 'Royal Ballroom',
    status: 'Completed',
    total: 7800,
    balance: 0,
  },
]

export const lowStockItems: InventoryAlert[] = [
  {
    id: 'stock-1',
    itemName: 'White Chairs',
    availableQty: 12,
    reorderLevel: 30,
    status: 'Critical',
  },
  {
    id: 'stock-2',
    itemName: 'Decor Flowers',
    availableQty: 5,
    reorderLevel: 12,
    status: 'Critical',
  },
  {
    id: 'stock-3',
    itemName: 'Curtains',
    availableQty: 8,
    reorderLevel: 16,
    status: 'Monitor',
  },
]

export const inventoryAllocations: InventoryAllocation[] = [
  {
    id: 'inv-1',
    itemName: 'White Chiavari Chair',
    quantity: 100,
    status: 'Reserved',
  },
  {
    id: 'inv-2',
    itemName: 'Crystal Centerpieces',
    quantity: 15,
    status: 'Prepared',
  },
  {
    id: 'inv-3',
    itemName: 'Fairy Lights',
    quantity: 30,
    status: 'Reserved',
  },
]

export const bookingRingSummary: BookingRingSummary = {
  totalItems: 254,
  paid: 12450,
  due: 4200,
}

export const reportSeries = [12, 16, 15, 19, 24, 28, 27, 31, 34, 33, 38, 42]

export const recentActivity: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'Quote created',
    description: 'Garden Luxe floral setup prepared for Mariam & Youssef.',
    timeLabel: '18 min ago',
  },
  {
    id: 'act-2',
    title: 'Booking confirmed',
    description: 'Dana & Saud wedding reception moved to confirmed after deposit receipt.',
    timeLabel: '52 min ago',
  },
  {
    id: 'act-3',
    title: 'Payment added',
    description: 'Partial payment of $2,500 posted to VIP Hall Booking.',
    timeLabel: '1 hr ago',
  },
]

export const alertSeverityIcons = {
  low: AlertTriangle,
  medium: AlertTriangle,
  high: AlertTriangle,
  critical: AlertTriangle,
}

export const paymentRows = [
  { id: 'pay-1', label: 'Paid', amount: 12450 },
  { id: 'pay-2', label: 'Due', amount: 4200 },
]
