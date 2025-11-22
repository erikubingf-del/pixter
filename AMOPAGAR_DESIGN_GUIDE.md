# AmoPagar Design System & Implementation Guide

## 🎨 Design Philosophy

AmoPagar is designed to feel **friendly, modern, and trustworthy** for all age groups - from tech-savvy youth to older vendors who may not be as comfortable with technology.

### Core Principles
1. **Friendly & Approachable**: Soft colors, rounded corners, playful elements
2. **Clear & Simple**: Clean layouts, obvious actions, no clutter
3. **Trustworthy**: Professional yet warm, secure payment indicators
4. **Accessible**: High contrast, large touch targets, readable fonts

## 🎨 Color Palette

### Primary Colors
- **Purple** (`#8B7DD8`): Primary actions, CTAs, trust elements
- **Green** (`#81C995`): Success states, positive actions, secondary CTAs
- **Purple Light** (`#A094E0`): Hover states, backgrounds
- **Green Light** (`#9DD9AC`): Success backgrounds

### Gradients
- **Main Background**: `linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)`
- **Hero Background**: `linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 50%, #D4FC79 100%)`
- **CTA Background**: `linear-gradient(135deg, #8B7DD8 0%, #81C995 100%)`

### Neutral Colors
- **Gray 900** (`#1F2933`): Headings, important text
- **Gray 700** (`#3E4C59`): Body text
- **Gray 600** (`#52606D`): Secondary text
- **Gray 300** (`#9AA5B1`): Placeholder text
- **Gray 100** (`#E4E7EB`): Borders, dividers
- **Off White** (`#F9FAFB`): Backgrounds

## 📐 Layout & Spacing

### Container
- Max width: `1200px`
- Padding: `0 1rem` (mobile), `0 2rem` (desktop)

### Spacing Scale
- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `3rem` (48px)
- **3xl**: `4rem` (64px)
- **4xl**: `6rem` (96px)

### Border Radius
- **Small**: `8px` - Inputs, small cards
- **Medium**: `16px` - Cards, modals
- **Large**: `24px` - Large cards, sections
- **XL**: `32px` - Hero sections
- **Full**: `9999px` - Buttons, pills, badges

## 🔤 Typography

### Font Family
Primary: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Font Sizes
- **Hero**: `clamp(2rem, 5vw, 3.5rem)` - Main headlines
- **H1**: `3rem` (48px)
- **H2**: `2.5rem` (40px)
- **H3**: `1.875rem` (30px)
- **H4**: `1.5rem` (24px)
- **Body Large**: `1.25rem` (20px)
- **Body**: `1rem` (16px)
- **Small**: `0.875rem` (14px)
- **Tiny**: `0.75rem` (12px)

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700
- **Extrabold**: 800

## 🎭 Components

### Buttons

#### Primary Button (Purple)
```css
.amo-btn-primary {
  background: #8B7DD8;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 9999px;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(139, 125, 216, 0.08);
}

.amo-btn-primary:hover {
  background: #6B5DB8;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(139, 125, 216, 0.12);
}
```

#### Secondary Button (Green)
```css
.amo-btn-secondary {
  background: #81C995;
  color: white;
  /* Same padding and styling as primary */
}
```

#### Outline Button
```css
.amo-btn-outline {
  background: transparent;
  color: #8B7DD8;
  border: 2px solid #8B7DD8;
}
```

### Input Fields
```css
.amo-input {
  padding: 1rem 1.5rem;
  border-radius: 9999px;
  border: 2px solid #E4E7EB;
  font-size: 1rem;
}

.amo-input:focus {
  border-color: #8B7DD8;
  box-shadow: 0 0 0 3px rgba(139, 125, 216, 0.1);
}
```

### Cards
```css
.amo-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(139, 125, 216, 0.12);
}

.amo-card:hover {
  box-shadow: 0 10px 25px rgba(139, 125, 216, 0.15);
  transform: translateY(-4px);
}
```

### Progress Steps
Use for multi-step forms (vehicle info, banking, review):
```css
.amo-steps {
  display: flex;
  gap: 0.5rem;
}

.amo-step {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  background: #E4E7EB;
  color: #616E7C;
}

.amo-step.active {
  background: #8B7DD8;
  color: white;
}

.amo-step.completed {
  background: #81C995;
  color: white;
}
```

## 📱 Page Templates

### Landing Page
- **Hero**: Gradient background, large heading, CTA buttons, hero image with tilt effect
- **Features**: 3-column grid with icon cards
- **Pricing**: 2-column pricing cards with hover effects
- **Testimonial**: Large quote with subtle background
- **CTA Section**: Full-width gradient with centered text
- **Footer**: Dark background with 3-column links

