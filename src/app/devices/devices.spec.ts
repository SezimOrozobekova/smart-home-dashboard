import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Devices } from './devices';

describe('Devices', () => {
  let component: Devices;
  let fixture: ComponentFixture<Devices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Devices]
    }).compileComponents();

    fixture = TestBed.createComponent(Devices);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ── Initial data ──────────────────────────────────────────────────────────

  it('should have three rooms defined', () => {
    const rooms = Object.keys(component.devicesByRoom);
    expect(rooms.length).toBe(3);
    expect(rooms).toContain('Bathroom');
    expect(rooms).toContain('Kitchen');
    expect(rooms).toContain('LivingRoom');
  });

  it('should have correct number of devices per room', () => {
    expect(component.devicesByRoom['Bathroom'].length).toBe(2);
    expect(component.devicesByRoom['Kitchen'].length).toBe(3);
    expect(component.devicesByRoom['LivingRoom'].length).toBe(3);
  });

  it('should have Water Heater active by default', () => {
    const heater = component.devicesByRoom['Bathroom'].find(d => d.name === 'Water Heater');
    expect(heater?.active).toBe(true);
  });

  it('should have Washing Machine inactive by default', () => {
    const wm = component.devicesByRoom['Bathroom'].find(d => d.name === 'Washing Machine');
    expect(wm?.active).toBe(false);
  });

  // ── toggleDevice logic ────────────────────────────────────────────────────

  it('toggleDevice should turn an inactive device on', () => {
    const wm = component.devicesByRoom['Bathroom'].find(d => d.name === 'Washing Machine')!;
    const powerBefore = wm.power;

    component.toggleDevice(wm);

    expect(wm.active).toBe(true);
    // power is preserved when turned on (device keeps its original wattage)
    expect(wm.power).toBe(powerBefore);
  });

  it('toggleDevice should turn an active device off and zero its power', () => {
    const heater = component.devicesByRoom['Bathroom'].find(d => d.name === 'Water Heater')!;

    component.toggleDevice(heater);

    expect(heater.active).toBe(false);
    expect(heater.power).toBe(0);
  });

  it('toggleDevice should correctly toggle twice (off → on)', () => {
    const tv = component.devicesByRoom['LivingRoom'].find(d => d.name === 'TV')!;

    // starts active
    component.toggleDevice(tv); // → inactive, power = 0
    expect(tv.active).toBe(false);
    expect(tv.power).toBe(0);

    component.toggleDevice(tv); // → active again
    expect(tv.active).toBe(true);
  });

  it('Fridge should start active in Kitchen', () => {
    const fridge = component.devicesByRoom['Kitchen'].find(d => d.name === 'Fridge')!;
    expect(fridge.active).toBe(true);
  });

  it('Electric Kettle should start inactive in Kitchen', () => {
    const kettle = component.devicesByRoom['Kitchen'].find(d => d.name === 'Electric Kettle')!;
    expect(kettle.active).toBe(false);
  });

  // ── Template rendering ────────────────────────────────────────────────────

  it('should render at least one device card in the DOM', () => {
    fixture.detectChanges();
    const compiled: HTMLElement = fixture.nativeElement;

    // any element that carries a device name
    expect(compiled.textContent).toContain('Fridge');
  });
});
