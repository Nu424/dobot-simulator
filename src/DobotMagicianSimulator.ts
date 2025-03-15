import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface Angle {
    j1: number;
    j2: number;
    j3: number;
}

type ArmAngleSuccess = {
    success: true;
    xyz: Position;
    rawAngles: Angle;
    threejsAngles: Angle;
    dobotAngles: Angle;
}

type ArmAngleFailure = {
    success: false;
}

type ArmAngleResult = ArmAngleSuccess | ArmAngleFailure;

export class DobotMagicianSimulator {
    // ---基本的なプロパティ
    rootElement: HTMLElement;
    // ---Threejsのオブジェクト
    scene: THREE.Scene | undefined;
    camera: THREE.PerspectiveCamera | undefined;
    renderer: THREE.WebGLRenderer | undefined;
    controls: OrbitControls | undefined;
    // ---ロボットアーム用メッシュ
    baseMesh: THREE.Mesh | undefined;
    arm1Mesh: THREE.Mesh | undefined;
    arm2Mesh: THREE.Mesh | undefined;
    arm3Mesh: THREE.Mesh | undefined;
    endEffectorMesh: THREE.Mesh | undefined;

    // ---ロボットアームの定数(mm単位)
    L0 = 0;  // 地面 〜 土台
    L1 = 135;  // 土台 〜 関節1
    L2 = 147;  // 関節1 〜 関節2
    L3 = 60;  // 関節2 〜 先端

    // ---ロボットアームのパラメータ
    xyz: Position = { x: 0, y: 0, z: 0 };
    threejsAngles: Angle = { j1: 0, j2: 0, j3: 0 };
    dobotAngles: Angle = { j1: 0, j2: 0, j3: 0 };

    constructor(rootElement: HTMLElement) {
        this.rootElement = rootElement;
    }
    public init() {
        // ----------
        // ---シーンの作成
        // ----------
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xeeeeee);
        // ---カメラの作成
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(6, 6, 10);
        // ---レンダラーの作成
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.rootElement.appendChild(this.renderer.domElement);
        // ---コントロールの作成
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.target.set(0, 2, 0);
        // ---そのほか
        // 環境光
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        // ちょっとだけ方向光
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(10, 10, 10);
        this.scene.add(dirLight);
        // 地面
        const gridHelper = new THREE.GridHelper(20, 20);
        this.scene.add(gridHelper);

        // ----------
        // ---ロボットアーム用メッシュの作成(シンプルな箱)
        // ----------
        const lengthRatio = 100
        // 1) ベース（土台）: 回転中心
        const baseGeo = new THREE.BoxGeometry(1, 0.5, 1);
        const baseMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
        this.baseMesh = new THREE.Mesh(baseGeo, baseMat);
        this.baseMesh.position.set(0, 0.25, 0); // 地面から少し上
        this.scene.add(this.baseMesh);

        // 2) アーム1: 長さ L1 の箱 (縦長に見せたいなら y軸方向拡大等, ここでは z方向として仮想)
        const arm1Geo = new THREE.BoxGeometry(0.3, 0.3, this.L1 / lengthRatio);
        arm1Geo.translate(0, 0, this.L1 / lengthRatio / 2); // ジオメトリをZ方向に L1/2 だけ平行移動
        const arm1Mat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.arm1Mesh = new THREE.Mesh(arm1Geo, arm1Mat);
        // // デフォルトで中心がメッシュの中央にあるので、先端が (0,0,L1/2) になるようにする
        // // あとで回転するときの基準に合わせる
        // this.arm1Mesh.position.set(0, 0, L1 / 2);
        // 回転の起点をリンクの根元に合わせたため、Mesh の位置は(0,0,0)
        this.arm1Mesh.position.set(0, 0, 0);
        this.baseMesh.add(this.arm1Mesh);


