import { TestBed } from '@angular/core/testing';
import * as THREE from 'three';
import { DeviceControlService } from './device-control.service';

/** Helper: build a minimal THREE.Object3D with preset userData */
function makeDevice(data: Record<string, unknown>): THREE.Object3D {
  const obj = new THREE.Object3D();
  Object.assign(obj.userData, data);
  return obj;
}

describe('DeviceControlService', () => {
  let service: DeviceControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── changeFridgeTemp ──────────────────────────────────────────────────────

  describe('changeFridgeTemp', () => {
    it('should increase temperature by delta', () => {
      const fridge = makeDevice({ temperature: 4, minTemp: -18, maxTemp: 8 });
      service.changeFridgeTemp(fridge, 2);
      expect(fridge.userData['temperature']).toBe(6);
    });

    it('should decrease temperature by delta', () => {
      const fridge = makeDevice({ temperature: 4, minTemp: -18, maxTemp: 8 });
      service.changeFridgeTemp(fridge, -3);
      expect(fridge.userData['temperature']).toBe(1);
    });

    it('should not exceed maxTemp', () => {
      const fridge = makeDevice({ temperature: 7, minTemp: -18, maxTemp: 8 });
      service.changeFridgeTemp(fridge, 5);
      expect(fridge.userData['temperature']).toBe(8);
    });

    it('should not go below minTemp', () => {
      const fridge = makeDevice({ temperature: -17, minTemp: -18, maxTemp: 8 });
      service.changeFridgeTemp(fridge, -5);
      expect(fridge.userData['temperature']).toBe(-18);
    });

    it('should do nothing when device is null', () => {
      expect(() => service.changeFridgeTemp(null, 1)).not.toThrow();
    });
  });

  // ── changeStoveTemp ───────────────────────────────────────────────────────

  describe('changeStoveTemp', () => {
    it('should increase stove temperature', () => {
      const stove = makeDevice({ temperature: 180 });
      service.changeStoveTemp(stove, 20);
      expect(stove.userData['temperature']).toBe(200);
    });

    it('should not exceed 300°C', () => {
      const stove = makeDevice({ temperature: 295 });
      service.changeStoveTemp(stove, 20);
      expect(stove.userData['temperature']).toBe(300);
    });

    it('should not go below 50°C', () => {
      const stove = makeDevice({ temperature: 55 });
      service.changeStoveTemp(stove, -20);
      expect(stove.userData['temperature']).toBe(50);
    });

    it('should do nothing when device is null', () => {
      expect(() => service.changeStoveTemp(null, 10)).not.toThrow();
    });
  });

  // ── toggleLamp ────────────────────────────────────────────────────────────

  describe('toggleLamp', () => {
    function makeLamp(isOn: boolean): THREE.Object3D {
      const lamp = makeDevice({ isOn, device: true, type: 'lamp' });
      const light = new THREE.PointLight(0xffffff, isOn ? 1.2 : 0, 6);
      lamp.userData['light'] = light;
      lamp.add(light);
      return lamp;
    }

    it('should toggle an ON lamp to OFF and return false', () => {
      const lamp = makeLamp(true);
      const result = service.toggleLamp(lamp);

      expect(result).toBe(false);
      expect(lamp.userData['isOn']).toBe(false);
    });

    it('should toggle an OFF lamp to ON and return true', () => {
      const lamp = makeLamp(false);
      const result = service.toggleLamp(lamp);

      expect(result).toBe(true);
      expect(lamp.userData['isOn']).toBe(true);
    });

    it('should set light intensity to 0 when turning off', () => {
      const lamp = makeLamp(true);
      service.toggleLamp(lamp);

      const light = lamp.userData['light'] as THREE.PointLight;
      expect(light.intensity).toBe(0);
    });

    it('should set light intensity to 1.2 when turning on', () => {
      const lamp = makeLamp(false);
      service.toggleLamp(lamp);

      const light = lamp.userData['light'] as THREE.PointLight;
      expect(light.intensity).toBe(1.2);
    });

    it('should return false when device is null', () => {
      expect(service.toggleLamp(null)).toBe(false);
    });
  });

  // ── setLampColor ──────────────────────────────────────────────────────────

  describe('setLampColor', () => {
    it('should set light color on the PointLight', () => {
      const lamp = new THREE.Object3D();
      const light = new THREE.PointLight(0xffffff, 1.2, 6);
      lamp.userData['light'] = light;

      service.setLampColor(lamp, '#ff0000');

      const expected = new THREE.Color('#ff0000');

      expect(light.color.r).toBeCloseTo(expected.r, 3);
      expect(light.color.g).toBeCloseTo(expected.g, 3);
      expect(light.color.b).toBeCloseTo(expected.b, 3);
    });

    it('should do nothing when device is null', () => {
      expect(() => service.setLampColor(null, '#ffffff')).not.toThrow();
    });
  });
});
