/*
# DMSWrapper.ts
DobotMagicianSimulatorのラッパークラス。より使いやすいAPIを提供する

## 使い方

```ts
// ---初期化
// ↓シミュレータの表示を行うためのHTML要素を指定
const rootElement = document.getElementById("root") as HTMLDivElement;
const simulator = new DMSWrapper(rootElement);
await simulator.initiate();

// ---アームの移動
await simulator.move_arm({ x: 100, y: 100, z: 100 }, 100);
await simulator.move_arm_L({ x: 100, y: 100, z: 100 }, 100);
await simulator.move_arm_J({ j1: 100, j2: 100, j3: 100 }, 100);
await simulator.move_arm_safe({ x: 100, y: 100, z: 100 }, 100, 100);

// ---アームの位置取得
const position = simulator.get_position();
const angle = simulator.get_angle();

// ---アームの初期位置に戻る
await simulator.go_home();

// ---アラームのリセット
await simulator.reset_alarm();
```
*/

import { DobotMagicianSimulator, Position, Angle } from "./DobotMagicianSimulator";

// Positionのコピーヘルパー関数
function copyPosition(
    pos: Position,
    x?: number,
    y?: number,
    z?: number,
    isRelative: boolean = true
): Position {
    if (isRelative) {
        return {
            x: x !== undefined ? pos.x + x : pos.x,
            y: y !== undefined ? pos.y + y : pos.y,
            z: z !== undefined ? pos.z + z : pos.z,
        };
    } else {
        return {
            x: x !== undefined ? x : pos.x,
            y: y !== undefined ? y : pos.y,
            z: z !== undefined ? z : pos.z,
        };
    }
}

export class DMSWrapper {
    private simulator: DobotMagicianSimulator;
    home_position: Position = { x: 200, y: 0, z: 0 };

    constructor(rootElement: HTMLElement) {
        this.simulator = new DobotMagicianSimulator(rootElement);
    }

    // ----------
    // ---初期化関係
    // ----------
    public async initiate() {
        this.simulator.init();
    }

    public async go_home() {
        await this.simulator.animateArmByXYZ(this.home_position, 100);
    }

    public async reset_alarm() {
        // シミュレータでは実際のアラームはないため、何もしない
        return;
    }

    // ----------
    // ---位置取得
    // ----------
    public get_position(): Position {
        return this.simulator.xyz;
    }

    public get_angle(): Angle {
        return this.simulator.dobotAngles;
    }

    // ----------
    // ---アーム移動
    // ----------
    public async move_arm(position: Position, speed: number) {
        await this.simulator.animateArmByXYZ(position, speed);
    }

    public async move_arm_L(position: Position, speed: number) {
        // シミュレータでは通常の移動と同じ挙動
        await this.simulator.animateArmByXYZ(position, speed);
    }

    public async move_arm_J(angle: Angle, speed: number) {
        await this.simulator.animateArmByDobotAngles(angle, speed);
    }

    /**
     * 安全な高さ(クリアランス)へ移動してから、指定した座標に移動させる
     * 「開始位置→開始位置の上→終了位置の上→終了位置」の順に移動する
     * 
     * @param target_position 移動終了座標
     * @param safe_z 安全な高さ(クリアランス)
     * @param speed 移動速度
     * @param move_methods 移動方法のリスト ["l": move_arm_L(), "n": move_arm()]
     * @param move_speeds 各移動の速度のリスト（指定しない場合はspeedを使用）
     */
    public async move_arm_safe(
        target_position: Position,
        safe_z: number,
        speed: number,
        move_methods: Array<"l" | "n"> = ["l", "n", "l"],
        move_speeds?: number[]
    ): Promise<void> {
        // 開始位置→開始位置の上。デフォルトはmove_arm_L()で移動
        const start_position = this.get_position();
        let next_position = copyPosition(start_position, undefined, undefined, safe_z, false);
        // console.log(next_position);
        const next_speed1 = move_speeds?.[0] ?? speed;
        if (move_methods[0] === "l") {
            await this.move_arm_L(next_position, next_speed1);
        } else {
            await this.move_arm(next_position, next_speed1);
        }

        // 開始位置の上→終了位置の上。デフォルトはmove_arm()で移動
        next_position = copyPosition(target_position, undefined, undefined, safe_z, false);
        // console.log(next_position);
        const next_speed2 = move_speeds?.[1] ?? speed;
        if (move_methods[1] === "l") {
            await this.move_arm_L(next_position, next_speed2);
        } else {
            await this.move_arm(next_position, next_speed2);
        }

        // 終了位置の上→終了位置。デフォルトはmove_arm_L()で移動
        const next_speed3 = move_speeds?.[2] ?? speed;
        if (move_methods[2] === "l") {
            await this.move_arm_L(target_position, next_speed3);
        } else {
            await this.move_arm(target_position, next_speed3);
        }
    }
}
