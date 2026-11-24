# Testing Guide - Map Navigation Features

## Quick Start Testing

### Manual Testing Steps

#### Test 1: Initial Map Load (No Markers Visible)
**Expected:** When opening the home page, the map should display but show NO location markers initially.
1. Open the application
2. Navigate to the home page (/)
3. Observe the map component
4. **Expected Result:** Only the user location marker (if enabled) and campus boundaries visible; no other location markers

---

#### Test 2: Select Location from List
**Expected:** When selecting a location from the list, only that location's marker appears on the map.
1. Open the application
2. Wait for locations to load
3. Click on a location in the locations list
4. **Expected Result:**
   - Selected location marker appears on map (larger, more prominent)
   - All other markers remain hidden
   - Destination panel shows selected location info
   - Map focuses on selected location with fly-to animation

---

#### Test 3: Select Different Location
**Expected:** Switching to another location hides the previous marker and shows the new one.
1. Have a location selected (from Test 2)
2. Click on a different location in the list
3. **Expected Result:**
   - Previous marker disappears immediately
   - New marker appears (larger, prominent)
   - Map smoothly transitions to new location
   - Only one marker visible at any time

---

#### Test 4: Click on Map to Create Custom Location
**Expected:** When clicking on an empty area of the map, a custom temporary location is created.
1. Open the application
2. Click on an empty area of the map (not on an existing marker)
3. **Expected Result:**
   - A custom location marker appears at click point
   - Destination panel shows "Custom Location"
   - Displays "(Map pin)" indicator next to location name
   - Shows "You pinned a location on the map" message
   - "Clear map pin" button appears in destination panel

---

#### Test 5: Click Near Existing Location
**Expected:** When clicking within 50m of an existing location, that location is selected instead of creating a custom one.
1. Open the application
2. Locate a campus location on the map
3. Click on a spot ~40m away from that location (use zoom/pan to get precise placement)
4. **Expected Result:**
   - Existing location is selected automatically
   - No custom location created
   - That location's marker appears on map

---

#### Test 6: Clear Custom Location
**Expected:** Custom locations can be cleared using the "Clear map pin" button.
1. Create a custom location by clicking on the map (Test 4)
2. Click the "Clear map pin" button
3. **Expected Result:**
   - Custom location disappears
   - Destination panel resets to "Choose a destination"
   - Map shows no markers

---

#### Test 7: Navigation with Custom Location
**Expected:** Navigation can be initiated with a custom map pin location.
1. Create a custom location by clicking on the map (Test 4)
2. Enable location services
3. Click "Start navigation" button
4. **Expected Result:**
   - Navigation screen loads
   - Custom location coordinates passed via URL (`?lat=X&lng=Y`)
   - Navigation system can generate routes to custom coordinates
   - Route displays correctly despite location not being in database

---

#### Test 8: Campus Switching Clears Selection
**Expected:** Changing campus clears selected location and custom pins.
1. Have a location selected on one campus
2. Switch to a different campus using the campus selector
3. **Expected Result:**
   - Selected location clears
   - Custom location clears
   - Map shows no markers
   - Destination panel resets
   - New campus boundaries visible

---

#### Test 9: Search Filter Interaction
**Expected:** Searching/filtering doesn't interfere with map marker display.
1. Have a location selected
2. Use the search bar to filter locations
3. **Expected Result:**
   - Selected location marker still visible on map
   - Filtered list shows in destination list
   - Only selected location's marker displays
   - Switching to another filtered result updates map correctly

---

#### Test 10: Mobile Responsiveness
**Expected:** Feature works smoothly on mobile devices.
1. Open application on mobile device or use mobile browser emulation
2. Test all scenarios above (Tests 1-9)
3. **Expected Result:**
   - Markers display correctly at mobile resolution
   - Touch events work smoothly
   - Map clicks register properly with touch
   - Bottom sheet transitions smooth
   - All buttons easily tappable

---

## Automated Testing Guide

### Unit Tests (Jest/Vitest)

```typescript
// Test distance calculation for 50m threshold
describe('Map Click Handler', () => {
  test('should select location if within 50m threshold', () => {
    const loc1 = { lat: 10.0, lng: 20.0 };
    const loc2 = { lat: 10.0004, lng: 20.0 }; // ~44m away
    
    const distance = calculateDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
    expect(distance).toBeLessThan(50);
  });

  test('should create custom location if beyond 50m', () => {
    const loc1 = { lat: 10.0, lng: 20.0 };
    const loc2 = { lat: 10.0006, lng: 20.0 }; // ~67m away
    
    const distance = calculateDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
    expect(distance).toBeGreaterThan(50);
  });
});
```

### Integration Tests

