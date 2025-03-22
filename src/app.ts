// ----------
// ---DMSWrapperのコード
// ----------
import { DMSWrapper } from "./DMSWrapper";

const rootElement = document.getElementById("root") as HTMLDivElement;
const simulator = new DMSWrapper(rootElement);
(async () => {
    await simulator.initiate();
    await simulator.go_home();
})();

document.addEventListener("contextmenu", async (e) => {
    e.preventDefault();
    const randomPos = {
        x: 200 + Math.random() * 100,
        y: Math.random() * 200 - 100,
        z: Math.random() * 100,
    }
    console.log(randomPos);
    // await simulator.move_arm(randomPos, 100);
    await simulator.move_arm_safe(randomPos, 100, 100);
    console.log("finished")
});
document.addEventListener("dblclick", async (e) => {
    e.preventDefault();
    await simulator.go_home();
});

// ----------
// ---DobotMagicianSimulatorのコード
// ----------
// import { DobotMagicianSimulator } from "./DobotMagicianSimulator";

// const rootElement = document.getElementById("root") as HTMLDivElement;
// // const simulator = new DobotMagicianSimulator(rootElement);
// // simulator.init();

// document.addEventListener("contextmenu", async (e) => {
//     e.preventDefault();
//     // ---逆運動学のテスト
//     // const ikTargetPos = { x: 200, y: 0, z: 0 }
//     // const ikResult = simulator.calcInverseKinematics(ikTargetPos)
//     // console.log(ikResult)
//     // simulator.updateArmByXYZ(ikTargetPos);

//     // ---順運動学のテスト
//     // const fkTargetAngles = { j1: 0, j2: 25.403778, j3: 56.054351 }
//     // const fkResult = simulator.calcForwardKinematics(fkTargetAngles)
//     // console.log(fkResult)
//     // simulator.updateArmByDobotAngles(fkTargetAngles);

//     // ---アニメーションのテスト
//     await simulator.animateArmByXYZ({ x: 200, y: 100, z: 0 }, 100);
//     console.log("finished")

//     // simulator.updateArmByXYZ({ x: 200, y: 0, z: 0 });
//     // if (simulator.arm2Mesh && simulator.arm1Mesh) {
//     //     simulator.arm1Mesh.rotation.x = 30 * Math.PI / 180;
//     //     simulator.arm2Mesh.rotation.x = 30 * Math.PI / 180;
//     // }
// });
