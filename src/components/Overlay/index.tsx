import * as THREE from "three";
import { ARButtonSessionInit } from "three/examples/jsm/Addons.js";

function createThreeManager() {
  const SESSION_OPTIONS: ARButtonSessionInit = {
    domOverlay: { root: document.body },
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay"],
  };

  let session: XRSession | null = null;
  let hitTestSource: XRHitTestSource | null = null;
  let hitTestSourceRequested = false;
  let clickable = true;

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

  // プレーンを作成
  const pGeometry = new THREE.PlaneGeometry(0.15, 0.15);
  pGeometry.translate(0, 0.1, 0);

  // テクスチャーを読み込み
  const loader = new THREE.TextureLoader();
  const texture = loader.load("/images/1_Introduction.png");
  if (!texture) return;
  texture.colorSpace = THREE.SRGBColorSpace;

  // マテリアルにテクスチャーを設定
  const imageMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(pGeometry, imageMaterial);
  scene.add(mesh);
  mesh.visible = false;

  // フレームごとに実行されるアニメーション
  animate();

  function animate() {
    renderer.setAnimationLoop(render);
  }

  async function render(_timestamp: number, frame: XRFrame) {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      if (!referenceSpace) {
        console.log("sorry cannot get renderer referenceSpace");
        return;
      }

      const session = renderer.xr.getSession();
      if (!session) {
        console.log("sorry cannot get renderer session");
        return;
      }

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

  function onSelect() {
    if (!clickable) {
      clickable = true;
      return;
    }
    if (reticle.visible) {
      if (mesh.visible) {
        mesh.position.setFromMatrixPosition(reticle.matrix);
      } else {
        mesh.visible = true;
        mesh.position.setFromMatrixPosition(reticle.matrix);
      }
    }
  }

  async function startARSession() {
    if (navigator.xr) {
      session = await navigator.xr.requestSession(
        "immersive-ar",
        SESSION_OPTIONS
      );
      renderer.xr.setReferenceSpaceType("local");
      renderer.xr.setSession(session);

      /* Controller */
      const controller = renderer.xr.getController(0);
      controller.addEventListener("select", onSelect);
      scene.add(controller);
    } else {
      throw new Error("WebXR is not supported");
    }
  }

  return {
    startARSession,
  };
}

export function Overlay() {
  const threeManager = createThreeManager();

  return (
    <>
      <h1>Overlay</h1>
      <button onClick={threeManager!.startARSession}>START!</button>
    </>
  );
}
