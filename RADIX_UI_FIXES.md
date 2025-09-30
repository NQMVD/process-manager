# Radix UI Component Fixes

This document describes critical fixes applied to make Radix UI components work correctly with Tailwind CSS v4 and Next.js.

## Issue: Dropdown Menu Not Visible

### Symptoms
- Clicking dropdown trigger causes scrollbar to disappear (modal overlay activates)
- Dropdown content is added to DOM but not visible
- No visual feedback when clicking the dropdown button
- Console shows React ref forwarding warning

### Root Cause

The Button component was not forwarding refs, which is **required** when using Radix UI's `asChild` prop.

When a component uses `asChild` with `@radix-ui/react-slot`, Radix needs to:
- Position the dropdown content relative to the trigger
- Manage focus states
- Connect trigger and content with proper ARIA attributes

Without ref forwarding, all of these features fail silently, resulting in broken dropdowns.

### Console Error

```
Warning: Function components cannot be given refs. Attempts to access this ref will fail. 
Did you mean to use React.forwardRef()?

Check the render method of `SlotClone`.
    at Button
```

### The Fix

**File: `components/ui/button.tsx`**

Changed from regular function component:
```typescript
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={...} {...props} />
}
```

To forwardRef component:
```typescript
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}  // <- Critical: forward the ref
      {...props}
    />
  )
})
Button.displayName = 'Button'  // <- Important for debugging
```

## Additional Fixes Required

### 1. Tailwind CSS v4 Syntax for CSS Custom Properties

Tailwind CSS v4 changed the syntax for CSS custom properties in utility classes.

**Problem:** Old Tailwind v3 syntax doesn't work in v4:
```css
/* WRONG - v3 syntax */
origin-(--radix-dropdown-menu-content-transform-origin)
max-h-(--radix-dropdown-menu-content-available-height)
```

**Solution:** Use bracket notation with `var()`:
```css
/* CORRECT - v4 syntax */
origin-[var(--radix-dropdown-menu-content-transform-origin)]
max-h-[var(--radix-dropdown-menu-content-available-height)]
```

**Files Fixed:**
- `components/ui/dropdown-menu.tsx`
- `components/ui/context-menu.tsx`
- `components/ui/select.tsx`
- `components/ui/menubar.tsx`
- `components/ui/tooltip.tsx`
- `components/ui/popover.tsx`
- `components/ui/hover-card.tsx`

### 2. Light Mode Color Contrast

**Problem:** Popover and background had identical colors in light mode, making dropdowns invisible even when rendered correctly.

```css
/* BEFORE - invisible white on white */
--background: oklch(1 0 0);      /* pure white */
--popover: oklch(1 0 0);          /* pure white */
--border: oklch(0.9220 0 0);      /* very light gray */
```

**After:**
```css
/* AFTER - visible contrast */
--background: oklch(1 0 0);      /* pure white */
--popover: oklch(0.985 0 0);     /* slightly gray */
--border: oklch(0.8820 0 0);     /* darker gray border */
```

**File:** `app/globals.css`

## Rules for Using Radix UI Components

### 1. Always ForwardRef with `asChild`

Any custom component that will be used with Radix UI's `asChild` prop MUST forward refs:

```typescript
// ✅ CORRECT
const MyButton = React.forwardRef<HTMLButtonElement, Props>(
  (props, ref) => <button ref={ref} {...props} />
)
MyButton.displayName = 'MyButton'

// ❌ WRONG - will break Radix UI
function MyButton(props: Props) {
  return <button {...props} />
}
```

### 2. Common Components That Need forwardRef

When using these Radix components with custom components:
- `DropdownMenuTrigger asChild`
- `DialogTrigger asChild`
- `TooltipTrigger asChild`
- `PopoverTrigger asChild`
- `ContextMenuTrigger asChild`
- `AlertDialogTrigger asChild`

Your custom component MUST forward refs.

### 3. Check CSS Custom Property Syntax

When using Radix UI CSS variables in Tailwind classes, always use:
```typescript
className="origin-[var(--radix-*)]"  // ✅ CORRECT
className="origin-(--radix-*)"       // ❌ WRONG (v3 syntax)
```

### 4. Verify Portal Rendering

Radix Portals render content at the end of `document.body`. Ensure:
- No parent has `overflow: hidden` that would clip the portal
- Color contrast is sufficient for visibility
- Z-index values are appropriate (default is `z-50`)

## Debugging Tips

### Check Console for Ref Warnings

Always check browser console for warnings like:
```
Warning: Function components cannot be given refs
```

### Inspect DOM

When dropdown appears broken:
1. Open browser DevTools
2. Click the trigger
3. Look for elements with `data-radix-popper-content-wrapper` at the end of `<body>`
4. If elements exist but aren't visible, it's a CSS issue
5. If elements don't exist, it's a ref forwarding or React issue

### Test Colors

Add temporary debug styles to verify rendering:
```typescript
<DropdownMenuContent className="!bg-red-500 !border-4 !border-yellow-500">
```

If you still can't see it, the problem is positioning/ref forwarding, not colors.

## References

- [Radix UI Slot Documentation](https://www.radix-ui.com/primitives/docs/utilities/slot)
- [React forwardRef Documentation](https://react.dev/reference/react/forwardRef)
- [Tailwind CSS v4 Migration Guide](https://tailwindcss.com/docs/v4-beta)

## Date
Fixed: January 2025
