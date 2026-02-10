# How to Add an Anniversary

## Quick Start
Navigate to `/anniversaries` and click create button.

## Form Fields
1. **Title** (required): Anniversary name
2. **Category**: 生日/纪念日/节日
3. **Date Type**: Solar (公历) or Lunar (农历)
4. **Date**: Month-Day selection
5. **Leap Month**: Toggle for lunar leap months
6. **Reminders**: Days before anniversary

## Solar vs Lunar

### Solar (公历)
- Standard Gregorian calendar
- Date stored as `MM-DD`
- Next occurrence: same month-day next year

### Lunar (农历)
- Chinese lunar calendar
- Uses `lunar-javascript` for conversion
- Handles month variations
- Leap month support

## Server Action Flow
1. Form submission
2. `createAnniversary()` in `src/app/_actions/anniversaries.ts`
3. Zod validation via `anniversaryCreateSchema`
4. Insert to `anniversaries` table
5. `revalidatePath("/anniversaries")`

## Date Calculation
For notifications, the system calculates next occurrence:
- **Solar**: `getNextSolarOccurrenceDateString()`
- **Lunar**: `getNextLunarOccurrenceDateString()`

Both in `src/server/anniversary.ts`

## Key Files
- **Action**: `src/app/_actions/anniversaries.ts:createAnniversary`
- **Schema**: `src/lib/validation/anniversary.ts`
- **Form**: `src/app/_components/anniversary/AnniversaryCreateForm.tsx`
- **Date Utils**: `src/lib/lunar-utils.ts`
