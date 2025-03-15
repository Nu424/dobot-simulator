import { DobotMagicianSimulator } from "./DobotMagicianSimulator";

const rootElement = document.getElementById("root") as HTMLDivElement;
const simulator = new DobotMagicianSimulator(rootElement);
simulator.init();

document.addEventListener("contextmenu", async (e) => {
    e.preventDefault();
    simulator.updateArmByXYZ({ x: 200, y: 0, z: 0 });
    await simulator.updateArmByXYZAnimation({ x: 200, y: 100, z: 0 }, 100);

    // simulator.updateArmByXYZ({ x: 200, y: 0, z: 0 });
    // if (simulator.arm2Mesh && simulator.arm1Mesh) {
    //     simulator.arm1Mesh.rotation.x = 30 * Math.PI / 180;
    //     simulator.arm2Mesh.rotation.x = 30 * Math.PI / 180;
    // }
});
