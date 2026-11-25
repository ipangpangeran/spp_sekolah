---
name: Sisma Enterprise Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d8d9e7'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#ecedfb'
  surface-container-high: '#e6e7f5'
  surface-container-highest: '#e1e1ef'
  on-surface: '#191b25'
  on-surface-variant: '#3d494d'
  inverse-surface: '#2d303a'
  inverse-on-surface: '#eff0fe'
  outline: '#6d797e'
  outline-variant: '#bcc8ce'
  surface-tint: '#00677e'
  primary: '#00677e'
  on-primary: '#ffffff'
  primary-container: '#08a6c9'
  on-primary-container: '#003643'
  inverse-primary: '#5bd5fa'
  secondary: '#05677e'
  on-secondary: '#ffffff'
  secondary-container: '#9ce4ff'
  on-secondary-container: '#07687f'
  tertiary: '#4b5c91'
  on-tertiary: '#ffffff'
  tertiary-container: '#8697d0'
  on-tertiary-container: '#1c2e61'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b5ebff'
  primary-fixed-dim: '#5bd5fa'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#004e60'
  secondary-fixed: '#b6ebff'
  secondary-fixed-dim: '#87d1eb'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#01174a'
  on-tertiary-fixed-variant: '#334478'
  background: '#faf8ff'
  on-background: '#191b25'
  surface-variant: '#e1e1ef'
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

The palette is anchored by **Vibrant Cyan**, a color that evokes clarity and modern efficiency. This is contrasted against a deep "Teal/Slate" secondary tone to provide a strong architectural anchor for navigation and components.

- **Primary:** Used for the main brand touchpoints, primary actions, and active navigation states (`#08a6c9`).
- **Sidebar Background:** A high-contrast dark mode foundation (`#318098`) used to differentiate navigation from workspace.
- **Surface & Borders:** Layering relies on the transition from the background (`#747682` neutral scale) to white cards (`#FFFFFF`) defined by thin, low-contrast borders.
- **Functional Colors:** Success, Warning, and Danger colors are used strictly for status indicators and destructive actions.

**Dark Mode Support:** In dark mode, surfaces should shift appropriately, maintaining readability against the new fruit salad color variant palette.

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

- **Level 0 (Background):** Canvas base.
- **Level 1 (Card/Surface):** White background with a 1px solid border. No shadow.
- **Level 2 (Dropdowns/Modals):** White background with a subtle, diffused ambient shadow and a 1px border.
- **Interactions:** Buttons use a 1px "inner" border or a slight 1px bottom shadow to feel tactile.
- **Sticky Elements:** Use a subtle backdrop-blur (12px) on the header to indicate it sits above the scrolling content.

## Shapes

The design system uses a sophisticated **Rounded** language to soften the enterprise environment without appearing "toy-like."

- **Cards & Containers:** Always use `rounded-lg` (1rem) as specified in the requirements.
- **Inputs & Buttons:** Use `rounded-md` (0.75rem) for a precise, professional look.
- **Status Badges:** Use `rounded-full` (pill) to distinguish them from interactive buttons.
- **Icon Enclosures:** Small utility icons should sit in rounded containers.

## Components

### Buttons
- **Primary:** Solid primary accent with white text. Rounded corners.
- **Secondary:** White surface with subtle border.
- **Ghost:** No background/border, used for low-priority actions in sidebars or table rows.

### Tables (Financial Focus)
- **Headers:** `label-md` style, grey text, sticky position.
- **Currency Rows:** Right-aligned columns for `Rp` values. Use tabular figures.
- **Striping:** Subtle zebra striping is recommended for large data sets.

### Form Fields
- **Inputs:** 1px border, 12px horizontal padding. On focus, border highlights with a primary accent glow.
- **Validation:** Clear, 12px text below the field for errors.

### Status Indicators
- **Chips:** Soft background (10% opacity of the status color) with high-contrast text of the same color. 

### Navigation
- **Sidebar Items:** High-contrast hover states. Active items receive a subtle left-hand indicator.
- **Breadcrumbs:** Used on all sub-pages for clear pathfinding in deep administrative hierarchies.

### Icons
- Use **Lucide** icons at 1.5px or 2px stroke weight. Standard size is 18px within a 24px bounding box for high-density layouts.