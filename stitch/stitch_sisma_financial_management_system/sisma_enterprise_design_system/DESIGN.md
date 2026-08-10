---
name: Sisma Enterprise Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#575e70'
  on-secondary: '#ffffff'
  secondary-container: '#d9dff5'
  on-secondary-container: '#5c6274'
  tertiary: '#006242'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d55'
  on-tertiary-container: '#bdffdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dce2f7'
  secondary-fixed-dim: '#c0c6db'
  on-secondary-fixed: '#141b2b'
  on-secondary-fixed-variant: '#404758'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gap-xs: 4px
  gap-sm: 8px
  gap-md: 16px
  gap-lg: 24px
  margin-page: 32px
  container-max: 1440px
---

## Brand & Style

The design system is a premium enterprise SaaS framework tailored for the educational administration and financial management of SMA Persiapan Stabat. It blends the utility of developer-centric tools like **Linear** and **GitHub** with the sophisticated, reliable aesthetic of **Stripe**.

The personality is **authoritative yet efficient**. It prioritizes information density and data clarity over decorative elements, ensuring that administrative staff can process complex student records and financial data with speed and precision.

**Style: Modern Corporate / High-Density**
- **Minimalist Foundations:** Heavy use of negative space for focus, punctuated by high-contrast primary accents.
- **Data-First:** Visual weight is assigned based on information hierarchy. 
- **Professional Precision:** Sharp alignment, consistent 8pt grid, and subtle micro-interactions that signify high-quality engineering.
- **Bilingual Context:** While the interface is professional, it maintains cultural relevance for the Indonesian educational context through clear, localized labeling.

## Colors

The palette is anchored by **Enterprise Blue**, a color that evokes stability and trust. This is contrasted against a deep "Slate 950" sidebar to provide a strong architectural anchor for navigation.

- **Primary:** Used for the main brand touchpoints, primary actions, and active navigation states.
- **Sidebar Background:** A high-contrast dark mode foundation (#111827) used even in light mode to differentiate navigation from workspace.
- **Surface & Borders:** Layering relies on the transition from the background (#F8FAFC) to white cards (#FFFFFF) defined by thin, low-contrast borders (#E2E8F0).
- **Functional Colors:** Success, Warning, and Danger colors are used strictly for status indicators and destructive actions.

**Dark Mode Support:** In dark mode, surfaces should shift to `#0F172A`, borders to `#1E293B`, and primary text to `#F8FAFC`.

## Typography

This design system uses **Inter** for its exceptional legibility in data-dense environments. To achieve the high-density "SaaS" look, we utilize tight line heights and specialized label styles.

- **Scale:** A mathematical 8pt-based scaling system.
- **Financial Data:** For tables containing Rupiah (Rp) values, use a monospaced font (JetBrains Mono) or tabular figures to ensure numbers align vertically for easy comparison.
- **Case:** Use Uppercase for `label-md` to differentiate section headers and table headers from content.
- **Mobile Adjustments:** `headline-lg` should scale down to 24px on mobile devices to prevent excessive wrapping.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for content areas, ensuring data readability is never compromised by extreme ultrawide monitor widths.

- **The Sidebar:** 260px width, collapsible to 64px (icon-only). It is fixed to the left viewport edge.
- **The Header:** 64px height, sticky at the top of the viewport with a backdrop-blur and 1px bottom border.
- **Grid:** A 12-column system is used within cards and page containers.
- **Density:** 16px gaps are standard for dashboard widgets, while 8px gaps are used for form elements and internal component spacing.
- **Financial Tables:** Use 12px vertical padding for rows to maintain a high-density feel while remaining touch-friendly.

## Elevation & Depth

To maintain a "flat but layered" enterprise aesthetic, the design system avoids heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** #F8FAFC. The canvas.
- **Level 1 (Card/Surface):** White background with a 1px solid border (#E2E8F0). No shadow.
- **Level 2 (Dropdowns/Modals):** White background with a subtle, diffused ambient shadow: `0px 4px 12px rgba(0, 0, 0, 0.05)` and a 1px border.
- **Interactions:** Buttons use a 1px "inner" border or a slight 1px bottom shadow to feel tactile (Stripe-inspired).
- **Sticky Elements:** Use a subtle backdrop-blur (12px) on the header to indicate it sits above the scrolling content.

## Shapes

The design system uses a sophisticated **Rounded** language (8px default) to soften the enterprise environment without appearing "toy-like."

- **Cards & Containers:** Always use `rounded-lg` (12px) as specified in the requirements.
- **Inputs & Buttons:** Use `rounded-md` (8px) for a precise, professional look.
- **Status Badges:** Use `rounded-full` (pill) to distinguish them from interactive buttons.
- **Icon Enclosures:** Small utility icons should sit in 8px rounded containers.

## Components

### Buttons
- **Primary:** Solid #2563EB with white text. 8px radius.
- **Secondary:** White surface, #E2E8F0 border, #111827 text.
- **Ghost:** No background/border, used for low-priority actions in sidebars or table rows.

### Tables (Financial Focus)
- **Headers:** `label-md` style, grey text, sticky position.
- **Currency Rows:** Right-aligned columns for `Rp` values. Use tabular figures.
- **Striping:** Subtle zebra striping (every second row #F8FAFC) is recommended for large data sets.

### Form Fields
- **Inputs:** 1px border (#E2E8F0), 12px horizontal padding. On focus, border changes to #2563EB with a 2px outer glow of the same color at 10% opacity.
- **Validation:** Clear, 12px text below the field for errors.

### Status Indicators
- **Chips:** Soft background (10% opacity of the status color) with high-contrast text of the same color. 
- **Example:** Success chip = Background #ECFDF5, Text #10B981.

### Navigation
- **Sidebar Items:** High-contrast hover states. Active items receive a subtle left-hand "pill" indicator in Primary Blue.
- **Breadcrumbs:** Used on all sub-pages for clear pathfinding in deep administrative hierarchies.

### Icons
- Use **Lucide** icons at 1.5px or 2px stroke weight. Standard size is 18px within a 24px bounding box for high-density layouts.