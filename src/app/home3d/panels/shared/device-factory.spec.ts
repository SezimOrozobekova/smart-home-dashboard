import * as THREE from 'three';
import { setupDevice } from './device-factory';

/** Helper: create an Object3D with a given name */
function obj(name: string): THREE.Object3D {
  const o = new THREE.Object3D();
  o.name = name;
  return o;
}

describe('setupDevice (device-factory)', () => {

  // ── Fridge ─────────────────────────────────────────────────────────────────

  describe('fridge setup', () => {
    it('should assign type "fridge" for object named "fridge"', () => {
      const o = obj('Kitchen_fridge_01');
      setupDevice(o);
      expect(o.userData['type']).toBe('fridge');
    });

    it('fridge should default to isOn: true', () => {
      const o = obj('fridge');
      setupDevice(o);
      expect(o.userData['isOn']).toBe(true);
    });

    it('fridge should default temperature to 4°C', () => {
      const o = obj('fridge');
      setupDevice(o);
      expect(o.userData['temperature']).toBe(4);
    });

    it('fridge should have minTemp -18 and maxTemp 8', () => {
      const o = obj('fridge');
      setupDevice(o);
      expect(o.userData['minTemp']).toBe(-18);
      expect(o.userData['maxTemp']).toBe(8);
    });

    it('should not overwrite already-configured device', () => {
      const o = obj('fridge');
      o.userData['device'] = true;
      o.userData['type'] = 'custom';

      setupDevice(o);

      expect(o.userData['type']).toBe('custom');
    });
  });

  // ── Stove / Oven ───────────────────────────────────────────────────────────

  describe('stove/oven setup', () => {
    it('should assign type "stove" for object named "stove"', () => {
      const o = obj('stove');
      setupDevice(o);
      expect(o.userData['type']).toBe('stove');
    });

    it('should assign type "stove" for object named "oven"', () => {
      const o = obj('Kitchen_oven_main');
      setupDevice(o);
      expect(o.userData['type']).toBe('stove');
    });

    it('stove should default temperature to 180°C', () => {
      const o = obj('stove');
      setupDevice(o);
      expect(o.userData['temperature']).toBe(180);
    });

    it('stove should default to isOn: true', () => {
      const o = obj('stove');
      setupDevice(o);
      expect(o.userData['isOn']).toBe(true);
    });
  });

  // ── Kettle / Coffee ────────────────────────────────────────────────────────

  describe('kettle/coffee setup', () => {
    it('should assign type "kettle" for object named "kettle"', () => {
      const o = obj('electric_kettle');
      setupDevice(o);
      expect(o.userData['type']).toBe('kettle');
    });

    it('should assign type "kettle" for object named "coffee"', () => {
      const o = obj('coffee_machine');
      setupDevice(o);
      expect(o.userData['type']).toBe('kettle');
    });

    it('kettle should default to isOn: false', () => {
      const o = obj('kettle');
      setupDevice(o);
      expect(o.userData['isOn']).toBe(false);
    });

    it('kettle should have timeLeft: 120 seconds', () => {
      const o = obj('kettle');
      setupDevice(o);
      expect(o.userData['timeLeft']).toBe(120);
    });
  });

  // ── Lamp / Light ───────────────────────────────────────────────────────────

  describe('lamp/light setup', () => {
    it('should assign type "lamp" for object named "lamp"', () => {
      const o = obj('room_lamp');
      setupDevice(o);
      expect(o.userData['type']).toBe('lamp');
    });

    it('should assign type "lamp" for object named "light"', () => {
      const o = obj('ceiling_light');
      setupDevice(o);
      expect(o.userData['type']).toBe('lamp');
    });

    it('lamp should default to isOn: true', () => {
      const o = obj('lamp');
      setupDevice(o);
      expect(o.userData['isOn']).toBe(true);
    });

    it('lamp should add a PointLight child', () => {
      const o = obj('lamp');
      setupDevice(o);
      const light = o.userData['light'] as THREE.PointLight;
      expect(light).toBeInstanceOf(THREE.PointLight);
    });

    it('lamp PointLight should have intensity 1.2', () => {
      const o = obj('lamp');
      setupDevice(o);
      const light = o.userData['light'] as THREE.PointLight;
      expect(light.intensity).toBe(1.2);
    });

    it('lamp PointLight should cast shadows', () => {
      const o = obj('lamp');
      setupDevice(o);
      const light = o.userData['light'] as THREE.PointLight;
      expect(light.castShadow).toBe(true);
    });
  });

  // ── Unknown object ─────────────────────────────────────────────────────────

  describe('unknown objects', () => {
    it('should not throw for an unrecognised object name', () => {
      const o = obj('random_furniture_piece');
      expect(() => setupDevice(o)).not.toThrow();
    });

    it('should not mark an unrecognised object as a device', () => {
      const o = obj('random_furniture_piece');
      setupDevice(o);
      expect(o.userData['device']).toBeUndefined();
    });
  });

});
