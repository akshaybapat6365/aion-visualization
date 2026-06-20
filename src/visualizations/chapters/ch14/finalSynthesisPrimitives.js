import * as THREE from 'three';

function lineMaterial(color, opacity) {
    return new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
}

function pointOnPath(points, phase) {
    const index = Math.min(points.length - 1, Math.max(0, Math.floor(phase * (points.length - 1))));
    return points[index] || points[0];
}

export function createFinalSynthesisField(viz, { gold, cyan, green, red, white }) {
    viz.finalSynthesisGroup = new THREE.Group();
    viz.temenosRings = [];
    viz.synthesisPetals = [];
    viz.memoryBridgeLines = [];
    viz.axisBridgeLines = [];
    viz.pathSparks = [];
    viz.individuationPathPoints = [];

    const ringSpecs = [
        { radius: 7.8, tube: 0.014, color: gold, opacity: 0.06, rotation: [Math.PI / 2, 0, 0], scale: [1, 0.46, 1] },
        { radius: 6.2, tube: 0.012, color: cyan, opacity: 0.055, rotation: [Math.PI / 2, Math.PI / 4, 0], scale: [1, 0.34, 1] },
        { radius: 4.8, tube: 0.01, color: green, opacity: 0.048, rotation: [Math.PI / 2, -Math.PI / 4, 0], scale: [1, 0.52, 1] },
        { radius: 3.35, tube: 0.009, color: white, opacity: 0.038, rotation: [Math.PI / 2, 0, Math.PI / 2], scale: [1, 0.38, 1] },
    ];

    ringSpecs.forEach((spec, index) => {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(spec.radius, spec.tube, 8, 160),
            new THREE.MeshBasicMaterial({
                color: spec.color,
                transparent: true,
                opacity: spec.opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        ring.rotation.set(...spec.rotation);
        ring.scale.set(...spec.scale);
        ring.userData.baseRotation = ring.rotation.clone();
        ring.userData.baseScale = ring.scale.clone();
        ring.userData.index = index;
        viz.finalSynthesisGroup.add(ring);
        viz.temenosRings.push(ring);
    });

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const points = [];
        for (let step = 0; step <= 44; step++) {
            const p = step / 44;
            const spread = Math.sin(p * Math.PI) * (2.4 + (i % 2) * 0.65);
            points.push(new THREE.Vector3(
                Math.cos(angle) * spread,
                THREE.MathUtils.lerp(-7.2, 7.2, p),
                Math.sin(angle) * spread * 0.62
            ));
        }
        const petal = new THREE.Line(pointsToGeometry(points), lineMaterial(i % 2 ? cyan : gold, 0.045));
        petal.userData.index = i;
        viz.finalSynthesisGroup.add(petal);
        viz.synthesisPetals.push(petal);
    }

    const memoryColors = [white, cyan, red, gold, green, cyan];
    for (let i = 0; i < 6; i++) {
        const phase = i / 6;
        const angle = phase * Math.PI * 2 - Math.PI / 2;
        const y = THREE.MathUtils.lerp(-5.8, 5.8, phase);
        const outer = new THREE.Vector3(
            Math.cos(angle) * 6.35,
            y,
            Math.sin(angle) * 3.9
        );
        const mid = new THREE.Vector3(
            Math.cos(angle + 0.38) * 2.15,
            y * 0.34,
            Math.sin(angle + 0.38) * 1.5
        );
        const curve = new THREE.CatmullRomCurve3([
            outer,
            mid,
            new THREE.Vector3(0, 0, 0),
        ]);
        const line = new THREE.Line(
            pointsToGeometry(curve.getPoints(44)),
            lineMaterial(memoryColors[i], 0.05)
        );
        line.userData.index = i;
        viz.finalSynthesisGroup.add(line);
        viz.memoryBridgeLines.push(line);
    }

    [
        { from: 6, to: 2, color: gold },
        { from: 2, to: -2, color: cyan },
        { from: -2, to: -6, color: red },
        { from: -6, to: 6, color: green },
    ].forEach((bridge, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const points = [
            new THREE.Vector3(side * 2.9, bridge.from, -0.2),
            new THREE.Vector3(side * 0.85, (bridge.from + bridge.to) / 2, 0.62),
            new THREE.Vector3(-side * 2.9, bridge.to, -0.2),
        ];
        const curve = new THREE.CatmullRomCurve3(points);
        const line = new THREE.Line(
            pointsToGeometry(curve.getPoints(36)),
            lineMaterial(bridge.color, 0.055)
        );
        line.userData.index = index;
        viz.finalSynthesisGroup.add(line);
        viz.axisBridgeLines.push(line);
    });

    for (let i = 0; i <= 140; i++) {
        const p = i / 140;
        const angle = -Math.PI * 0.82 + p * Math.PI * 3.35;
        const radius = 5.6 + Math.sin(p * Math.PI) * 1.35;
        viz.individuationPathPoints.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            THREE.MathUtils.lerp(-6.85, 6.85, p),
            Math.sin(angle) * radius * 0.7
        ));
    }

    viz.individuationPath = new THREE.Line(
        pointsToGeometry(viz.individuationPathPoints),
        lineMaterial(green, 0.065)
    );
    viz.finalSynthesisGroup.add(viz.individuationPath);

    for (let i = 0; i < 12; i++) {
        const spark = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.07 + (i % 3) * 0.018, 0),
            new THREE.MeshBasicMaterial({
                color: i % 3 === 0 ? gold : i % 3 === 1 ? green : cyan,
                transparent: true,
                opacity: 0.16,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        const point = pointOnPath(viz.individuationPathPoints, i / 11);
        if (point) spark.position.copy(point);
        viz.finalSynthesisGroup.add(spark);
        viz.pathSparks.push(spark);
    }

    viz.selfLens = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.54, 2),
        new THREE.MeshBasicMaterial({
            color: gold,
            transparent: true,
            opacity: 0.18,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
    );
    viz.finalSynthesisGroup.add(viz.selfLens);

    viz.mainGroup.add(viz.finalSynthesisGroup);
}

