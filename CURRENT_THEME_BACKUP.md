# Original Blue Theme Backup (Travel Desk)

> **Document Purpose**: This file documents the complete original "Corporate Royal Blue & Navy" theme used across the Netlink Travel Desk application. If you ever want to revert the UI from the **Moonstone (`#4C9DB0`) & Vanilla (`#FFEBAF`)** palette back to the original blue theme, refer to the color specifications and code snippets in this document.

---

## 1. Original Theme Color Palette Summary

| Category | Token / Color | Hex Code | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand Blue** | Royal Blue | `#1768c4` / `#1689d3` | Primary action buttons, brand badges, active icons |
| **Primary Blue Hover** | Deep Royal Blue | `#1259aa` / `#075bc9` | Hover state for buttons and primary CTAs |
| **Light Blue Accent** | Sky / Ice Blue | `#31b6e9` / `#34b5ea` | Gradients on brand marks, avatars, decorative artwork |
| **Dark Navy Background** | Midnight Navy | `#111b2b` / `#07182d` | Sidebar background, login hero background |
| **Dark Navy Mid** | Deep Navy | `#0a2442` / `#0d3159` | Secondary gradient stops in login hero |
| **Text - Heading Dark** | Navy Slate | `#172942` / `#173653` / `#132f4e` | Main page titles and card headings |
| **Text - Body / Muted** | Slate Gray | `#4b6076` / `#788ba0` / `#94a1b4` | Subtitles, labels, helpers, table cells |
| **App Background** | Cool Soft Gray | `#f5f7fb` / `#f7f9fc` | Body and main viewport background |
| **Card / Surface** | Pure White | `#ffffff` | Content cards, tables, modals |
| **Borders** | Subtle Blue-Gray | `#e1e9f1` / `#dfeaf6` / `#edf1f5` | Card borders, dividers, table rows |
| **Active States** | Soft Blue Tint | `#edf5ff` / `#eaf5ff` | Active menu items, selected options, focus rings |

---

## 2. Component-by-Component Original Values

### A. Global Shell & Navigation
- **Body Background**: `#f5f7fb`
- **Text Color**: `#16243a`
- **Focus Ring**: `3px solid #77aaf7` with `outline-offset: 2px`
- **Sidebar Background**: `#111b2b` (dark collapsed bar)
- **Sidebar Nav Active**: `linear-gradient(145deg, #166dcc, #1056a3)` with shadow `#08529e38`
- **Sidebar Nav Hover**: background `#1b2940`, text `white`
- **Brand Symbol**: `linear-gradient(145deg, #31b6e9, #0870b7)`
- **Topbar Background**: `rgba(255, 255, 255, 0.96)`, border `#e8eef5`
- **Topbar Context Icon**: `#2984c8`
- **User Avatar**: `linear-gradient(145deg, #37b3e5, #0875ba)`

### B. Login Screen
- **Left Hero Panel**:
  - `radial-gradient(ellipse at 57% 61%, rgba(17,92,174,0.42), transparent 34%), linear-gradient(145deg, #07182d 0%, #0a2442 54%, #0d3159 100%)`
- **Hero Eyebrow**: `#82c5ff` with dot `#49b9ff`
- **Orbits & Flight Paths**: `#539de829`, `#6bbeff38`, `#71c2ffa8`
- **Plane Glow**: `radial-gradient(ellipse, rgba(24,117,211,0.32), transparent 68%)`
- **Sign-in Button**: `linear-gradient(105deg, #1689d3, #075bc9)`
- **Login Input Focus**: `border-color: #6da5e8`, `outline: 3px solid #e7f1ff`

### C. Welcome Screen (Home)
- **Welcome Hero Card**:
  - `radial-gradient(ellipse at 73% 40%, #7cbfff3b, transparent 42%), linear-gradient(112deg, #f5faff, #edf6ff 54%, #e9f4ff)`
  - Border: `1px solid #dfeaf6`
- **Primary Action (New travel request)**:
  - Background: `linear-gradient(105deg, #147ed0, #0759cf)`
  - Hover shadow: `0 9px 18px #0d63bf42`
- **Secondary Action**:
  - Border: `#d3e3f2`, Color: `#24628f`, Background: `#ffffffba`
- **Travel Art Elements**:
  - Globe: `#4397de30`
  - Routes: `#1887e09e`
  - Plane Card: `linear-gradient(145deg, #fffffff0, #daefffcc)`, color: `#1069af`
  - Suitcase: `linear-gradient(160deg, #319ddd, #1167b6)`
  - Boarding pass badge: `#117bc0`

### D. Travel Request & Status Pages
- **Section Accent Stripe**: `linear-gradient(90deg, #1689d3, #54b8ee 48%, #d8efff)`
- **Section Header BG**: `linear-gradient(100deg, #f5faff, #fbfdff)`
- **Heading Icon BG**: `#eaf5ff`, color: `#147abb`, border: `#d6e8f6`
- **Input Focus**: `border-color: #77b5e7`, `box-shadow: 0 0 0 3px #eaf5ff`
- **Submit / New Request Button**: `linear-gradient(105deg, #1689d3, #075bc9)`
- **Request ID Link**: `#226ea8`
- **Table Hover**: `#f7fbff`
- **Table Sticky Columns**: `#f5f8fb` (header) and `white` (body)

### E. Approvals & Finance Pages
- **Approval Heading Icon**: color `#137ab9`, background `#eaf5ff`, border `#d5e8f7`
- **Tab Active State**: border-bottom `#1682c9`, text `#176fa9`, badge `#e6f3ff`
- **Approve Button**: `linear-gradient(105deg, #168d6a, #14805e)`
- **Reject Button**: text `#a64747`, border `#f0d7d6`, background `#fff8f7`
- **Finance Icon**: color `#25876a`, background `#ebf8f2`, border `#d4ece4`

---

## 3. How to Restore the Original Blue Theme

If you ever wish to roll back the Moonstone & Vanilla theme back to the Corporate Blue theme:

1. Replace the `:root` variables in `src/styles/index.css` with the original corporate blue palette below:
```css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  /* Original Corporate Blue Tokens */
  --moonstone: #1689d3;
  --moonstone-light: #37b3e5;
  --moonstone-hover: #1259aa;
  --moonstone-dark: #075bc9;
  --moonstone-deep: #0a2442;
  --moonstone-navy: #07182d;
  --moonstone-subtle: #eaf5ff;
  --moonstone-tint: #f5faff;
  --moonstone-glow: rgba(22, 137, 211, 0.32);

  /* Original Warm Accents */
  --vanilla: #ffebb0;
  --vanilla-light: #fff8e8;
  --vanilla-cream: #fffdf8;
  --vanilla-border: #f5e0a6;
  --vanilla-hover: #f0d890;
  --vanilla-text: #8c6014;

  /* Surfaces & Neutrals */
  --bg-app: #f5f7fb;
  --bg-surface: #ffffff;
  --border-main: #e1e9f1;
  --border-subtle: #edf2f7;
  --text-main: #172942;
  --text-body: #4b6076;
  --text-muted: #788ba0;
  --text-subtle: #94a1b4;
}
```

2. If you are using Git version control in the future:
```bash
git checkout HEAD -- src/styles/
```

