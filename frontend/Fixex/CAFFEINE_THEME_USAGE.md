# Caffeine Theme Usage Guide

This guide shows how to properly use the Caffeine theme colors and features in the ExpenseWise application.

## Color Usage Examples

### Basic Colors
```tsx
// Background and text
<div className="bg-background text-foreground">
  Main content area
</div>

// Cards
<Card className="bg-card text-card-foreground border-border">
  Card content
</Card>

// Primary actions
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Button
</Button>

// Secondary actions
<Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
  Secondary Button
</Button>
```

### Chart Colors
```tsx
// Use chart colors for data visualization
<div className="bg-chart-1">Primary data</div>
<div className="bg-chart-2">Secondary data</div>
<div className="bg-chart-3">Tertiary data</div>
<div className="bg-chart-4">Quaternary data</div>
<div className="bg-chart-5">Quinary data</div>

// For charts with Recharts or similar libraries
const chartConfig = {
  primary: 'var(--chart-1)',
  secondary: 'var(--chart-2)',
  tertiary: 'var(--chart-3)',
  quaternary: 'var(--chart-4)',
  quinary: 'var(--chart-5)',
}
```

### Shadows
```tsx
// Different shadow levels
<Card className="shadow-sm">Subtle shadow</Card>
<Card className="shadow-md">Medium shadow</Card>
<Card className="shadow-lg">Large shadow</Card>
<Card className="shadow-xl">Extra large shadow</Card>

// With hover effects
<Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
  Interactive card
</Card>
```

### Typography
```tsx
// Font families
<p className="font-sans">Sans serif text</p>
<p className="font-serif">Serif text</p>
<code className="font-mono">Monospace code</code>
```

### Muted Elements
```tsx
// Muted backgrounds and text
<div className="bg-muted text-muted-foreground">
  Muted content
</div>

// Input styling
<input className="border-input bg-background text-foreground" />
```

### Destructive Actions
```tsx
// Delete buttons and error states
<Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Delete
</Button>
```

## Theme Switching

The theme automatically switches between light and dark modes using the `ThemeToggle` component:

```tsx
import { ThemeToggle } from "@/components/ThemeToggle";

// Add to any layout
<ThemeToggle />
```

## Best Practices

1. **Always use CSS variables**: Use `bg-primary` instead of hardcoded colors
2. **Consistent spacing**: Use the defined spacing scale
3. **Shadow hierarchy**: Use appropriate shadow levels for depth
4. **Hover states**: Add interactive feedback with hover effects
5. **Accessibility**: Ensure sufficient contrast ratios in both themes

## Design Tokens Available

- **Colors**: All theme colors (primary, secondary, muted, accent, destructive, etc.)
- **Chart Colors**: 5 data visualization colors that adapt to theme
- **Shadows**: 8 shadow levels (2xs, xs, sm, default, md, lg, xl, 2xl)
- **Typography**: Sans, serif, and mono font stacks
- **Borders**: Consistent border radius using `--radius`
