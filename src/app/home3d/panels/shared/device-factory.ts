import * as THREE from 'three';

function findNearestAnchor(
  root: THREE.Object3D,
  sceneRoot: THREE.Object3D,
  maxDistance = 2
): THREE.Object3D | null {
  const rootPos = new THREE.Vector3();
  root.getWorldPosition(rootPos);

  let nearest: THREE.Object3D | null = null;
  let minDistance = Infinity;

  sceneRoot.traverse(obj => {
    const name = (obj.name || '').toLowerCase();
    if (!name.includes('anchor')) return;

    const pos = new THREE.Vector3();
    obj.getWorldPosition(pos);

    const dist = rootPos.distanceTo(pos);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = obj;
    }
  });

  return minDistance <= maxDistance ? nearest : null;
}

export function setupDevice(root: THREE.Object3D, sceneRoot: THREE.Object3D): void {
  if (root.userData?.['device']) return;

  const name = (root.name || '').toLowerCase();

  if (name.includes('fridge')) {
    root.userData = {
      ...root.userData,
      device: true,
      type: 'fridge',
      isOn: true,
      temperature: 4,
      minTemp: -18,
      maxTemp: 8
    };
    return;
  }

  if (name.includes('stove') || name.includes('oven') || name.includes('cooktop')) {
    root.userData = {
      ...root.userData,
      device: true,
      type: 'stove',
      isOn: true,
      temperature: 180
    };
    return;
  }

  if (name.includes('coffee') || name.includes('kettle')) {
    root.userData = {
      ...root.userData,
      device: true,
      type: 'kettle',
      isOn: false,
      timeLeft: 120
    };
    return;
  }

  if (name.includes('lamp')) {
    const anchor = findNearestAnchor(root, sceneRoot, 2);

    let light: THREE.SpotLight | null = null;
    let lightTarget: THREE.Object3D | null = null;

    if (anchor) {
      const anchorPos = new THREE.Vector3();
      anchor.getWorldPosition(anchorPos);

      light = new THREE.SpotLight(
        0xffe8b6,
        18,
        10,
        Math.PI / 5,
        0.45,
        2
      );

      light.position.copy(anchorPos);
      light.castShadow = false;

      lightTarget = new THREE.Object3D();
      lightTarget.position.set(
        anchorPos.x,
        anchorPos.y - 2.2,
        anchorPos.z + 0.7
      );

      sceneRoot.add(lightTarget);
      light.target = lightTarget;
      sceneRoot.add(light);

      light.intensity = 0;
    }

    root.userData = {
      ...root.userData,
      device: true,
      type: 'lamp',
      isOn: false,
      light,
      lightTarget,
      defaultIntensity: 18
    };
  }
}
