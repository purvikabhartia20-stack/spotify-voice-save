# Phase 1 Plan

## What this phase builds
- The core HTML, CSS, and JS foundation for the Spotify Voice Save prototype in a single `phase1.html` file.
- The CSS design system based on the provided tokens.
- A hyper-realistic mobile frame layout (390px by 844px max-width) to simulate an actual app experience. **On desktop, this will be wrapped in a CSS iPhone bezel (with notch and rounded corners)** to maximize realism for the PM demo.
- A bottom navigation bar matching Spotify's 4 tabs (Home, Search, Your Library, Voice/Premium) with the Voice tab highlighted. **We will use raw, embedded SVGs** for exact pixel-perfect Spotify icons.
- A top bar containing the voice status dot.
- State initialization via `localStorage` with the `DEFAULT_STATE` object. **State will be managed via a Vanilla JS Proxy** to enable automatic reactivity.
- Four distinct screen views (placeholder content for now), with JavaScript logic to swap the active view without page reloading, **incorporating a subtle 150ms fade-in transition** for premium feel.

## Why this phase matters for the PM argument
- **Visual Credibility**: If it doesn't look and feel exactly like Spotify, the PM evaluator won't take the rest of the prototype seriously. The "hyper-realism" rule starts here.
- **Ambient Awareness**: The persistent pulsing green dot establishes the core mental model immediately: the app is always listening. The user doesn't have to trigger it manually. This friction-free interaction is the cornerstone of the PM argument.
- **Technical Foundation**: Setting up the single-source-of-truth `STATE` object (powered by a JS Proxy) ensures that later complexity (like multi-turn conversational follow-ups and real-time feed updates) has a solid, bug-free foundation to stand on.

## Visual design decisions — every choice with reasoning
- **CSS Variables for Theming**: Using `:root` CSS variables (from the provided tokens) ensures perfect color consistency across all components. 
- **Font Stack**: Implementing `Inter` via Google Fonts to mimic Spotify's proprietary Circular font, providing the same geometric, modern feel.
- **Mobile Container Layout & Bezel**: Using a CSS grid/flex layout centered on the screen for desktop with a maximum width of 390px. A custom CSS bezel will wrap it on non-mobile devices to sell the "app" illusion.
- **Voice Pulse Animation**: Using CSS `@keyframes` for a subtle, infinite scaling and fading `box-shadow` and `transform` on the green dot to signify "listening" without being visually overwhelming.
- **Navigation Styling**: Active tabs will have `#ffffff` (white) text and icons, inactive will be `#b3b3b3`. The Voice tab will consistently have `#1DB954` (green) highlighting to remind the user of the new capability.
- **Micro-interactions**: Incorporating the requested `0.96` scale on tap, `200ms ease` transitions for elements, and a `150ms fade-in` for view switching.

## Component breakdown — every element, every state, every interaction, every edge case per component
**1. App Container & Device Bezel**
- *Element*: Main wrapping `div` (`#device-bezel`) and inner `div` (`#app-container`).
- *State*: None.
- *Interaction*: None.
- *Edge Case*: Screen too small for bezel. Media query removes bezel styling and makes `#app-container` 100vw/100vh on actual mobile devices.

**2. Top Bar**
- *Element*: Header `header` (`#top-bar`).
- *State*: Static text + Voice Status Indicator.
- *Interaction*: None for now.
- *Edge Case*: Name/Status gets too long. Ensure `flex` and `text-overflow: ellipsis` are used.

**3. Voice Status Indicator (The Green Dot)**
- *Element*: A small circular `div` (`#voice-status-dot`) inside the Top Bar.
- *State*: Pulsing animation (CSS only for now).
- *Interaction*: None.
- *Edge Case*: Reduced motion preference (handled via media query).

**4. Content Area (View Manager)**
- *Element*: A container `div` (`#content-area`) holding 4 distinct view `section`s.
- *State*: Reads active tab from `STATE` to determine which section to show.
- *Interaction*: JS swaps which view has `display: flex` vs `display: none` and applies a CSS fade animation.
- *Edge Case*: Invalid tab requested. Defaults to "Home".

**5. Bottom Navigation Bar**
- *Element*: Footer `nav` (`#bottom-nav`) with 4 tab buttons (containing raw SVG icons).
- *State*: One button has the `.active` class.
- *Interaction*: Click/Tap on a tab updates `STATE.activeTab`. The JS Proxy catches this and triggers a render.
- *Edge Case*: Rapid clicking on tabs. Handled by idempotent render function.

