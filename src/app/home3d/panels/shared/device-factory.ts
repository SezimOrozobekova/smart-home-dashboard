import * as THREE from 'three';

export function setupDevice(root: THREE.Object3D): void {
  const name = (root.name || '').toLowerCase();

  if (root.userData?.['device']) return;

  if (name.includes('fridge')) {
    root.userData = {
      device: true,
      type: 'fridge',
      isOn: true,
      temperature: 4,
      minTemp: -18,
      maxTemp: 8
    };
    return;
  }

  if (name.includes('stove') || name.includes('oven')) {
    root.userData = {
      device: true,
      type: 'stove',
      isOn: true,
      temperature: 180
    };
    return;
  }

  if (name.includes('coffee') || name.includes('kettle')) {
    root.userData = {
      device: true,
      type: 'kettle',
      isOn: false,
      timeLeft: 120
    };
    return;
  }

  if (name.includes('lamp') || name.includes('light')) {
    root.userData['device'] = true;
    root.userData['type'] = 'lamp';
    root.userData['isOn'] = true;

    const light = new THREE.PointLight(0xffffff, 1.2, 6);
    light.position.set(0, 0.2, 0);
    light.castShadow = true;

    root.add(light);
    root.userData['light'] = light;
  }
}