### Login/Signup Pages
- **Layout**: Centered card on gradient background
- **Form**: Rounded inputs with focus states
- **Social Login**: Purple button with Google icon
- **Links**: Purple underlined links

### Multi-Step Forms (Driver Registration)
- **Progress**: Top progress bar with 4 steps
- **Form Container**: White card with rounded corners
- **Navigation**: "Back" (outline) and "Continue" (primary) buttons
- **Fields**: Full-width rounded inputs with labels above

### Dashboard Pages
- **Sidebar**: Dark purple background (#6B5DB8) with white text
- **Main Area**: Light gray background (#F9FAFB)
- **Cards**: White cards with shadows for metrics/data
- **Charts**: Green/purple gradient fills
- **Tables**: Alternating row colors, hover states

### Payment Page
- **Amount Input**: Large centered input with currency symbol
- **Payment Methods**: Card-style selection (Pix, Credit Card, Apple Pay)
- **Success**: Green checkmark animation with confetti
- **Receipt**: Clean white card with QR code option

## 🎯 User Experience Guidelines

### For All Age Groups

#### Visual Clarity
- **Font Size**: Minimum 16px for body text, 14px for small text
- **Contrast**: WCAG AA compliant (4.5:1 for normal text)
- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Spacing**: Generous white space between elements

#### Language
- Use simple, clear Portuguese
- Avoid technical jargon
- Provide helpful tooltips for complex terms
- Use friendly, encouraging copy

#### Navigation
- Clear breadcrumbs for multi-step processes
- Always show current step
- Easy "back" options
- Confirm before destructive actions

#### Feedback
- Immediate visual feedback on interactions
- Success messages with green checkmarks
- Error messages in friendly language with solutions
- Loading states for all async operations

### Trust Building Elements
- **Stripe Logo**: Display prominently on payment pages
- **Security Badges**: SSL, encryption indicators
- **Testimonials**: Real user quotes with names
- **Transparent Pricing**: Clear fee breakdown
- **Support Access**: Visible contact options

## 🎨 Animation & Interaction

### Transitions
```css
transition: all 0.3s ease;
```

### Hover Effects
- Buttons: Slight lift (`translateY(-2px)`) + enhanced shadow
- Cards: Larger lift (`translateY(-4px)`) + enhanced shadow
- Links: Color change to darker shade

### Fade In Animation
```css
@keyframes amo-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Loading States
- Spinner: Purple (#8B7DD8) with green (#81C995) accent
- Skeleton: Light gray pulse animation
- Progress Bar: Green fill on purple background

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */

/* Small devices (phones, less than 640px) */
@media (max-width: 640px) {
  /* Stack elements vertically */
  /* Increase padding/spacing */
  /* Larger touch targets */
}

/* Medium devices (tablets, 641px to 1024px) */
@media (min-width: 641px) and (max-width: 1024px) {
  /* 2-column grids become 2-column */
  /* Adjust hero image size */
}

/* Large devices (desktops, 1025px and up) */
@media (min-width: 1025px) {
  /* Full layout */
  /* Hover effects active */
}
```

## 🚀 Implementation Checklist

### ✅ Completed
- [x] Design system CSS file created
- [x] Landing page redesigned with AmoPagar aesthetic
- [x] Color palette defined
- [x] Typography system established
- [x] Component library created

### 🔄 In Progress
- [ ] Login/Signup pages
- [ ] Driver registration multi-step form
- [ ] Driver dashboard
- [ ] Client dashboard
- [ ] Payment page

### 📋 To Do
- [ ] Mobile responsiveness testing
- [ ] Accessibility audit (WCAG AA)
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] User testing with target demographics

## 💡 Design Tips

1. **Consistency**: Use the design system classes everywhere
2. **Whitespace**: Don't be afraid of empty space - it improves readability
3. **Hierarchy**: Use size, weight, and color to create clear visual hierarchy
4. **Feedback**: Every action should have immediate visual feedback
5. **Progressive Disclosure**: Show only what's needed at each step
6. **Error Prevention**: Use validation, confirmation dialogs
7. **Mobile First**: Design for mobile, enhance for desktop

## 🔗 Design Assets

### Icons
- Use emoji for friendly, universal communication (📱 🔒 🤝 ✓)
- Custom SVG icons for specific actions
- Font Awesome for standard UI icons

### Images
- Hero images: Happy people using the service
- Illustrations: Friendly, rounded, colorful style
- Photos: Authentic, diverse, warm lighting

### Shadows
- Subtle shadows for depth (not heavy drop shadows)
- Larger shadows on hover for interactivity feedback
- Purple-tinted shadows to match brand

---

**AmoPagar** - Payments that feel good. Simple, fast, and friendly. 💜
