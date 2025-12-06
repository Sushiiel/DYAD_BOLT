# Code Editor Background Fix

## Issue
The code editor in the workbench had a white/light gray background, which didn't match the modern black and white theme used throughout the application.

## Solution
Changed the CodeMirror editor background to pure black (#000000) for consistency.

## Changes Made

### File Modified: `editor.scss`

**1. Main Editor Background** (Line 126)
```scss
// Before:
--cm-backgroundColor: var(--bolt-elements-bg-depth-2);

// After:
--cm-backgroundColor: #000000;
```

**2. Gutter (Line Numbers) Background** (Line 7)
```scss
// Before:
--cm-gutter-backgroundColor: var(--bolt-elements-editor-gutter-backgroundColor, var(--cm-backgroundColor));

// After:
--cm-gutter-backgroundColor: #000000;
```

## Result

The code editor now features:
- ✅ **Pure black background** (#000000)
- ✅ **Black gutter** (line numbers area)
- ✅ **White text** for code
- ✅ **Consistent with workbench theme** (black & white)
- ✅ **High contrast** for better readability

## Visual Consistency

The code editor now matches:
- ✅ Workbench header (black with white borders)
- ✅ File tree panel (black background)
- ✅ Chat interface (black background)
- ✅ All UI elements (modern black & white theme)

## Testing

**Refresh your browser** and:
1. Open the workbench (code view)
2. Verify the code editor has a black background
3. Check that line numbers (gutter) also have a black background
4. Ensure code text is white and clearly visible
5. Verify syntax highlighting still works correctly

---

**Complete!** The entire application now uses a cohesive black and white theme! 🎨⚫⬜