```typescript
// Test marker visibility
describe('Map Marker Visibility', () => {
  test('should hide all markers initially', async () => {
    const { container } = render(<CampusMap markers={mockMarkers} />);
    
    const markers = container.querySelectorAll('circle[class*="marker"]');
    expect(markers).toHaveLength(0);
  });

  test('should show only selected marker', async () => {
    const { rerender, container } = render(
      <CampusMap markers={mockMarkers} destination={undefined} />
    );
    
    rerender(
      <CampusMap markers={mockMarkers} destination={mockMarkers[0]} />
    );
    
    const markers = container.querySelectorAll('circle[class*="marker"]');
    expect(markers).toHaveLength(1);
  });
});
```

### E2E Tests (Playwright)

```typescript
test('Full flow: select location, navigate, return home', async ({ page }) => {
  // Start on home page
  await page.goto('/');
  
  // Wait for map to load
  await page.waitForSelector('[class*="leaflet"]');
  
  // Initially no markers visible (except user location)
  let markers = await page.locator('circle[data-testid="location-marker"]');
  expect(await markers.count()).toBe(0);
  
  // Click a location from list
  await page.click('button:has-text("Library")');
  
  // Verify marker appeared
  markers = await page.locator('circle[data-testid="location-marker"]');
  expect(await markers.count()).toBe(1);
  
  // Click navigation button
  await page.click('button:has-text("Start navigation")');
  
  // Should navigate to navigation page
  await page.waitForURL('/navigation*');
  expect(page.url()).toContain('id=');
});

test('Map click creates custom location', async ({ page }) => {
  await page.goto('/');
  
  // Click on map at specific coordinates
  const mapBounds = await page.locator('[class*="leaflet-container"]').boundingBox();
  await page.click('[class*="leaflet-container"]', {
    position: { x: mapBounds.width / 2 + 50, y: mapBounds.height / 2 + 50 }
  });
  
  // Verify custom location indicator appears
  await expect(page.locator('text=Map pin')).toBeVisible();
  
  // Verify "Clear map pin" button appears
  await expect(page.locator('button:has-text("Clear map pin")')).toBeVisible();
});
```

---

## Browser DevTools Testing

### Console Checks
```javascript
// Verify map click handler registered
console.log('Map click handler:', map.listens('click'));

// Log marker visibility
console.log('Visible markers:', document.querySelectorAll('circle[data-visible="true"]').length);
```

### Performance Testing
1. Open DevTools > Performance
2. Navigate to home page
3. Select location
4. Click on map
5. Record and analyze:
   - Marker rendering time
   - State update performance
   - Memory usage for custom locations

---

## Device Testing Matrix

### Browsers
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Samsung Internet

### Zoom Levels
- [ ] 100% (normal)
- [ ] 90% (zoomed out)
- [ ] 110% (zoomed in)
- [ ] 150% (high zoom - mobile)

### Screen Sizes
- [ ] 320px (mobile)
- [ ] 480px (tablet portrait)
- [ ] 768px (tablet landscape)
- [ ] 1024px (desktop)
- [ ] 1920px (large desktop)

---

## Edge Cases to Test

1. **Very Close Clicks** - Click less than 1m from existing location
2. **Campus Boundary Clicks** - Click right on campus boundary
3. **Multiple Rapid Clicks** - Click map multiple times rapidly
4. **Network Offline** - Create custom location while offline
5. **Low GPS Accuracy** - Custom location with accuracy >100m
6. **Very Large Marker List** - 100+ locations loaded
7. **Rapid Campus Switching** - Switch campuses multiple times
8. **Custom Location Edit** - Try to edit custom location name
9. **Persist across Route** - Custom location persists when switching to navigation
10. **Zoom Level 20** - Map zoomed to max level before click

---

## Regression Testing Checklist

Before releasing, verify these existing features still work:
- [ ] Regular location selection from list
- [ ] User location tracking accuracy
- [ ] Route calculation and display
- [ ] Campus boundary enforcement
- [ ] Search/filter functionality
- [ ] Booking availability display
- [ ] Navigation start and route following
- [ ] Mobile bottom sheet interactions
- [ ] Address bar location display
- [ ] Touch scroll on location list

---

## Accessibility Testing

```bash
# Run axe accessibility scanner
npx @axe-core/cli http://localhost:3000/

# Check keyboard navigation
# - Tab through location list
# - Tab to map
# - Tab to clear button
# - Verify focus indicators visible

# Screen reader testing
# - Verify map click creates accessible announcement
# - Verify marker updates announced
# - Verify button labels clear
```

---

## Performance Benchmarks

Target metrics:
- **Initial marker render:** < 100ms
- **Marker hide/show:** < 50ms
- **Custom location creation:** < 30ms
- **Map click response:** < 100ms
- **State update:** < 50ms
- **Memory per location:** < 5KB

Measure using:
```bash
npm run build && npm start
# Use Chrome DevTools > Performance > Record
```
