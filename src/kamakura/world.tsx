// 鎌倉の武家の都の3D。時代パックの World / LandmarkMesh として供する。
// 山にかこまれ、南は相模の海。若宮大路が海から八幡宮へまっすぐのびる。
import type { ThreeEvent } from '@react-three/fiber'
import { useGame } from '../game/store'
import { P } from './palette'
import { SEA_Z, BEACH, OMICHI, HILLS, TREES, blocked } from './layout'

export function KamakuraWorld() {
  const walkTo = useGame(s => s.walkTo)
  const onGround = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const x = e.point.x, z = e.point.z
    if (!blocked(x, z)) walkTo(x, z)
  }
  const roadZc = (OMICHI.z0 + BEACH.z0) / 2
  const roadD = BEACH.z0 - OMICHI.z0
  const beachZc = (BEACH.z0 + BEACH.z1) / 2
  const beachD = BEACH.z1 - BEACH.z0

  return (
    <group>
      {/* 地面（土） */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} onClick={onGround}>
        <planeGeometry args={[200, 200]} />
        <meshLambertMaterial color={P.earth} />
      </mesh>

      {/* 若宮大路（海から八幡宮へ） */}
      <mesh rotation-x={-Math.PI / 2} position={[OMICHI.x, 0.005, roadZc]} onClick={onGround}>
        <planeGeometry args={[OMICHI.w, roadD]} />
        <meshLambertMaterial color={P.sand} />
      </mesh>
      {/* 段葛の縁（大路の両側の土手） */}
      {[-OMICHI.w / 2 - 0.25, OMICHI.w / 2 + 0.25].map((dx, i) => (
        <mesh key={i} position={[OMICHI.x + dx, 0.12, roadZc]} raycast={() => null}>
          <boxGeometry args={[0.5, 0.24, roadD]} />
          <meshLambertMaterial color={P.hillDark} />
        </mesh>
      ))}

      {/* 浜（砂） */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, beachZc]} onClick={onGround}>
        <planeGeometry args={[120, beachD]} />
        <meshLambertMaterial color={P.sand} />
      </mesh>

      {/* 相模の海 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, SEA_Z + 45]}>
        <planeGeometry args={[240, 90]} />
        <meshLambertMaterial color={P.sea} />
      </mesh>
      {/* 波がしら */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, SEA_Z]} raycast={() => null}>
        <planeGeometry args={[120, 1.3]} />
        <meshLambertMaterial color={P.seaFoam} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, SEA_Z + 3]} raycast={() => null}>
        <planeGeometry args={[120, 0.7]} />
        <meshLambertMaterial color={P.seaFoam} />
      </mesh>

      {/* 囲む山（塀のかわり） */}
      {HILLS.map((h, i) => (
        <group key={i} position={[h.x, 0, h.z]} raycast={() => null}>
          <mesh scale={[h.r, h.h, h.r]} position={[0, 0, 0]}>
            <sphereGeometry args={[1, 20, 14]} />
            <meshLambertMaterial color={P.hill} />
          </mesh>
          <mesh scale={[h.r * 0.6, h.h * 1.15, h.r * 0.6]} position={[h.r * 0.15, 0, h.r * 0.1]}>
            <sphereGeometry args={[1, 18, 12]} />
            <meshLambertMaterial color={P.hillDark} />
          </mesh>
        </group>
      ))}

      {/* 大鳥居（大路の上・二の鳥居のおもかげ） */}
      <Torii x={OMICHI.x} z={5} scale={1.15} />

      {/* 木々（松を主に） */}
      {TREES.map((t, i) => (
        <KTree key={i} x={t.x} z={t.z} kind={t.kind} s={t.s} />
      ))}
    </group>
  )
}

