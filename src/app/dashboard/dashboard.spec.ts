import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Dashboard } from './dashboard';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      // Use 'browser' so isPlatformBrowser returns true during tests
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }, provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ── Summary cards ─────────────────────────────────────────────────────────

  it('should have 5 summary items', () => {
    expect(component.summary.length).toBe(5);
  });

  it('should report 24 connected devices', () => {
    const item = component.summary.find(s => s.title === 'Devices Connected');
    expect(item?.value).toBe('24');
  });

  it('should report 12 active devices', () => {
    const item = component.summary.find(s => s.title === 'Active Devices');
    expect(item?.value).toBe('12');
  });

  it('cost summary item should have type "danger"', () => {
    const cost = component.summary.find(s => s.title === 'Cost estimate');
    expect(cost?.type).toBe('danger');
  });

  // ── Filter options ────────────────────────────────────────────────────────

  it('should have 3 filter options (day / week / month)', () => {
    expect(component.filterOptions.length).toBe(3);
    const values = component.filterOptions.map(f => f.value);
    expect(values).toContain('day');
    expect(values).toContain('week');
    expect(values).toContain('month');
  });

  it('default energyFilter should be "day"', () => {
    expect(component.energyFilter).toBe('day');
  });

  it('default temperatureFilter should be "day"', () => {
    expect(component.temperatureFilter).toBe('day');
  });

  // ── Energy mock data ──────────────────────────────────────────────────────

  it('selectedEnergySummary should return day data by default', () => {
    const summary = component.selectedEnergySummary;
    expect(summary.total).toBe('15.7');
    expect(summary.peakWindow).toBe('17:00 – 19:00');
  });

  it('selectedEnergySummary should update when filter changes', () => {
    component.energyFilter = 'week';
    expect(component.selectedEnergySummary.total).toBe('93.7');
  });

  it('selectedEnergySummary for month should have 15 labels', () => {
    component.energyFilter = 'month';
    expect(component.selectedEnergySummary.labels.length).toBe(15);
  });

  // ── Temperature mock data ─────────────────────────────────────────────────

  it('selectedTemperatureSummary should return day data by default', () => {
    const summary = component.selectedTemperatureSummary;
    expect(summary.avg).toBe('21.4');
    expect(summary.min).toBe(18);
    expect(summary.max).toBe(25);
  });

  it('selectedTemperatureSummary should update when filter changes', () => {
    component.temperatureFilter = 'week';
    expect(component.selectedTemperatureSummary.avg).toBe('21.6');
  });

  // ── Top consumers ─────────────────────────────────────────────────────────

  it('should have 5 top consumers', () => {
    expect(component.topConsumers.length).toBe(5);
  });

  it('Smart Heater should be the top consumer', () => {
    expect(component.topConsumers[0].name).toBe('Smart Heater');
    expect(component.topConsumers[0].energy).toBe('4.2 kWh');
  });

  // ── Recent activities ─────────────────────────────────────────────────────

  it('should have 7 recent activities', () => {
    expect(component.recentActivities.length).toBe(7);
  });

  it('most recent activity should be at 19:42', () => {
    expect(component.recentActivities[0].time).toBe('19:42');
  });

  // ── Floor selection ───────────────────────────────────────────────────────

  it('default floor should be "first"', () => {
    expect(component.selectedFloor).toBe('first');
  });

  it('selectFloor should change the selected floor', () => {
    component.selectFloor('second');
    expect(component.selectedFloor).toBe('second');
  });

  it('selectedFloorImage should return a non-empty string', () => {
    expect(component.selectedFloorImage.length).toBeGreaterThan(0);
  });

  // ── Event handlers ────────────────────────────────────────────────────────

  it('onEnergyFilterChange should update energyFilter', () => {
    const fakeEvent = { target: { value: 'month' } } as unknown as Event;
    component.onEnergyFilterChange(fakeEvent);
    expect(component.energyFilter).toBe('month');
  });

  it('onTemperatureFilterChange should update temperatureFilter', () => {
    const fakeEvent = { target: { value: 'week' } } as unknown as Event;
    component.onTemperatureFilterChange(fakeEvent);
    expect(component.temperatureFilter).toBe('week');
  });

  // ── TrackBy helpers ───────────────────────────────────────────────────────

  it('trackByTitle should return the item title', () => {
    const item = component.summary[0];
    expect(component.trackByTitle(0, item)).toBe(item.title);
  });

  it('trackByConsumer should return the consumer name', () => {
    const consumer = component.topConsumers[0];
    expect(component.trackByConsumer(0, consumer)).toBe(consumer.name);
  });

  it('trackByActivity should return a combined key', () => {
    const activity = component.recentActivities[0];
    expect(component.trackByActivity(0, activity)).toBe(`${activity.time}-${activity.text}`);
  });
});
