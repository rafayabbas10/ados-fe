# Push to Brief Builder Implementation

## Overview
This implementation adds the ability to push AI-generated ad variations from the Ad Details page directly to the Brief Builder with prepopulated script blocks.

## Features Implemented

### 1. Ad Details Page (`src/app/ads/[adId]/details/page.tsx`)

#### For V1 (Hook Variations):
- **Checkboxes**: Each hook variation now has a checkbox in the top-right corner for selection
- **Push to Brief Builder Button**: Displays a button showing the count of selected hooks `Push to Brief Builder (n)`
- **Functionality**: 
  - Users can select multiple hooks
  - When "Push to Brief Builder" is clicked, it sends the selected hooks to the Brief Builder
  - The button is disabled until at least one hook is selected

#### For V2-V5 (Video Scene Variations):
- **Push to Brief Builder Button**: Each variation (v2, v3, v4, v5) has a "Push to Brief Builder" button next to "Generate Creative"
- **Functionality**: Clicking the button sends that specific variation's blocks to the Brief Builder

### 2. Brief Builder Page (`src/app/build-ai/page.tsx`)

#### Data Handling:
The Brief Builder now checks for `briefBuilderData` in sessionStorage on load and processes it based on the variation type:

#### For V1 (Hook Variations):
- **Multiple Variations Created**: For each selected hook, a separate variation is created
- **Hook Replacement Logic**: 
  - Takes the original video scenes from the ad
  - Parses the `replace_scenes` field (e.g., "1,2" or "1-3") to determine which scenes to replace
  - Replaces only the specified scenes with the hook data
  - Keeps all other original scenes intact
- **Result**: If 3 hooks are selected, 3 variations are created, each showing the original video but with different hooks

#### For V2-V5 (Video Scene Variations):
- **Single Variation Created**: Uses the variation blocks directly as script blocks
- **Direct Mapping**: Each scene in the variation becomes a script block in the Brief Builder
- **Result**: The Brief Builder displays all blocks from that specific variation

### 3. Data Flow

```
Ad Details Page
    ↓ (User selects hooks/variation)
    ↓ (Clicks "Push to Brief Builder")
    ↓
sessionStorage.setItem('briefBuilderData', {...})
    ↓
Navigate to /build-ai
    ↓
Brief Builder loads
    ↓
Reads from sessionStorage
    ↓
Processes based on variationType (v1 vs v2-v5)
    ↓
Creates appropriate script variations
    ↓
Clears sessionStorage
```

### 4. Key Functions

#### Ad Details Page:
- `handleHookToggle(hookId)`: Toggles checkbox selection for hooks
- `handlePushHooksToBriefBuilder()`: Handles v1 push to brief builder
- `handlePushVariationToBriefBuilder(variationKey)`: Handles v2-v5 push to brief builder

#### Brief Builder:
- `populateFromHookVariations(data)`: Processes v1 hook variations
- `populateFromVideoVariations(data)`: Processes v2-v5 scene variations
- `parseScenesToReplace(replaceScenes)`: Parses scene replacement strings
- `getBlockTypeFromVariationScene(scene, index, totalScenes)`: Determines block type

### 5. Data Structure in sessionStorage

```typescript
{
  adId: string,
  adName: string,
  videoScenes: VideoScene[],
  variationType: 'v1' | 'v2' | 'v3' | 'v4' | 'v5',
  
  // For v1 only:
  selectedHooks: HookVariation[],
  
  // For v2-v5 only:
  variationBlocks: VideoSceneVariation[],
  
  adAnalysis: AdAnalysis
}
```

## Usage

### For Video Ads with Hook Variations (V1):
1. Navigate to Ad Details page
2. Open the "AI-Generated Variations" accordion
3. Click on "V1" tab
4. Select desired hooks using checkboxes
5. Click "Push to Brief Builder (n)" button
6. Brief Builder opens with multiple variations, each showing original scenes with a different hook

### For Video Ads with Scene Variations (V2-V5):
1. Navigate to Ad Details page
2. Open the "AI-Generated Variations" accordion
3. Click on any V2, V3, V4, or V5 tab
4. Click "Push to Brief Builder" button
5. Brief Builder opens with a single variation showing all blocks from that variation

## Technical Notes

- Uses `sessionStorage` for data transfer (automatically cleared after loading)
- Supports scene range parsing (e.g., "1-3" expands to [1, 2, 3])
- Maintains original ad analysis data (avatar, awareness level, angle, format, theme)
- Automatically sets the first variation as "primary"
- Properly maps value_block_type to Brief Builder block types
- Only available for Video Ads (not Image Ads)

## Future Enhancements

- Add support for Image Ad variations
- Add preview before pushing to Brief Builder
- Add ability to edit variation data before pushing
- Add bulk operations for multiple variations at once