// 松と紅葉（鎌倉は日ごとの色替えはせず、静かに）
function KTree({ x, z, kind, s }: { x: number; z: number; kind: 'maple' | 'pine'; s: number }) {
  const blobs = kind === 'maple'
    ? [
        { dx: 0, dy: 2.4, dz: 0, r: 1.05, c: '#a8532a' },
        { dx: -0.75, dy: 2.05, dz: 0.2, r: 0.78, c: '#8f4420' },
        { dx: 0.72, dy: 2.15, dz: -0.15, r: 0.72, c: '#b56a2e' },
      ]
    : [
        { dx: 0, dy: 2.7, dz: 0, r: 1.0, c: P.matsu },
        { dx: -0.85, dy: 2.15, dz: 0.2, r: 0.72, c: P.hillDark },
        { dx: 0.82, dy: 2.3, dz: -0.15, r: 0.68, c: P.matsu },
      ]
  const noRay = () => null
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1.15, 0]} raycast={noRay}>
        <cylinderGeometry args={[0.12, 0.19, 2.3, 10]} />
        <meshLambertMaterial color={P.woodDark} />
      </mesh>
      {blobs.map((b, i) => (
        <mesh key={i} position={[b.dx, b.dy, b.dz]} scale={[1, kind === 'pine' ? 0.5 : 0.8, 1]} raycast={noRay}>
          <sphereGeometry args={[b.r, 16, 12]} />
          <meshLambertMaterial color={b.c} />
        </mesh>
      ))}
    </group>
  )
}

// 朱の鳥居（scenery / landmark 共用）
function Torii({ x = 0, z = 0, scale = 1 }: { x?: number; z?: number; scale?: number }) {
  const noRay = () => null
  return (
    <group position={[x, 0, z]} scale={scale} raycast={noRay}>
      {[-2.4, 2.4].map((px, i) => (
        <mesh key={i} position={[px, 2.5, 0]} raycast={noRay}>
          <cylinderGeometry args={[0.24, 0.28, 5, 12]} />
          <meshLambertMaterial color={P.shu} />
        </mesh>
      ))}
      {/* 貫 */}
      <mesh position={[0, 3.6, 0]} raycast={noRay}><boxGeometry args={[5.6, 0.34, 0.34]} /><meshLambertMaterial color={P.shu} /></mesh>
      {/* 島木 */}
      <mesh position={[0, 4.55, 0]} raycast={noRay}><boxGeometry args={[6.4, 0.42, 0.6]} /><meshLambertMaterial color={P.shu} /></mesh>
      {/* 笠木（反り） */}
      <mesh position={[0, 4.95, 0]} rotation-z={0} raycast={noRay}><boxGeometry args={[7, 0.34, 0.72]} /><meshLambertMaterial color={P.sumi} /></mesh>
    </group>
  )
}

