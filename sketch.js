(function () {
  const DEFAULT_MESSAGES = [
    'Anh gửi em trái tim 3D này 💗',
    'Chúc em luôn được yêu thương và mỉm cười mỗi ngày!',
    'Hẹn nhau những hành trình thật hạnh phúc nhé 💌'
  ];

  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    }
  }

  function showNoSupport() {
    const div = document.createElement('div');
    div.className = 'nosupport';
    div.innerHTML = '<div>Thiết bị hoặc trình duyệt không hỗ trợ WebGL. Hãy mở trang bằng Chrome/Safari mới nhất hoặc chạm ⋯ → <b>Open in Browser</b>.</div>';
    document.body.appendChild(div);
  }

  function parseColorParam(input, fallback) {
    if (!input) return fallback;
    let candidate = input.trim();
    if (candidate.startsWith('#')) candidate = `0x${candidate.slice(1)}`;
    if (!candidate.startsWith('0x')) {
      if (/^[0-9a-fA-F]+$/.test(candidate)) {
        candidate = `0x${candidate}`;
      }
    }
    const value = Number(candidate);
    return Number.isFinite(value) ? value : fallback;
  }

  function shadeGradient(baseColor) {
    const mix = (channel, target, ratio) => Math.round(channel + (target - channel) * ratio);
    const toParts = (color) => ({
      r: (color >> 16) & 255,
      g: (color >> 8) & 255,
      b: color & 255
    });
    const format = ({ r, g, b }) => `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;

    const base = toParts(baseColor);
    const highlight = {
      r: mix(base.r, 255, 0.45),
      g: mix(base.g, 255, 0.45),
      b: mix(base.b, 255, 0.45)
    };
    const mid = {
      r: mix(base.r, 0, 0.25),
      g: mix(base.g, 0, 0.2),
      b: mix(base.b, 0, 0.25)
    };
    const shadow = {
      r: mix(base.r, 0, 0.55),
      g: mix(base.g, 0, 0.6),
      b: mix(base.b, 0, 0.7)
    };
    document.body.style.background = `radial-gradient(circle at 50% -20%, ${format(highlight)}, ${format(mid)} 55%, ${format(shadow)})`;
  }

  ready(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!window.THREE || !gl) {
      showNoSupport();
      return;
    }

    const params = new URLSearchParams(location.search);
    const loverNames = params.get('name') || 'Anh ❤ Em';
    const dateText = params.get('date') || new Date().toLocaleDateString('vi-VN');
    const titleText = params.get('title') || 'Yêu Em Rất Nhiều';
    const bgColorValue = parseColorParam(params.get('bg'), 0x16040a);
    const heartColorValue = parseColorParam(params.get('color'), 0xff2d55);
    const messages = (params.get('msg') || '')
      .split('|')
      .map(str => str.trim())
      .filter(Boolean);

    document.querySelector('#title').textContent = `${titleText} ✨`;
    document.querySelector('#subtitle').textContent = `${loverNames} • ${dateText}`;

    const chat = document.getElementById('chat');
    chat.innerHTML = '';
    (messages.length ? messages : DEFAULT_MESSAGES).forEach((text, index) => {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${index % 2 === 0 ? 'you' : 'them'}`;
      bubble.textContent = text;
      chat.appendChild(bubble);
    });

    shadeGradient(bgColorValue);

    const app = document.getElementById('app');
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.physicallyCorrectLights = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.touchAction = 'none';
    app.innerHTML = '';
    app.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 0.7, 4.5);

    let isDown = false;
    let lastX = 0;
    let lastY = 0;
    let rotateY = 0;
    let rotateX = 0;
    let distance = 4.5;

    const handleDown = (event) => {
      isDown = true;
      const point = event.touches ? event.touches[0] : event;
      lastX = point.clientX;
      lastY = point.clientY;
    };
    const handleMove = (event) => {
      if (!isDown) return;
      const point = event.touches ? event.touches[0] : event;
      rotateY += (point.clientX - lastX) * 0.003;
      rotateX += (point.clientY - lastY) * 0.003;
      rotateX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, rotateX));
      lastX = point.clientX;
      lastY = point.clientY;
    };
    const handleUp = () => {
      isDown = false;
    };
    const handleWheel = (event) => {
      distance = Math.max(2.4, Math.min(7.2, distance + (event.deltaY > 0 ? 0.3 : -0.3)));
    };

    renderer.domElement.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    renderer.domElement.addEventListener('touchstart', handleDown, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleUp);
    window.addEventListener('wheel', handleWheel, { passive: true });

    const heartColor = new THREE.Color(heartColorValue);

    const keyLight = new THREE.PointLight(0xffffff, 12, 100);
    keyLight.position.set(0.8, 2.4, 4.0);
    const rimLight = new THREE.DirectionalLight(heartColorValue, 1.4);
    rimLight.position.set(-2.6, 2.2, -2.4);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x090214, 0.25);
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(keyLight, rimLight, hemiLight, ambient);

    function sampleHeart(count) {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        let x, y, z, v, iter = 0;
        do {
          x = (Math.random() * 2 - 1) * 1.6;
          y = (Math.random() * 2 - 1) * 1.6;
          z = (Math.random() * 2 - 1) * 1.6;
          const a = x * x + 2.25 * y * y + z * z - 1;
          v = a * a * a - x * x * z * z * z - (9 / 80) * y * y * z * z * z;
        } while (Math.abs(v) > 0.12 && ++iter < 200);
        const index = i * 3;
        positions[index] = x * 1.1;
        positions[index + 1] = y * 1.1;
        positions[index + 2] = z * 1.1;
        const color = heartColor.clone();
        color.offsetHSL((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.06);
        colors[index] = color.r;
        colors[index + 1] = color.g;
        colors[index + 2] = color.b;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      return geometry;
    }

    function createHeartShape() {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.6);
      shape.bezierCurveTo(-0.5, 1.0, -1.4, 0.3, 0, -0.9);
      shape.bezierCurveTo(1.4, 0.3, 0.5, 1.0, 0, 0.6);
      return shape;
    }

    const textureLoader = new THREE.TextureLoader();
    const sprite = textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/sprites/spark1.png');
    const heartGeom = sampleHeart(20000);
    const heartPointsMat = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      map: sprite,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const heartPoints = new THREE.Points(heartGeom, heartPointsMat);
    scene.add(heartPoints);

    const heartShapeGeo = new THREE.ExtrudeGeometry(createHeartShape(), {
      depth: 0.6,
      steps: 48,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.18,
      bevelSegments: 8
    });
    heartShapeGeo.center();
    heartShapeGeo.scale(1.4, 1.4, 1.8);

    const heartMatcap = textureLoader.load('https://raw.githubusercontent.com/nidorx/matcaps/master/512/FF4040_FF1510_840000_2C0000.png');
    const heartCoreMat = new THREE.MeshMatcapMaterial({
      color: heartColor.clone().multiplyScalar(1.03),
      matcap: heartMatcap
    });
    heartCoreMat.toneMapped = false;

    const heartCore = new THREE.Mesh(heartShapeGeo, heartCoreMat);
    heartCore.rotation.x = Math.PI;
    heartCore.position.y = -0.05;
    scene.add(heartCore);

    const heartHaloMat = new THREE.MeshBasicMaterial({
      color: heartColorValue,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide
    });
    const heartHalo = new THREE.Mesh(heartShapeGeo.clone(), heartHaloMat);
    heartHalo.rotation.x = Math.PI;
    heartHalo.position.copy(heartCore.position);
    heartHalo.scale.set(1.12, 1.12, 1.06);
    scene.add(heartHalo);

    const miniHeartGeo = new THREE.ExtrudeGeometry(createHeartShape(), {
      depth: 0.22,
      steps: 24,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.06,
      bevelSegments: 4
    });
    miniHeartGeo.center();
    miniHeartGeo.scale(0.42, 0.42, 0.5);
    const miniHeartMat = new THREE.MeshMatcapMaterial({
      color: heartColor.clone().offsetHSL(0, 0, 0.08),
      matcap: heartMatcap
    });
    miniHeartMat.toneMapped = false;
    const ORBIT_COUNT = 20;
    const orbitHearts = new THREE.InstancedMesh(miniHeartGeo, miniHeartMat, ORBIT_COUNT);
    orbitHearts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(orbitHearts);
    const orbitInfo = [];
    for (let i = 0; i < ORBIT_COUNT; i++) {
      orbitInfo.push({
        radius: 1.35 + Math.random() * 0.55,
        vertical: -0.1 + Math.random() * 0.8,
        speed: 0.3 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        wobble: 0.25 + Math.random() * 0.35
      });
    }
    const tmpHeart = new THREE.Object3D();

    const floatCount = 900;
    const floatGeo = new THREE.BufferGeometry();
    const floatPos = new Float32Array(floatCount * 3);
    const floatSpeed = new Float32Array(floatCount);
    for (let i = 0; i < floatCount; i++) {
      const radius = 2.6 + Math.random() * 3.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      const idx = i * 3;
      floatPos[idx] = Math.cos(theta) * radius;
      floatPos[idx + 1] = (Math.random() * 2 - 1) * 1.5;
      floatPos[idx + 2] = Math.sin(phi) * radius;
      floatSpeed[i] = 0.2 + Math.random() * 0.6;
    }
    floatGeo.setAttribute('position', new THREE.BufferAttribute(floatPos, 3));
    const floatMat = new THREE.PointsMaterial({
      size: 0.015,
      map: sprite,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffffff
    });
    const floats = new THREE.Points(floatGeo, floatMat);
    scene.add(floats);

    const ringGeo = new THREE.RingGeometry(0.25, 0.6, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: heartColorValue,
      opacity: 0.25,
      transparent: true,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.2;
    scene.add(ring);

    const glowGeo = new THREE.CircleGeometry(0.9, 48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: heartColorValue,
      opacity: 0.12,
      transparent: true
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -1.23;
    scene.add(glow);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const clock = new THREE.Clock();

    function animate() {
      const elapsed = clock.getElapsedTime();
      rotateY += 0.003;
      const camX = Math.sin(rotateY) * distance;
      const camZ = Math.cos(rotateY) * distance;
      const camY = 0.7 + Math.sin(rotateX) * 0.6;
      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, 0, 0);

      const scalePulse = 1 + Math.sin(elapsed * 2.0) * 0.03;
      heartPoints.scale.set(scalePulse, scalePulse, scalePulse);
      heartPoints.rotation.y = Math.sin(elapsed * 0.5) * 0.15;

      const corePulse = 1 + Math.sin(elapsed * 1.6) * 0.045;
      heartCore.scale.set(corePulse, corePulse, corePulse);
      heartCore.rotation.y = Math.PI + Math.sin(elapsed * 0.45) * 0.4;
      heartCore.rotation.z = Math.sin(elapsed * 0.9) * 0.08;

      const haloBase = 1.12 + Math.sin(elapsed * 1.4) * 0.05;
      heartHalo.scale.set(haloBase, haloBase, 1.06 + Math.sin(elapsed * 1.7) * 0.03);
      heartHalo.material.opacity = 0.14 + Math.sin(elapsed * 1.9) * 0.05;

      for (let i = 0; i < ORBIT_COUNT; i++) {
        const info = orbitInfo[i];
        const angle = elapsed * info.speed + info.phase;
        const yOffset = Math.sin(elapsed * 0.9 + info.phase) * info.wobble * 0.4;
        tmpHeart.position.set(
          Math.cos(angle) * info.radius,
          info.vertical + yOffset,
          Math.sin(angle) * info.radius
        );
        tmpHeart.rotation.set(
          Math.sin(angle * 1.8) * 0.35,
          -angle + Math.PI / 2,
          Math.cos(angle * 1.6) * 0.25
        );
        const miniScale = 0.55 + Math.sin(elapsed * 1.4 + info.phase) * 0.08;
        tmpHeart.scale.setScalar(miniScale);
        tmpHeart.updateMatrix();
        orbitHearts.setMatrixAt(i, tmpHeart.matrix);
      }
      orbitHearts.instanceMatrix.needsUpdate = true;

      const positions = floats.geometry.attributes.position.array;
      for (let i = 0; i < floatCount; i++) {
        positions[i * 3 + 1] += Math.sin(elapsed * floatSpeed[i] + i) * 0.0025;
      }
      floats.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    animate();
    window.addEventListener('contextmenu', (event) => event.preventDefault());
  });
})();