        // 3) アーム2: 長さ L2 の箱
        const arm2Geo = new THREE.BoxGeometry(0.3, 0.3, this.L2 / lengthRatio);
        arm2Geo.translate(0, 0, this.L2 / lengthRatio / 2);
        const arm2Mat = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        this.arm2Mesh = new THREE.Mesh(arm2Geo, arm2Mat);
        // // 肩関節(arm1の先)の位置がローカル(0,0,L1/2)付近にあるので、そこを回転中心にしたい場合は
        // // this.arm2Mesh の位置を z方向に L2/2 ずらして取り付け
        // this.arm2Mesh.position.set(0, 0, L2 / 2);
        // アーム1 先端 (Z=L1) に取り付けるので position は (0,0,L1)
        this.arm2Mesh.position.set(0, 0, this.L1 / lengthRatio);
        this.arm1Mesh.add(this.arm2Mesh);

        // 4) エンドエフェクタ: 長さ L3 の箱（あまり長くしない）
        const endGeo = new THREE.BoxGeometry(0.2, 0.2, this.L3 / lengthRatio);
        endGeo.translate(0, 0, this.L3 / lengthRatio / 2);
        const endMat = new THREE.MeshPhongMaterial({ color: 0x0000ff });
        this.endEffectorMesh = new THREE.Mesh(endGeo, endMat);
        // endEffectorMesh.position.set(0, 0, L3 / 2);
        // アーム2 先端 (Z=L2) に取り付けるので position は (0,0,L2)
        this.endEffectorMesh.position.set(0, 0, this.L2 / lengthRatio);
        this.arm2Mesh.add(this.endEffectorMesh);

