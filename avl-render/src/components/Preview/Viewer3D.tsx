import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useProjectStore } from "@/store/project-store";
import { projectToP } from "@/engine/project-to-p";

export function Viewer3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const project = useProjectStore((s) => s.project);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const P = projectToP(project);
    const CAB_W = P.CAB_W ?? P.CAB;
    const CAB_H = P.CAB_H ?? P.CAB;
    const DEAD_ROWS = P.DEAD_ROWS ?? 0;
    const DEAD_COLS = P.DEAD_COLS ?? 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeef1f6);

    const W = container.clientWidth || 640;
    const H = container.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(6, 10, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 30;
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -2;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xddeeff, 0.35);
    fill.position.set(-4, 3, -5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(0, 5, -8);
    scene.add(rim);

    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(P.LED_W / 2, 0, 0.4);
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(14, 28, 0xbbbbbb, 0xdddddd);
    grid.position.set(P.LED_W / 2, 0, 0.4);
    scene.add(grid);

    const isFlat = P.IS_FLAT ?? false;
    const MAT = {
      chord: new THREE.MeshStandardMaterial({
        color: isFlat ? 0x708090 : 0x607090,
        metalness: 0.7,
        roughness: 0.3,
      }),
      diagLine: new THREE.LineBasicMaterial({ color: isFlat ? 0x556070 : 0x455a64 }),
      ledON: new THREE.MeshStandardMaterial({
        color: 0x1a6fce,
        emissive: 0x0a2a6a,
        metalness: 0.1,
        roughness: 0.6,
      }),
      ledOFF: new THREE.MeshStandardMaterial({
        color: 0x2c3e50,
        metalness: 0.2,
        roughness: 0.7,
      }),
      frame: new THREE.LineBasicMaterial({ color: 0x000000 }),
      bar: new THREE.MeshStandardMaterial({
        color: 0x78909c,
        metalness: 0.5,
        roughness: 0.4,
      }),
      tube: new THREE.MeshStandardMaterial({
        color: 0xc0392b,
        metalness: 0.6,
        roughness: 0.35,
      }),
      clamp: new THREE.MeshStandardMaterial({
        color: 0x27ae60,
        metalness: 0.5,
        roughness: 0.4,
      }),
      base: new THREE.MeshStandardMaterial({
        color: 0x444455,
        metalness: 0.4,
        roughness: 0.5,
      }),
      plateBlack: new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.8,
        roughness: 0.2,
      }),
    };

    function cyl(
      r: number,
      h: number,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      axis = "y"
    ) {
      const segs = r > 0.02 ? 12 : 8;
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, h, segs),
        mat as THREE.MeshStandardMaterial
      );
      if (axis === "x") m.rotation.z = Math.PI / 2;
      if (axis === "z") m.rotation.x = Math.PI / 2;
      m.position.set(x, y, z);
      m.castShadow = true;
      scene.add(m);
      return m;
    }
    function bx(
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number
    ) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        mat as THREE.MeshStandardMaterial
      );
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
      return m;
    }
    function lineSegs(pts: number[][], mat: THREE.Material) {
      const geo = new THREE.BufferGeometry().setFromPoints(
        pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
      );
      scene.add(new THREE.LineSegments(geo, mat));
    }

    const QH = P.QH ?? P.QX / 2;
    const trussDepth = isFlat ? P.QX : (P.QX_DEPTH ?? P.QX);
    const zC = P.Z_TC ?? P.Z_TF + trussDepth / 2;
    const Z_TUBE = P.Z_TF - 0.03;

    const showLegs = P.LEG_X.length > 0;
    const basePlate = project.structure.legs?.basePlate ?? true;

    function makeLegQX30(lx: number) {
      const y0 = 0,
        y1 = P.LEG_H;
      const vChords = [
        [lx - QH, zC - QH],
        [lx + QH, zC - QH],
        [lx - QH, zC + QH],
        [lx + QH, zC + QH],
      ];
      vChords.forEach(([x, z]) => cyl(P.CHORD_R, y1, MAT.chord, x, y1 / 2, z));

      const bays = 4;
      const bH = y1 / bays;
      const diagPts: number[][] = [];
      for (let i = 0; i <= bays; i++) {
        const y = y0 + i * bH;
        diagPts.push([lx - QH, y, zC - QH], [lx + QH, y, zC - QH]);
        diagPts.push([lx - QH, y, zC + QH], [lx + QH, y, zC + QH]);
        diagPts.push([lx - QH, y, zC - QH], [lx - QH, y, zC + QH]);
        diagPts.push([lx + QH, y, zC - QH], [lx + QH, y, zC + QH]);
        if (i < bays) {
          const yn = y0 + (i + 1) * bH;
          diagPts.push([lx - QH, y, zC - QH], [lx + QH, yn, zC - QH], [lx + QH, y, zC - QH], [lx - QH, yn, zC - QH]);
          diagPts.push([lx - QH, y, zC + QH], [lx + QH, yn, zC + QH], [lx + QH, y, zC + QH], [lx - QH, yn, zC + QH]);
          diagPts.push([lx - QH, y, zC - QH], [lx - QH, yn, zC + QH], [lx - QH, y, zC + QH], [lx - QH, yn, zC - QH]);
          diagPts.push([lx + QH, y, zC - QH], [lx + QH, yn, zC + QH], [lx + QH, y, zC + QH], [lx + QH, yn, zC - QH]);
        }
      }
      lineSegs(diagPts, MAT.diagLine);

      const zAF = P.Z_TB;
      const zAB = P.Z_TB + P.LEG_ARM;
      const zAM = (zAF + zAB) / 2;
      const armH = P.LEG_ARM;
      const yA0 = 0,
        yA1 = P.QX;
      const aChords = [
        [lx - QH, yA0 + P.CHORD_R],
        [lx + QH, yA0 + P.CHORD_R],
        [lx - QH, yA1 - P.CHORD_R],
        [lx + QH, yA1 - P.CHORD_R],
      ];
      aChords.forEach(([x, y]) => cyl(P.CHORD_R, armH, MAT.chord, x, y, zAM, "z"));

      const aBays = 2;
      const aBZ = armH / aBays;
      const aPts: number[][] = [];
      for (let i = 0; i <= aBays; i++) {
        const z = zAF + i * aBZ;
        aPts.push([lx - QH, yA0, z], [lx + QH, yA0, z]);
        aPts.push([lx - QH, yA1, z], [lx + QH, yA1, z]);
        aPts.push([lx - QH, yA0, z], [lx - QH, yA1, z]);
        aPts.push([lx + QH, yA0, z], [lx + QH, yA1, z]);
        if (i < aBays) {
          const zn = zAF + (i + 1) * aBZ;
          aPts.push([lx - QH, yA0, z], [lx + QH, yA1 / 2, zn], [lx + QH, yA0, z], [lx - QH, yA1 / 2, zn]);
          aPts.push([lx - QH, yA1, z], [lx + QH, yA1 - QH, zn], [lx + QH, yA1, z], [lx - QH, yA1 - QH, zn]);
        }
      }
      lineSegs(aPts, MAT.diagLine);

      if (basePlate) {
        bx(P.QX + 0.04, 0.015, P.LEG_ARM + 0.06, MAT.base, lx, 0.008, zAM);
      }
    }

    function makeLegFX30(lx: number) {
      const y1 = P.LEG_H;
      const halfW = P.QX_DEPTH / 2;
      const zF = P.Z_TF;
      const zB = P.Z_TB;
      const zC = (zF + zB) / 2;
      const xL = lx - halfW;
      const xR = lx + halfW;

      if (basePlate) {
        const bpW = P.BASE_PLATE_W ?? 0.5;
        const bpD = P.BASE_PLATE_D ?? 0.7;
        bx(bpW, 0.02, bpD, MAT.plateBlack, lx, 0.01, zC);
      }

      [[xL, zF], [xR, zF], [xL, zB], [xR, zB]].forEach(([x, z]) =>
        cyl(P.CHORD_R, y1, MAT.chord, x, y1 / 2, z)
      );

      const bays = 4;
      const bH = y1 / bays;
      const diagPts: number[][] = [];
      for (let i = 0; i < bays; i++) {
        const y = i * bH;
        const yn = (i + 1) * bH;
        diagPts.push([xL, y, zF], [xR, yn, zB]);
        diagPts.push([xR, y, zB], [xL, yn, zF]);
        diagPts.push([xR, y, zF], [xL, yn, zB]);
        diagPts.push([xL, y, zB], [xR, yn, zF]);
      }
      lineSegs(diagPts, MAT.diagLine);
    }

    const makeLeg = isFlat ? makeLegFX30 : makeLegQX30;

    if (P.BOT_BAR > 0) {
      bx(P.LED_W, P.BOT_BAR, 0.12, MAT.bar, P.LED_W / 2, P.BOT_BAR / 2, 0);
    }

    for (let col = 0; col < P.CAB_COLS; col++) {
      for (let row = 0; row < P.CAB_ROWS; row++) {
        const x = CAB_W / 2 + col * CAB_W;
        const y = P.BOT_BAR + CAB_H / 2 + row * CAB_H;
        const isDeadRow = row < DEAD_ROWS;
        const isDeadCol =
          col < DEAD_COLS || col >= P.CAB_COLS - DEAD_COLS;
        const mat = isDeadRow || isDeadCol ? MAT.ledOFF : MAT.ledON;
        bx(CAB_W - 0.005, CAB_H - 0.005, P.CAB_D, mat, x, y, 0);
        const fr = new THREE.LineSegments(
          new THREE.EdgesGeometry(
            new THREE.BoxGeometry(CAB_W - 0.005, CAB_H - 0.005, P.CAB_D)
          ),
          MAT.frame
        );
        fr.position.set(x, y, 0);
        scene.add(fr);
      }
    }

    if (showLegs) {
      P.LEG_X.forEach((lx) => makeLeg(lx));
    }

    if (P.LEG_X.length >= 2 && P.TUBE_Y.length > 0) {
      const spanX = P.LEG_X[P.LEG_X.length - 1] - P.LEG_X[0];
      const xMid = (P.LEG_X[0] + P.LEG_X[P.LEG_X.length - 1]) / 2;
      P.TUBE_Y.forEach((ty) => {
        cyl(P.TUBE_R, spanX, MAT.tube, xMid, ty, Z_TUBE, "x");
      });

      P.LEG_X.forEach((lx) => {
        P.TUBE_Y.forEach((ty) => {
          bx(0.065, 0.065, 0.1, MAT.clamp, lx, ty, Z_TUBE);
          bx(0.065, 0.065, 0.1, MAT.clamp, lx, ty, Z_TUBE - 0.06);
        });
      });
    }

    const centerZ = P.Z_TC ?? 0.35;
    const tgt = new THREE.Vector3(
      P.LED_W / 2,
      (P.BOT_BAR + P.LED_H) / 2,
      centerZ
    );
    const wallDiag = Math.sqrt(
      P.LED_W ** 2 + (P.BOT_BAR + P.LED_H) ** 2
    );
    const fovRad = (camera.fov * Math.PI) / 180;
    const fitRadius = wallDiag / (2 * Math.tan(fovRad / 2));
    const r = Math.max(2, Math.min(22, fitRadius * 1.4));
    let sph = { theta: -0.6, phi: 1.05, r };
    let drag = false;
    let rDrag = false;
    let prev = { x: 0, y: 0 };
    let needsRender = true;

    function requestRender() {
      needsRender = true;
    }

    function cam() {
      camera.position.set(
        tgt.x + sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
        tgt.y + sph.r * Math.cos(sph.phi),
        tgt.z + sph.r * Math.sin(sph.phi) * Math.cos(sph.theta)
      );
      camera.lookAt(tgt);
    }
    cam();

    const onMouseUp = () => {
      drag = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!drag) return;
      const dx = (e.clientX - prev.x) * 0.005;
      const dy = (e.clientY - prev.y) * 0.005;
      if (rDrag) {
        tgt.x -= dx * 1.5;
        tgt.y += dy * 1.5;
      } else {
        sph.theta -= dx;
        sph.phi = Math.max(0.05, Math.min(Math.PI - 0.05, sph.phi + dy));
      }
      prev = { x: e.clientX, y: e.clientY };
      cam();
      requestRender();
    };

    const el = renderer.domElement;
    el.addEventListener("mousedown", (e) => {
      drag = true;
      rDrag = e.button === 2;
      prev = { x: e.clientX, y: e.clientY };
    });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    el.addEventListener("wheel", (e) => {
      sph.r = Math.max(1.5, Math.min(22, sph.r + e.deltaY * 0.005));
      cam();
      requestRender();
    });

    function animate() {
      requestAnimationFrame(animate);
      if (needsRender) {
        renderer.render(scene, camera);
        needsRender = false;
      }
    }
    animate();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const nW = container.clientWidth || window.innerWidth;
        const nH = container.clientHeight || 400;
        camera.aspect = nW / nH;
        camera.updateProjectionMatrix();
        renderer.setSize(nW, nH);
        requestRender();
      }, 100);
    });
    ro.observe(container);

    return () => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      clearTimeout(resizeTimer);
      ro.disconnect();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      Object.values(MAT).forEach((m) => m.dispose());
      floorGeo.dispose();
      floorMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [project]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[400px] bg-gray-100 rounded overflow-hidden"
      style={{ minHeight: 400 }}
    />
  );
}