export function updateFinalSynthesisField(viz, {
    t,
    motionScale,
    reducedMotion,
    gatherFocus,
    axisFocus,
    aeonFocus,
}) {
    viz.finalSynthesisGroup.rotation.y = -t * 0.009 * motionScale + aeonFocus * 0.1;
    viz.finalSynthesisGroup.rotation.z = Math.sin(t * 0.035 * motionScale) * 0.025;
    viz.temenosRings?.forEach((ring, index) => {
        const drift = reducedMotion ? 0 : t * (0.01 + index * 0.003) * (index % 2 ? -1 : 1);
        ring.rotation.copy(ring.userData.baseRotation);
        ring.rotation.z += drift + axisFocus * 0.08;
        ring.scale.copy(ring.userData.baseScale);
        ring.scale.multiplyScalar(1 + gatherFocus * 0.025 + axisFocus * 0.035 + aeonFocus * 0.02);
        ring.material.opacity = 0.02 + gatherFocus * 0.045 + axisFocus * 0.035 + aeonFocus * 0.04;
    });
    viz.synthesisPetals?.forEach((petal, index) => {
        petal.material.opacity = 0.025 + gatherFocus * 0.07 + axisFocus * 0.045 + (index % 2 ? aeonFocus * 0.018 : 0);
    });
    viz.memoryBridgeLines?.forEach((line, index) => {
        const phaseDrift = reducedMotion ? 0 : Math.sin(t * 0.035 * motionScale + index) * 0.012;
        line.rotation.z = phaseDrift;
        line.material.opacity = 0.028 + gatherFocus * 0.15 + axisFocus * 0.045 + aeonFocus * 0.04;
    });
    viz.axisBridgeLines?.forEach((line, index) => {
        line.material.opacity = 0.03 + axisFocus * 0.23 + gatherFocus * 0.024 + (index === 3 ? aeonFocus * 0.07 : 0);
    });
    if (viz.individuationPath) {
        viz.individuationPath.material.opacity = 0.055 + aeonFocus * 0.4 + gatherFocus * 0.04;
    }
    viz.pathSparks?.forEach((spark, index) => {
        const phase = reducedMotion ? index / Math.max(1, viz.pathSparks.length - 1) : (t * 0.035 + index / viz.pathSparks.length) % 1;
        const pointIndex = Math.min(viz.individuationPathPoints.length - 1, Math.floor(phase * (viz.individuationPathPoints.length - 1)));
        const pathPoint = viz.individuationPathPoints[pointIndex] || viz.individuationPathPoints[0];
        if (pathPoint) spark.position.copy(pathPoint);
        spark.rotation.y = (reducedMotion ? 0 : t * 0.22) + index;
        spark.material.opacity = 0.04 + aeonFocus * 0.36 + (phase > 0.72 ? gatherFocus * 0.08 : 0);
        const sparkPulse = reducedMotion ? 0 : Math.sin(t * 0.38 + index) * 0.08;
        spark.scale.setScalar(0.78 + aeonFocus * 0.82 + sparkPulse);
    });
    if (viz.selfLens) {
        viz.selfLens.rotation.y = reducedMotion ? 0 : t * 0.18;
        viz.selfLens.rotation.x = reducedMotion ? 0 : t * 0.11;
        viz.selfLens.material.opacity = 0.14 + gatherFocus * 0.05 + axisFocus * 0.34 + aeonFocus * 0.16;
        viz.selfLens.scale.setScalar(0.85 + axisFocus * 0.42 + aeonFocus * 0.18);
    }
}

function pointsToGeometry(points) {
    return new THREE.BufferGeometry().setFromPoints(points);
}
