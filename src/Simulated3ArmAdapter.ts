import { DMSWrapper } from "./DMSWrapper";

export class Simulated3ArmAdapter {
    private ws: WebSocket;
    private simulator: DMSWrapper;

    constructor(ws: WebSocket, simulator: DMSWrapper) {
        // ---値の初期化
        this.ws = ws;
        this.simulator = simulator;

        // ---WebSocketのイベント   
        this.ws.addEventListener("message", async (event) => {
            console.log(event.data);
            const wsDataJson = JSON.parse(event.data);
            /*
            {
                "command": "",
                "request_id": "",
                "position": {
                    "x": 0,
                    "y": 0,
                    "z": 0
                },
                "angle": {
                    "j1": 0,
                    "j2": 0,
                    "j3": 0
                },
                "speed": 0,
                "safe_z": 0,
                "move_methods": "",
                "move_speeds": 0,

            }
            */
            const command = wsDataJson.command;
            const request_id = wsDataJson.request_id;
            if (command === "go_home") {
                await this.simulator.go_home();
                this.ws.send(JSON.stringify({
                    command: "go_home",
                    request_id: request_id,
                    position: this.simulator.get_position(),
                    angle: this.simulator.get_angle()
                }));
            } else if (command === "reset_alarm") {
                await this.simulator.reset_alarm();
                this.ws.send(JSON.stringify({
                    command: "reset_alarm",
                    request_id: request_id,
                    position: this.simulator.get_position(),
                    angle: this.simulator.get_angle()
                }));
            } else if (command === "get_position") {
                const position_data = this.simulator.get_position();
                this.ws.send(JSON.stringify({
                    command: "get_position",
                    request_id: request_id,
                    position: position_data
                }));
            } else if (command === "get_angle") {
                const angle_data = this.simulator.get_angle();
                this.ws.send(JSON.stringify({
                    command: "get_angle",
                    request_id: request_id,
                    angle: angle_data
                }));
            } else if (command === "move_arm") {
                const position_arm = wsDataJson.position;
                const speed_arm = wsDataJson.speed;
                await this.simulator.move_arm(position_arm, speed_arm);
                this.ws.send(JSON.stringify({
                    command: "move_arm",
                    request_id: request_id,
                    position: position_arm,
                    speed: speed_arm
                }));
            } else if (command === "move_arm_L") {
                const position_L = wsDataJson.position;
                const speed_L = wsDataJson.speed;
                await this.simulator.move_arm_L(position_L, speed_L);
                this.ws.send(JSON.stringify({
                    command: "move_arm_L",
                    request_id: request_id,
                    position: position_L,
                    speed: speed_L
                }));
            } else if (command === "move_arm_J") {
                const angle_J = wsDataJson.angle;
                const speed_J = wsDataJson.speed;
                await this.simulator.move_arm_J(angle_J, speed_J);
                this.ws.send(JSON.stringify({
                    command: "move_arm_J",
                    request_id: request_id,
                    angle: angle_J,
                    speed: speed_J
                }));
            } else if (command === "move_arm_safe") {
                const target_position = wsDataJson.target_position;
                const safe_z = wsDataJson.safe_z;
                const speed = wsDataJson.speed;
                const move_methods = wsDataJson.move_methods;
                const move_speeds = wsDataJson.move_speeds;
                await this.simulator.move_arm_safe(target_position, safe_z, speed, move_methods, move_speeds);
                this.ws.send(JSON.stringify({
                    command: "move_arm_safe",
                    request_id: request_id,
                    target_position: target_position,
                    safe_z: safe_z,
                    speed: speed,
                    move_methods: move_methods,
                    move_speeds: move_speeds
                }));
            } else {
                console.log("unknown command");
            }
        });

        this.ws.addEventListener("open", () => {
            console.log("connected");
        });
    }
}