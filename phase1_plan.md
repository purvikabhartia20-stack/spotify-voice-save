# Phase 1 Plan

## What this phase builds
- The core HTML, CSS, and JS foundation for the Spotify Voice Save prototype in a single `phase1.html` file.
- The CSS design system based on the provided tokens.
- A hyper-realistic mobile frame layout (390px by 844px max-width) to simulate an actual app experience on desktop, scaling to 100% width on mobile.
- A bottom navigation bar matching Spotify's 4 tabs (Home, Search, Your Library, Voice/Premium) with the Voice tab highlighted.
- A top bar containing the voice status dot.
- State initialization via `localStorage` with the `DEFAULT_STATE` object.
- Four distinct screen views (placeholder content for now), with JavaScript logic to swap the active view without page reloading.

## Why this phase matters for the PM argument
- **Visual Credibility**: If it doesn't look and feel exactly like Spotify, the PM evaluator won't take the rest of the prototype seriously. The "hyper-realism" rule starts here.
- **Ambient Awareness**: The persistent pulsing green dot establishes the core mental model immediately: the app is always listening. The user doesn't have to trigger it manually. This friction-free interaction is the cornerstone of the PM argument.
- **Technical Foundation**: Setting up the single-source-of-truth `STATE` object ensures that later complexity (like multi-turn conversational follow-ups and real-time feed updates) has a solid, bug-free foundation to stand on.

## Visual design decisions — every choice with reasoning
- **CSS Variables for Theming**: Using `:root` CSS variables (from the provided tokens) ensures perfect color consistency across all components. 
- **Font Stack**: Implementing `Inter` via Google Fonts to mimic Spotify's proprietary Circular font, providing the same geometric, modern feel.
- **Mobile Container Layout**: Using a CSS grid/flex layout centered on the screen for desktop with a maximum width of 390px (iPhone size) to constrain the UI. On mobile devices, it scales natively.
- **Voice Pulse Animation**: Using CSS `@keyframes` for a subtle, infinite scaling and fading `box-shadow` and `transform` on the green dot to signify "listening" without being visually overwhelming.
- **Navigation Styling**: Active tabs will have `#ffffff` (white) text and icons, inactive will be `#b3b3b3`. The Voice tab will consistently have `#1DB954` (green) highlighting to remind the user of the new capability.
- **Micro-interactions**: Incorporating the requested `0.96` scale on tap and `200ms ease` transitions for all interactive elements to give a premium feel.

## Component breakdown — every element, every state, every interaction, every edge case per component
**1. App Container (Phone Frame)**
- *Element*: Main wrapping `div` (`#app-container`).
- *State*: None.
- *Interaction*: None.
- *Edge Case*: Screen too small. The content area inside will have `overflow-y: auto`, hiding the scrollbar (`::-webkit-scrollbar { display: none; }`).

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
- *Interaction*: JS swaps which view has `display: block` vs `display: none`.
- *Edge Case*: Invalid tab requested. Defaults to "Home".

**5. Bottom Navigation Bar**
- *Element*: Footer `nav` (`#bottom-nav`) with 4 tab buttons.
- *State*: One button has the `.active` class.
- *Interaction*: Click/Tap on a tab changes `STATE` and triggers a render.
- *Edge Case*: Rapid clicking on tabs. Handled by idempotent render function.

## Data flow — what reads STATE, what writes STATE, what triggers re-renders, in what order
- **Initialization**: On page load, try to read `spotify_voice_save_state` from `localStorage`. If empty/invalid, load the full `DEFAULT_STATE` provided in the prompt.
- **Writing STATE**: Any interaction (like clicking a nav tab) updates the in-memory `STATE` object and calls an `updateState()` function. 
- **Persistence**: `updateState()` writes to `localStorage` (debounced by 100ms to prevent performance hits), and calls `render()`.
- **Reading/Rendering**: `render()` is idempotent. It looks at the current `STATE`, hides/shows the appropriate view containers, and updates the `.active` class on the bottom nav buttons.