        // ----------
        // ---アニメーション開始
        // ----------
        this.animate();
    }

    public animate() {
        if (!this.scene || !this.camera || !this.renderer || !this.controls) return;
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }

    /**
     * アーム座標を、XYZから更新する関数
     * @param pos エンドエフェクタの位置（Positionオブジェクト）
     * @note 主に担当するのは、アーム座標の更新。実際のメッシュ移動はmoveArmByThree()で行う
     */
    public updateArmByXYZ(pos: Position) {
        const result = this.calcInverseKinematics(pos);
        console.log(result)
        if (result.success) {
            this.xyz = result.xyz;
            this.threejsAngles = result.threejsAngles;
            this.dobotAngles = result.dobotAngles;
            this.moveArmByThreejsAngles();
        }
    }

    public async updateArmByXYZAnimation(targetPos: Position, speed: number, finishThreshold: number = 5) {
        // speed: mm/sを想定する
        // ---現在の位置から目標位置までのベクトルを作成する
        const startToEndVector = {
            x: targetPos.x - this.xyz.x,
            y: targetPos.y - this.xyz.y,
            z: targetPos.z - this.xyz.z,
        }
        let rafId: number | null = null;
        let prevRafTime = performance.now();
        const updateArmByXYZAnimationRaf = () => {
            // ---前のrafからの経過時間を取得
            const now = performance.now();
            const deltaTime = (now - prevRafTime) / 1000; // 秒に変換
            if (deltaTime < 0.03) {
                // ---次のアニメーションフレームをリクエスト
                rafId = requestAnimationFrame(updateArmByXYZAnimationRaf);
                return;
            }
            // ---移動すべき距離を計算
            const moveDistance = speed * deltaTime
            // ---移動ベクトルを算出する
            const totalMoveVectorSize = Math.sqrt(
                startToEndVector.x ** 2 + startToEndVector.y ** 2 + startToEndVector.z ** 2
            );
            const moveVector = {
                x: startToEndVector.x * (moveDistance / totalMoveVectorSize),
                y: startToEndVector.y * (moveDistance / totalMoveVectorSize),
                z: startToEndVector.z * (moveDistance / totalMoveVectorSize),
            }
            // ---現在の位置を更新
            const newXYZ = {
                x: this.xyz.x + moveVector.x,
                y: this.xyz.y + moveVector.y,
                z: this.xyz.z + moveVector.z,
            }
            // ---現在の位置を更新
            this.updateArmByXYZ(newXYZ);
            // ---目標位置に到達したら終了
            const distanceToTarget = Math.sqrt(
                (targetPos.x - newXYZ.x) ** 2 + (targetPos.y - newXYZ.y) ** 2 + (targetPos.z - newXYZ.z) ** 2
            );
            // console.log(deltaTime, moveDistance, totalMoveVectorSize, moveVector, newXYZ, distanceToTarget)
            if (distanceToTarget < finishThreshold && rafId) {
                cancelAnimationFrame(rafId);
                console.log("Finished");
                this.updateArmByXYZ(targetPos);
                return;
            }

            prevRafTime = now;
            rafId = requestAnimationFrame(updateArmByXYZAnimationRaf);
        }
        updateArmByXYZAnimationRaf();
    }

    public moveArmByThreejsAngles() {
        if (!this.baseMesh || !this.arm1Mesh || !this.arm2Mesh || !this.endEffectorMesh) return;
        // ---メッシュの回転
        this.baseMesh.rotation.y = this.threejsAngles.j1 * Math.PI / 180;
        this.arm1Mesh.rotation.x = this.threejsAngles.j2 * Math.PI / 180;
        this.arm2Mesh.rotation.x = this.threejsAngles.j3 * Math.PI / 180;
        const RawA2 = -this.threejsAngles.j2;
        const RawA3 = 180 - this.threejsAngles.j3;
        this.endEffectorMesh.rotation.x = -(180 - (RawA2 + RawA3)) * Math.PI / 180;
        // this.endEffectorMesh.rotation.x = (30) * Math.PI / 180;
    }

    // ----------
    // ---運動学の計算
    // ----------

    /**
     * Dobot Magicianのアーム角度を計算する関数
     * @param pos エンドエフェクタの位置（Positionオブジェクト）
     */
    calcInverseKinematics(pos: Position): ArmAngleResult {
        const { x, y, z } = pos;
        // エンドエフェクタ位置からX-Y平面上の距離
        const distanceXY = Math.sqrt(x * x + y * y);
        // エンドエフェクタの突き出し部分を差し引いた、実際のアーム部分の長さ
        const l = distanceXY - this.L3;

        // X-Y平面上のアーム長が十分でなければ計算不能
        if (l <= this.L3) {
            return { success: false };
        }

        // アーム基点からエンドエフェクタ先端までの直線距離
        const ld = Math.sqrt(l * l + Math.pow(z - this.L0, 2));

        // ldが正でかつ、アーム1とアーム2の長さの合計未満である必要がある
        if (ld <= 0 || ld >= (this.L1 + this.L2)) {
            return { success: false };
        }

        // 主軸の回転角度（X-Y平面上の角度）
        const th1 = Math.atan2(y, x);

        // 基点から先端までの仰角（水平からの角度）
        const phi = Math.atan2(z - this.L0, l);

        // アーム1の角度計算：余弦定理を利用
        let cosVal = (ld * ld + this.L1 * this.L1 - this.L2 * this.L2) / (2.0 * ld * this.L1);
        // 数値誤差対策で[-1, 1]にクランプ
        cosVal = Math.max(Math.min(cosVal, 1.0), -1.0);
        const th2 = phi + Math.acos(cosVal);

        // アーム2のアーム1からの角度：arcsinを利用
        let sinVal = (ld * ld - this.L1 * this.L1 - this.L2 * this.L2) / (2.0 * this.L1 * this.L2);
        sinVal = Math.max(Math.min(sinVal, 1.0), -1.0);
        const th3 = Math.asin(sinVal) + Math.PI / 2.0;

        // ラジアンから度へ変換
        const A1 = th1 * (180 / Math.PI);
        const A2 = th2 * (180 / Math.PI);
        const A3 = th3 * (180 / Math.PI);

        // Threejsの表示用角度に変換
        const tjsA1 = A1;
        const tjsA2 = -A2;
        const tjsA3 = 180 - A3;


        // Dobotの表示用角度に変換
        const j1 = A1;
        const j2 = 90.0 - A2;
        const j3 = 180.0 - A2 - A3;

        return {
            success: true,
            xyz: pos,
            rawAngles: { j1: A1, j2: A2, j3: A3 },
            threejsAngles: { j1: tjsA1, j2: tjsA2, j3: tjsA3 },
            dobotAngles: { j1, j2, j3 },
        };
    }
}