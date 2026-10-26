import { Badge, GlassCard, Mascot, cx } from '../../components'
import { ComingSoonBanner, SoonButton } from './components/ComingSoon'
import styles from './CreateYourAiPage.module.css'

// 14는 장기 컨셉이라 Figma 화면을 그대로 보여 주는 정적 화면이다(데이터 · 동작 없음).
type Tone = 'llm' | 'vision' | 'rl' | 'memory' | 'tool' | 'connectome'

const PALETTE: { name: string; level: string; tone?: Tone }[] = [
  { name: 'LLM', level: '기초', tone: 'llm' },
  { name: '비전', level: '기초', tone: 'vision' },
  { name: '강화학습', level: '기초', tone: 'rl' },
  { name: '메모리', level: '심화', tone: 'memory' },
  { name: '도구 호출', level: '심화', tone: 'tool' },
  { name: '커넥톰 회로', level: '최전선', tone: 'connectome' },
  { name: '월드 모델', level: '잠김' },
]

// 캔버스 좌표(710 × 600 기준)
const W = 710
const H = 600
const NODES: { id: string; kind: '입력' | '블록'; name: string; x: number; y: number; tone?: Tone }[] = [
  { id: 'camera', kind: '입력', name: '카메라', x: 25, y: 130 },
  { id: 'vision', kind: '블록', name: '비전', x: 200, y: 130, tone: 'vision' },
  { id: 'memory', kind: '블록', name: '메모리', x: 380, y: 255, tone: 'memory' },
  { id: 'rl', kind: '블록', name: '강화학습', x: 540, y: 255, tone: 'rl' },
  { id: 'smell', kind: '입력', name: '냄새 센서', x: 25, y: 380 },
  { id: 'connectome', kind: '블록', name: '커넥톰 회로', x: 200, y: 380, tone: 'connectome' },
]
const NW = 138
const NH = 70
const EDGES = [
  'M163 165 H200',
  'M338 165 C370 165 360 290 380 290',
  'M163 415 H200',
  'M338 415 C370 415 360 290 380 290',
  'M338 415 C420 415 440 290 540 290',
  'M518 290 H540',
]

const TRAITS = [
  { label: '학습 속도', value: 3 },
  { label: '설명 가능성', value: 4 },
  { label: '기억력', value: 5 },
  { label: '복잡도', value: 2 },
]

// W2 growth 담당 · 경로 /create · 14 Create Your AI (Builder · 장기) (34:3949)
export default function CreateYourAiPage() {
  return (
    <div className={styles.page}>
      <ComingSoonBanner>Create Your AI는 기술 트리를 모두 거친 뒤 열리는 장기 목표예요. 지금은 모습만 미리 볼 수 있어요.</ComingSoonBanner>
      <header className={styles.head}>
        <Badge tone="dark" size="md">
          COMING LATER · 장기 목표
        </Badge>
        <h1 className={styles.title}>블록을 이어서 나만의 AI를 만들어요</h1>
        <p className={styles.desc}>
          지금까지 해금한 기술을 블록처럼 조합해요. 연결하면 바로 시뮬레이션해서 성능과 설명 가능성을 비교할 수 있어요.
        </p>
      </header>

      <div className={styles.layout}>
        <GlassCard padding="md" className={styles.palette}>
          <h2 className={styles.cardTitle}>기술 블록</h2>
          <p className={styles.caption}>해금한 블록만 쓸 수 있어요</p>
          <ul className={styles.blocks}>
            {PALETTE.map((b) => (
              <li key={b.name} className={cx(styles.block, !b.tone && styles.blockLocked)} aria-disabled>
                {b.tone && <span className={cx(styles.dot, styles[b.tone])} aria-hidden />}
                <span className={styles.blockName}>{b.name}</span>
                <span className={styles.blockLevel}>{b.level}</span>
                {b.tone && (
                  <span className={styles.grip} aria-hidden>
                    ⋮⋮
                  </span>
                )}
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard padding="none" className={styles.canvasCard}>
          <div className={styles.canvas} aria-label="조립 캔버스 (미리보기)" role="img">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={styles.edges} aria-hidden>
              {EDGES.map((d) => (
                <path key={d} d={d} className={styles.edge} />
              ))}
              <path d={`M678 290 H${W}`} className={styles.edgeOut} />
            </svg>
            {NODES.map((n) => (
              <div
                key={n.id}
                className={cx(styles.node, n.tone ? styles[`n-${n.tone}`] : styles.input)}
                style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%`, width: `${(NW / W) * 100}%`, height: `${(NH / H) * 100}%` }}
              >
                <span className={styles.nodeKind}>{n.kind}</span>
                <span className={styles.nodeName}>{n.name}</span>
              </div>
            ))}
            <span className={styles.hint}>블록을 끌어다 놓고, 점을 이어서 연결하세요</span>
          </div>
        </GlassCard>

        <div className={styles.side}>
          <GlassCard padding="md" className={styles.preview}>
            <h2 className={styles.cardTitle}>내 AI 미리보기</h2>
            <Mascot expression="scientist" size={120} alt="" />
            <span className={styles.name}>이름: 기억하는 드로시</span>
          </GlassCard>
          <GlassCard padding="md">
            <h2 className={styles.cardTitle}>예상 특성</h2>
            <dl className={styles.traits}>
              {TRAITS.map((t) => (
                <div key={t.label}>
                  <dt>{t.label}</dt>
                  <dd aria-label={`5단계 중 ${t.value}`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={cx(styles.pip, i <= t.value && styles.pipOn)} />
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </GlassCard>
          <div className={styles.why}>
            <span className={styles.whyLabel}>AI 해설</span>
            <p>메모리를 붙이면 지난 실패를 기억해서 같은 장애물에 덜 부딪혀요. 대신 학습이 조금 느려질 수 있어요.</p>
          </div>
          <SoonButton size="lg" block>
            시뮬레이션 돌려보기
          </SoonButton>
        </div>
      </div>
    </div>
  )
}
