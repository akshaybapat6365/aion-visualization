import * as THREE from 'three';

export function createPleromaCrown(viz, { pleroma, aionBlue }) {
    viz.pleromaGroup = new THREE.Group();
    viz.pleromaGroup.position.set(-1.15, 4.95, -0.35);
    viz.pleromaRings = [];
    viz.pleromaSpokes = [];
    viz.aeonChains = [];

    for (let i = 0; i < 5; i++) {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.52 + i * 0.38, 0.006 + i * 0.0015, 8, 120),
            new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? pleroma : aionBlue,
                transparent: true,
                opacity: 0.08,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        ring.rotation.z = i * Math.PI / 9;
        viz.pleromaGroup.add(ring);
        viz.pleromaRings.push(ring);
    }

    viz.pleromaSource = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.18, 1),
        new THREE.MeshBasicMaterial({
            color: pleroma,
            transparent: true,
            opacity: 0.78,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
    );
    viz.pleromaGroup.add(viz.pleromaSource);

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const spoke = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0.02),
                new THREE.Vector3(Math.cos(angle) * 2.45, Math.sin(angle) * 1.7, -0.06),
            ]),
            new THREE.LineBasicMaterial({
                color: i % 2 === 0 ? pleroma : aionBlue,
                transparent: true,
                opacity: 0.055,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        viz.pleromaGroup.add(spoke);
        viz.pleromaSpokes.push(spoke);
    }

    [
        new THREE.Vector3(-2.7, 1.1, 0.2),
        new THREE.Vector3(-0.65, -0.25, 0.35),
        new THREE.Vector3(1.1, 0.85, -0.15),
        new THREE.Vector3(2.75, -1.35, 0.1),
    ].forEach((target, index) => {
        const points = [];
        for (let i = 0; i <= 38; i++) {
            const p = i / 38;
            const wave = Math.sin(p * Math.PI * 2 + index * 0.8) * (0.35 + index * 0.03);
            points.push(new THREE.Vector3(
                THREE.MathUtils.lerp(-1.15, target.x, p) + wave * 0.18,
                THREE.MathUtils.lerp(4.95, target.y, p),
                THREE.MathUtils.lerp(-0.35, target.z, p) + Math.cos(p * Math.PI + index) * 0.12
            ));
        }
        const chain = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({
                color: index % 2 === 0 ? pleroma : aionBlue,
                transparent: true,
                opacity: 0.055,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        viz.quaternioGroup.add(chain);
        viz.aeonChains.push(chain);
    });

    viz.quaternioGroup.add(viz.pleromaGroup);
}

export function createQuaternioSeal(viz, { pleroma, aionBlue, quadColors }) {
    viz.quaternioSealGroup = new THREE.Group();
    viz.quaternioDiamonds = [];
    [2.55, 1.55].forEach((radius, index) => {
        const z = 0.05 + index * 0.04;
        const points = [
            new THREE.Vector3(0, radius, z),
            new THREE.Vector3(radius, 0, z),
            new THREE.Vector3(0, -radius, z),
            new THREE.Vector3(-radius, 0, z),
            new THREE.Vector3(0, radius, z),
        ];
        const diamond = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({
                color: index === 0 ? pleroma : aionBlue,
                transparent: true,
                opacity: 0.08,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        viz.quaternioSealGroup.add(diamond);
        viz.quaternioDiamonds.push(diamond);
    });

    viz.quaternioPetals = [];
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const points = [];
        for (let j = 0; j <= 36; j++) {
            const p = j / 36;
            const spread = 0.55 * Math.sin(p * Math.PI);
            const radius = THREE.MathUtils.lerp(0.65, 2.85, p);
            points.push(new THREE.Vector3(
                Math.cos(angle) * radius + Math.cos(angle + Math.PI / 2) * spread,
                Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * spread,
                -0.05 + p * 0.08
            ));
        }
        const petal = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({
                color: quadColors[i],
                transparent: true,
                opacity: 0.09,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        viz.quaternioSealGroup.add(petal);
        viz.quaternioPetals.push(petal);
    }

    viz.quaternioGroup.add(viz.quaternioSealGroup);
}

export function createReturnArc(viz, { pleroma, aionBlue }) {
    viz.returnCurvePoints = [];
    for (let i = 0; i <= 64; i++) {
        const p = i / 64;
        const angle = -Math.PI * 0.9 + p * Math.PI * 1.55;
        const radius = 3.4 - Math.sin(p * Math.PI) * 0.55;
        viz.returnCurvePoints.push(new THREE.Vector3(
            Math.cos(angle) * radius + 0.35,
            Math.sin(angle) * radius - 0.25,
            -0.4 + Math.sin(p * Math.PI * 2) * 0.3
        ));
    }

    viz.returnArc = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(viz.returnCurvePoints),
        new THREE.LineBasicMaterial({
            color: aionBlue,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
    );
    viz.paradoxGroup.add(viz.returnArc);

    viz.returnSparks = [];
    for (let i = 0; i < 9; i++) {
        const spark = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.055 + (i % 3) * 0.018, 0),
            new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? pleroma : aionBlue,
                transparent: true,
                opacity: 0.16,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        viz.paradoxGroup.add(spark);
        viz.returnSparks.push(spark);
    }
}
