# Suma - Tiny Ledger (Offline) - Phase 2

A modern, offline-first cash tracker built with Ionic Angular. Track your income and expenses with advanced features like tags, insights, themes, and local notifications.

## 🚀 Phase 2 Features

### A) Notes & Tags
- **Extended Entry Model**: Now includes `tags: string[]`
- **Tag Management**: Add/remove tags with chip UI
- **Tag Filters**: Filter transactions by tags in History
- **CSV Export**: Includes tags column (semicolon-delimited)

### B) Charts & Insights
- **Insights Page**: `/insights` route with analytics
- **Bar Chart**: Last 7 days net flow visualization
- **Pie Chart**: Spending breakdown by tags
- **Chart.js Integration**: Local-only chart rendering
- **Time Period Filters**: Week/Month/All time views

### C) Local Reminders
- **Daily Notifications**: Remind users to log expenses
- **Time Picker**: Customizable reminder time (default 8:00 PM)
- **Permission Handling**: Graceful permission flow
- **Settings Integration**: Toggle and time configuration

### D) Theme Toggle
- **3 Theme Presets**: Ocean, Mint, Sunset
- **Dynamic Switching**: No reload required
- **Persistent Storage**: Theme preference saved
- **Gradient Accents**: Each theme has unique color schemes

### E) Backup & Restore
- **JSON Export**: Full app state backup
- **CSV Export**: Transaction data only
- **Import Validation**: Schema validation for JSON files
- **Round-trip Support**: Export → Delete → Import works perfectly

## 🎨 Modern UI Features

- **Gradient Design**: Blue → Violet, Teal → Mint, Coral → Orange
- **Glass-morphism**: Backdrop blur effects on cards
- **Smooth Animations**: 60fps transitions and hover effects
- **Mobile-first**: Responsive design with large tap targets
- **Dark Theme**: Modern dark interface with vibrant accents

## 📱 Screens

1. **Home**: Dashboard with balance card, quick actions, today's transactions
2. **History**: Transaction list with advanced filters (type, period, tags)
3. **Insights**: Analytics with charts and spending breakdown
4. **Settings**: Theme, notifications, backup/restore, currency options

## 🛠 Tech Stack

- **Framework**: Ionic 8 + Angular (standalone components)
- **Storage**: Capacitor Preferences (offline JSON storage)
- **Charts**: Chart.js + ng2-charts
- **Notifications**: Capacitor Local Notifications
- **Styling**: SCSS with CSS custom properties
- **Icons**: Ionicons
- **Typography**: Poppins font family

## 📦 Dependencies

```bash
npm install chart.js ng2-charts @capacitor/local-notifications
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Ionic CLI

### Installation
```bash
# Clone and install
git clone <repository>
cd suma
npm install

# Install Phase 2 dependencies
npm install chart.js ng2-charts @capacitor/local-notifications

# Sync Capacitor
ionic cap sync
```

### Development
```bash
ionic serve
```

### Building
```bash
ionic build
```

## 📊 Data Models

### Entry (Extended)
```typescript
interface Entry {
  id: string;
  ts: number;
  amount: number;
  note?: string;
  tags: string[]; // NEW: Tag support
}
```

### Settings (Extended)
```typescript
interface Settings {
  currency: string;
  weekStartsOn: 0 | 1;
  theme: 'ocean' | 'mint' | 'sunset'; // NEW: Theme support
  dailyReminder: boolean; // NEW: Notification toggle
  reminderTime: string; // NEW: HH:MM format
}
```

### AppState (NEW)
```typescript
interface AppState {
  entries: Entry[];
  settings: Settings;
  version: string;
  exportDate: number;
}
```

## 🎯 Features Overview

### Home Page
- **Balance Card**: Large display with gradient styling
- **Statistics Grid**: Transaction count, income/expense counts
- **Tag Management**: Add/remove tags with chip UI
- **Quick Actions**: Gradient buttons for easy access
- **Transaction List**: Modern cards with icons and animations

### History Page
- **Summary Cards**: Income, Expenses, Net Total with icons
- **Advanced Filters**: Type, period, and tag filtering
- **Transaction Timeline**: Chronological list with tag pills
- **Export Options**: CSV with tags column

### Insights Page
- **Bar Chart**: Daily net flow over time
- **Pie Chart**: Spending breakdown by tags
- **Time Filters**: Week/Month/All time views
- **Summary Stats**: Total income, expenses, net

### Settings Page
- **Theme Selection**: 3 beautiful presets
- **Notification Settings**: Daily reminder toggle and time
- **Backup & Restore**: JSON/CSV export and import
- **Currency Options**: 11+ currencies including Cedi (₵)

## 🧪 QA Checklist

### A) Notes & Tags
- [ ] Can add multiple tags to entries
- [ ] Tag chips display correctly with remove buttons
- [ ] Existing tags can be selected from dropdown
- [ ] Tags persist after app restart
- [ ] History page filters by tags work
- [ ] CSV export includes tags column
- [ ] Tag validation (no empty tags, no duplicates)

### B) Charts & Insights
- [ ] Insights page loads without errors
- [ ] Bar chart displays daily net flow correctly
- [ ] Pie chart shows spending by tags
- [ ] Time period filters update charts
- [ ] Charts work offline (no network calls)
- [ ] Chart animations are smooth (60fps)
- [ ] Responsive design on mobile devices

### C) Local Reminders
- [ ] Permission request works gracefully
- [ ] Daily reminder can be toggled on/off
- [ ] Time picker updates reminder time
- [ ] Notifications schedule correctly
- [ ] App handles permission denied gracefully
- [ ] Reminders persist across app restarts

### D) Theme Toggle
- [ ] All 3 themes apply correctly
- [ ] Theme switches without page reload
- [ ] Theme preference persists
- [ ] All pages update with new theme
- [ ] Gradient colors change appropriately
- [ ] Theme initialization works on app start

### E) Backup & Restore
- [ ] JSON export creates valid file
- [ ] CSV export includes all data
- [ ] Import validates JSON schema
- [ ] Round-trip works (export → delete → import)
- [ ] Error handling for invalid files
- [ ] File download triggers correctly

### General
- [ ] App works 100% offline
- [ ] All animations are smooth (60fps)
- [ ] Large tap targets on mobile
- [ ] Responsive design on all screen sizes
- [ ] No console errors
- [ ] TypeScript compilation successful
- [ ] No linting errors

## 🔧 Development Notes

### Chart.js Integration
- Uses ng2-charts for Angular integration
- Charts render locally without network calls
- Responsive design with proper aspect ratios
- Custom color schemes matching app themes

### Theme System
- CSS custom properties for dynamic theming
- Theme service manages state and persistence
- Smooth transitions between themes
- Gradient backgrounds and accent colors

### Notification System
- Capacitor Local Notifications for cross-platform support
- Graceful permission handling
- Repeating notifications with custom times
- Settings integration for user control

### Storage Architecture
- Clean separation between storage and business logic
- Type-safe interfaces for all data models
- Backup/restore with schema validation
- Offline-first design with Capacitor Preferences

## 📄 License

MIT License