// 名所の立体：鶴岡八幡宮・鎌倉大仏・武家政庁・由比ヶ浜の一の鳥居
export function KamakuraLandmarkMesh({ kind }: { kind: string }) {
  if (kind === 'shrine') {
    // 鶴岡八幡宮：石段の上の朱の社殿（南向き＝+z）
    return (
      <group>
        {/* 石壇 */}
        <mesh position={[0, 0.25, 0]}><boxGeometry args={[8, 0.5, 6]} /><meshLambertMaterial color={P.ishi} /></mesh>
        {/* 大石段 */}
        {[0, 1, 2].map(i => (
          <mesh key={i} position={[0, 0.12 + i * 0.16, 3.2 + i * 0.5]}>
            <boxGeometry args={[4, 0.16, 0.5]} /><meshLambertMaterial color={P.ishi} />
          </mesh>
        ))}
        {/* 社殿の柱 */}
        {[-2.6, -1, 1, 2.6].map((px, i) => (
          <mesh key={i} position={[px, 1.5, -0.6]}><boxGeometry args={[0.34, 2.2, 0.34]} /><meshLambertMaterial color={P.shu} /></mesh>
        ))}
        {/* 白壁の身舎 */}
        <mesh position={[0, 1.55, -1.4]}><boxGeometry args={[5.4, 2, 1.6]} /><meshLambertMaterial color={P.gofun} /></mesh>
        {/* 縁と扉（朱） */}
        <mesh position={[0, 1.35, -0.55]}><boxGeometry args={[5.4, 1.5, 0.16]} /><meshLambertMaterial color={P.shu} /></mesh>
        {/* 檜皮ふうの屋根（寄棟＋反り） */}
        <mesh position={[0, 2.9, -1]}><boxGeometry args={[6.8, 0.5, 3.4]} /><meshLambertMaterial color={P.roof} /></mesh>
        <mesh position={[0, 3.3, -1]}><boxGeometry args={[4.6, 0.4, 2]} /><meshLambertMaterial color={P.roof} /></mesh>
        {/* 千木・鰹木のおもかげ */}
        <mesh position={[0, 3.7, -1]}><boxGeometry args={[3.4, 0.16, 0.2]} /><meshLambertMaterial color={P.kin} /></mesh>
        {[-1, 0, 1].map((dx, i) => (
          <mesh key={i} position={[dx * 0.9, 3.62, -1]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.12, 0.12, 0.7, 8]} /><meshLambertMaterial color={P.kin} /></mesh>
        ))}
      </group>
    )
  }
  if (kind === 'daibutsu') {
    // 鎌倉大仏：蓮座の上に坐す青銅の仏（南向き＝+z）
    return (
      <group>
        {/* 石の基壇 */}
        <mesh position={[0, 0.3, 0]}><boxGeometry args={[6, 0.6, 5]} /><meshLambertMaterial color={P.ishi} /></mesh>
        {/* 蓮座 */}
        <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[2.4, 2.7, 0.7, 24]} /><meshLambertMaterial color={P.bronzeDark} /></mesh>
        {/* 結跏趺坐の脚 */}
        <mesh position={[0, 1.5, 0.5]}><boxGeometry args={[4, 0.9, 2.4]} /><meshLambertMaterial color={P.bronze} /></mesh>
        {/* 膝の上で組む手（定印） */}
        <mesh position={[0, 2.0, 1.3]}><boxGeometry args={[1.6, 0.4, 0.6]} /><meshLambertMaterial color={P.bronzeDark} /></mesh>
        {/* 胴 */}
        <mesh position={[0, 3.0, -0.1]}><cylinderGeometry args={[1.5, 2.1, 2.2, 20]} /><meshLambertMaterial color={P.bronze} /></mesh>
        {/* 肩・衣 */}
        <mesh position={[0, 3.6, -0.1]} scale={[1, 0.6, 0.8]}><sphereGeometry args={[1.9, 20, 16]} /><meshLambertMaterial color={P.bronze} /></mesh>
        {/* 頭 */}
        <mesh position={[0, 4.7, 0.05]}><sphereGeometry args={[1.05, 24, 20]} /><meshLambertMaterial color={P.bronze} /></mesh>
        {/* 肉髻 */}
        <mesh position={[0, 5.6, 0.05]}><sphereGeometry args={[0.5, 16, 14]} /><meshLambertMaterial color={P.bronzeDark} /></mesh>
        {/* 白毫 */}
        <mesh position={[0, 4.75, 1.05]} raycast={() => null}><sphereGeometry args={[0.1, 10, 8]} /><meshLambertMaterial color={P.gofun} /></mesh>
      </group>
    )
  }
  if (kind === 'seat') {
    // 武家政庁：質実な板葺の館、堀と塀のおもかげ
    return (
      <group>
        {/* 土壇 */}
        <mesh position={[0, 0.2, 0]}><boxGeometry args={[8, 0.4, 6]} /><meshLambertMaterial color={P.earth} /></mesh>
        {/* 母屋の柱 */}
        {[-3, -1, 1, 3].map((px, i) => (
          <mesh key={i} position={[px, 1.3, 0.4]}><boxGeometry args={[0.3, 1.8, 0.3]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        ))}
        {/* 板壁の身舎 */}
        <mesh position={[0, 1.4, -0.6]}><boxGeometry args={[6.4, 1.9, 2.4]} /><meshLambertMaterial color={P.wood} /></mesh>
        {/* 板葺の大屋根（切妻） */}
        <mesh position={[0, 2.7, -0.2]}><boxGeometry args={[7.6, 0.4, 4]} /><meshLambertMaterial color={P.roof} /></mesh>
        <mesh position={[0, 3.05, -0.2]}><boxGeometry args={[5, 0.34, 2.6]} /><meshLambertMaterial color={P.roof} /></mesh>
        <mesh position={[0, 3.35, -0.2]}><boxGeometry args={[2.4, 0.28, 1.4]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        {/* 前の板塀 */}
        {[-3.4, 3.4].map((px, i) => (
          <mesh key={i} position={[px, 0.9, 2.6]}><boxGeometry args={[1.2, 1.2, 0.2]} /><meshLambertMaterial color={P.woodDark} /></mesh>
        ))}
        {/* 幔幕の朱（武家の印） */}
        <mesh position={[0, 1.7, 0.65]} raycast={() => null}><boxGeometry args={[6.4, 0.5, 0.06]} /><meshLambertMaterial color={P.shu} /></mesh>
      </group>
    )
  }
  // sea：由比ヶ浜の一の鳥居（渚に立つ朱の鳥居）
  return <Torii scale={1.25} />
}
