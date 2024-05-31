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
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  /* Reticle */
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.0375, 0.05, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial()
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

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
    if (reticle.visible) {
      cube.position.setFromMatrixPosition(reticle.matrix);
    }
  }

  // フレームごとに実行されるアニメーション
  animate();

  function animate() {
    renderer.setAnimationLoop(render);
  }

  let hitTestSource: XRHitTestSource | null = null;
  let hitTestSourceRequested = false;

  async function render(_timestamp: number, frame: XRFrame) {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      if (!referenceSpace) return;

      const session = renderer.xr.getSession();
      if (!session) return;

      if (hitTestSourceRequested === false) {
        session.requestReferenceSpace("viewer").then((referenceSpace) => {
          session.requestHitTestSource!({ space: referenceSpace })!.then(
            function (source) {
              hitTestSource = source;
            }
          );
        });

        session.addEventListener("end", function () {
          hitTestSourceRequested = false;
          hitTestSource = null;
        });

        hitTestSourceRequested = true;
      }

      if (hitTestSource) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          reticle.visible = true;

          reticle.matrix.fromArray(
            hit.getPose(referenceSpace)!.transform.matrix
          );
        } else {
          reticle.visible = false;
        }
      }
    }
    renderer.render(scene, camera);
  }

  const SESSION_OPTIONS: ARButtonSessionInit = {
    domOverlay: { root: document.body },
    requiredFeatures: ["hit-test"],
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

export function HitTest() {
  const threeManager = createThreeManager();

  return (
    <>
      <h1>HitTest</h1>
      <button onClick={threeManager.startARSession}>START!</button>
    </>
  );
}