## Data flow — what reads STATE, what writes STATE, what triggers re-renders, in what order
- **Initialization**: On page load, try to read `spotify_voice_save_state` from `localStorage`. If empty/invalid, load the full `DEFAULT_STATE` provided in the prompt.
- **Proxy Setup**: Wrap the loaded state in a `Proxy`.
- **Writing STATE**: Any interaction modifies the `STATE` proxy directly (e.g., `STATE.activeTab = 'library'`).
- **Proxy Intercept**: The Proxy's `set` handler intercepts the change, applies it, calls a debounced (100ms) `saveToLocalStorage()` function, and calls `render()`.
- **Reading/Rendering**: `render()` is idempotent. It looks at the current `STATE`, hides/shows the appropriate view containers, and updates the `.active` class on the bottom nav buttons.

## Voice considerations — how this phase interacts with or prepares for the voice system
- Even though the voice engine is Phase 4, the **Voice Status Dot** is implemented now. This prepares the DOM and CSS for when the voice engine hooks into it to change colors.
- The `STATE` object initialized in this phase contains all voice-related fields so that they are present and persist correctly from the start.

## Edge cases — for each: how to prevent it from happening, and if it cannot be prevented, exactly how to handle it gracefully
- **localStorage unavailable (e.g., Incognito Mode)**: 
  - *Prevention*: Wrap `localStorage.getItem` and `setItem` in a `try/catch`. 
  - *Handling*: If it throws, fallback to the in-memory `STATE` variable silently.
- **Corrupted localStorage data**:
  - *Prevention*: `JSON.parse` in a `try/catch`.
  - *Handling*: If parsing fails or data is missing required fields, overwrite with `DEFAULT_STATE`.

## Accessibility — keyboard navigation, screen reader labels, touch targets, reduced motion, contrast ratios
- **Keyboard Navigation**: Nav buttons will use `<button>` tags so they are naturally focusable with the Tab key. Remove default outlines and replace with custom focus states.
- **Screen Reader**: Use `aria-label` for nav icons (e.g., `aria-label="Home"`, `aria-label="Voice"`).
- **Touch Targets**: All nav buttons and clickable elements will have a minimum height/width of `44px` (Apple HIG standard).
- **Reduced Motion**: The pulsing green dot and the fade transitions will be wrapped in `@media (prefers-reduced-motion: no-preference)`.

## Performance — what could cause lag or memory issues and exactly how to prevent each one
- **Excessive localStorage writes**: 
  - *Prevention*: The Proxy debounce mechanism batches rapid changes into a single 100ms timeout.
- **DOM Reflows**: Swapping views could cause layout thrashing.
  - *Prevention*: The 4 views are rendered once in the HTML and we simply toggle a CSS class.
- **Tap Delay**: 
  - *Prevention*: Add `touch-action: manipulation` to interactive elements to remove the 300ms tap delay on mobile.

## Browser and device considerations — Chrome desktop, Chrome Android, Safari iOS (best effort), known API limitations
- **Viewport height issues on mobile**: The browser UI (URL bar) changes the visible viewport height. 
  - *Prevention*: Use `height: 100dvh` (dynamic viewport height) where supported, falling back to `100vh`.
- **Webkit styling**: Add `-webkit-tap-highlight-color: transparent;` to prevent the default blue flash when tapping elements on iOS/Android.

## Testing checklist — step by step exactly what to do to verify every feature in this phase works
1. Open `phase1.html` in Chrome Desktop.
2. Verify the overall layout is 390px wide and enclosed in a CSS device bezel.
3. Verify the background color, fonts, text colors, and exact SVGs match Spotify.
4. Verify the top bar contains a pulsing green dot.
5. Open Chrome DevTools -> Application -> localStorage and verify `DEFAULT_STATE` is written correctly on load.
6. Click through all 4 bottom navigation tabs.
7. Verify the active tab changes color appropriately, and the main content area swaps with a smooth fade to the matching placeholder text.
8. Refresh the page. Verify that the last active tab you selected is still active (state persistence).
9. Emulate an iPhone in Chrome DevTools and verify the bezel disappears, making the app full width/height.

## Questions for review — anything uncertain before implementation begins
- No further questions. We are ready to proceed.