## Voice considerations — how this phase interacts with or prepares for the voice system
- Even though the voice engine is Phase 4, the **Voice Status Dot** is implemented now. This prepares the DOM and CSS for when the voice engine hooks into it to change colors (e.g., green for listening, amber for thinking, red for error). 
- The `STATE` object initialized in this phase contains all voice-related fields (like `voiceFeedbackEnabled`) so that they are present and persist correctly from the start.

## Edge cases — for each: how to prevent it from happening, and if it cannot be prevented, exactly how to handle it gracefully
- **localStorage unavailable (e.g., Incognito Mode)**: 
  - *Prevention*: Wrap `localStorage.getItem` and `setItem` in a `try/catch`. 
  - *Handling*: If it throws, fallback to the in-memory `STATE` variable silently. The app will work for the session but lose data on refresh.
- **Corrupted localStorage data**:
  - *Prevention*: `JSON.parse` in a `try/catch`.
  - *Handling*: If parsing fails or data is missing required fields, overwrite with `DEFAULT_STATE`.

## Accessibility — keyboard navigation, screen reader labels, touch targets, reduced motion, contrast ratios
- **Keyboard Navigation**: Nav buttons will use `<button>` tags so they are naturally focusable with the Tab key. Remove default outlines and replace with custom focus states.
- **Screen Reader**: Use `aria-label` for nav icons (e.g., `aria-label="Home"`, `aria-label="Voice"`).
- **Touch Targets**: All nav buttons and clickable elements will have a minimum height/width of `44px` (Apple HIG standard).
- **Reduced Motion**: The pulsing green dot animation will be wrapped in `@media (prefers-reduced-motion: no-preference)`. If reduced motion is preferred, the dot remains a solid green without the pulse.
- **Contrast**: Ensuring `#b3b3b3` on `#1a1a1a` meets WCAG AA standards.

## Performance — what could cause lag or memory issues and exactly how to prevent each one
- **Excessive localStorage writes**: Navigating between tabs quickly could trigger many writes.
  - *Prevention*: The `saveState` function will use a `setTimeout` 100ms debounce to batch rapid changes.
- **DOM Reflows**: Swapping views could cause layout thrashing.
  - *Prevention*: Instead of destroying and recreating DOM nodes, the 4 views are rendered once in the HTML and we simply toggle a `.hidden` CSS class.
- **Tap Delay**: 
  - *Prevention*: Add `touch-action: manipulation` to interactive elements to remove the 300ms tap delay on mobile.

## Browser and device considerations — Chrome desktop, Chrome Android, Safari iOS (best effort), known API limitations
- **Viewport height issues on mobile**: The browser UI (URL bar) changes the visible viewport height. 
  - *Prevention*: Use `height: 100dvh` (dynamic viewport height) where supported, falling back to `100vh`.
- **Webkit styling**: Add `-webkit-tap-highlight-color: transparent;` to prevent the default blue flash when tapping elements on iOS/Android.

## Testing checklist — step by step exactly what to do to verify every feature in this phase works
1. Open `phase1.html` in Chrome Desktop.
2. Verify the overall layout is exactly 390px wide and centered (or full width if the window is narrow).
3. Verify the background color, fonts, and text colors match the Spotify aesthetics perfectly.
4. Verify the top bar contains a pulsing green dot.
5. Open Chrome DevTools -> Application -> localStorage and verify `DEFAULT_STATE` is written correctly on load.
6. Click through all 4 bottom navigation tabs (Home, Search, Library, Voice).
7. Verify the active tab changes color appropriately, and the main content area swaps to the matching placeholder text.
8. Verify the tap animation (scale to `0.96`) triggers smoothly on navigation buttons.
9. Refresh the page. Verify that the last active tab you selected is still active (state persistence).
10. Emulate an iPhone in Chrome DevTools and verify there is no horizontal scrolling or clipped UI.

## Questions for review — anything uncertain before implementation begins
- Should the active tab in `STATE` be added to `DEFAULT_STATE`, or should we assume "Home" is the default upon very first initialization? (I will assume we need an `activeTab: 'home'` property added to STATE).
- Do you have specific SVG paths you prefer for the bottom navigation icons (Home, Search, Library, Voice), or should I source accurate, clean SVG paths that match the Spotify iOS app?
