import * as THREE from "three";
import { ARButtonSessionInit } from "three/examples/jsm/Addons.js";

function createThreeManager() {
  let session: XRSession | null = null;

  /* Scene */
  const scene = new THREE.Scene();

  /* Camera */
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20
  );
  camera.position.set(0, 1.6, 0);
  scene.add(camera);

  /* Light */
  const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  ambient.position.set(0.5, 1, 0.25);
  scene.add(ambient);

  /* Renderer */
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  /* 立方体生成 */
  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  /* Controller */
  const controller = renderer.xr.getController(0);
  controller.addEventListener("select", onSelect);
  scene.add(controller);

  function onSelect() {
    cube.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
  }

  // フレームごとに実行されるアニメーション
  animate();

  function animate() {
    renderer.setAnimationLoop(render);
  }

  async function render() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }

  const SESSION_OPTIONS: ARButtonSessionInit = {
    domOverlay: { root: document.body },
  };

  async function startARSession() {
    if (navigator.xr) {
      session = await navigator.xr.requestSession(
        "immersive-ar",
        SESSION_OPTIONS
      );
      if (session == null) {
        throw new Error("Failed to start AR session");
      }
      renderer.xr.setReferenceSpaceType("local");
      renderer.xr.setSession(session);
    } else {
      throw new Error("WebXR is not supported");
    }
  }

  return {
    startARSession,
  };
}

export function HelloAR() {
  const threeManager = createThreeManager();

  return (
    <>
      <h1>HelloAR</h1>
      <button onClick={threeManager.startARSession}>START!</button>
    </>
  );
}
