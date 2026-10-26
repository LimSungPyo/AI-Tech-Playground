import { Link } from 'react-router'
import { getExperiment } from '../../api'
import { Badge, Button, GlassCard, Icon, Mascot, cx } from '../../components'
import { useApi } from '../../hooks/useApi'
import { ComingSoonBanner, SoonButton } from './components/ComingSoon'
import styles from './RagConceptPage.module.css'

// 15는 확장 모듈 컨셉이라 Figma 예시 화면을 그대로 보여 주는 정적 화면이다(질문 · 검색 동작 없음).
const CITES = ['[1] 곤충 겹눈의 구조', '[2] 초파리 눈 색소 연구', '[3] 드로시 캐릭터 설정']
const PASSAGES = [
  { text: '초파리를 포함한 곤충의 눈은 수백 개의 낱눈이 모인 겹눈 구조로…', score: 0.91, used: true },
  { text: '초파리 눈의 붉은 색은 색소에서 비롯되며, 과도한 빛을 걸러…', score: 0.84, used: true },
  { text: '드로시는 초파리에서 이름을 딴 마스코트로, 빨간 겹눈과…', score: 0.79, used: true },
  { text: '초파리는 유전학 연구에 오래 쓰여 온 모델 생물로…', score: 0.62, used: false },
]
const FLOW = ['질문하기', '검색 결과 확인', '유사도 시각화', '기술 카드', '다시 질문']

// 임베딩 지도 배경 점(고정 시드로 매번 같은 자리)
const SCATTER = Array.from({ length: 46 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453
  const b = Math.sin(i * 78.233) * 12543.1234
  return { x: 6 + (a - Math.floor(a)) * 88, y: 8 + (b - Math.floor(b)) * 84 }
})
const STAR = { x: 45, y: 50 }
const NEAR = [
  { x: 36, y: 34 },
  { x: 60, y: 37 },
  { x: 50, y: 66 },
]
const FAR = { x: 76, y: 74 }

// W2 growth 담당 · 경로 /experiments/002/concept · 15 #002 RAG 탐정 (Module Concept) (34:4835)
export default function RagConceptPage() {
  const exp = useApi((signal) => getExperiment('002', signal), [])
  const code = exp.data?.code ?? '#002'

  return (
    <div className={styles.page}>
      <ComingSoonBanner>
        {exp.data?.unlockCondition
          ? `${code} ${exp.data.title}는 아직 준비 중이에요 · ${exp.data.unlockCondition}`
          : '아직 열리지 않은 실험이에요. 화면은 컨셉 미리보기예요.'}
      </ComingSoonBanner>
      <header className={styles.head}>
        <span className={styles.eyebrow}>EXPERIMENT {code} · RAG 탐정 (확장 모듈 컨셉)</span>
        <h1 className={styles.title}>AI는 이 답을 어디서 찾아왔을까?</h1>
        <p className={styles.desc}>
          질문을 던지면, AI가 어떤 문단을 몇 점의 유사도로 찾아서 답변에 썼는지 하나하나 펼쳐 볼 수 있어요.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.ask}>
            <span className={styles.q}>Q.</span>
            <input className={styles.askInput} value="드로시는 왜 눈이 빨개요?" readOnly disabled aria-label="질문" />
            <SoonButton>질문하기</SoonButton>
          </div>

          <GlassCard padding="lg" className={styles.answer}>
            <div className={styles.rowHead}>
              <h2 className={styles.cardTitle}>AI 답변</h2>
              <SoonButton variant="why" size="sm">
                WHY?
              </SoonButton>
            </div>
            <p className={styles.answerText}>
              초파리의 눈은 수백 개의 작은 눈이 모인 겹눈이에요 [1]. 빨간색은 눈 속 색소 때문인데, 이 색소가 강한 빛으로부터 눈을
              보호하는 역할을 해요 [2]. 드로시의 눈도 이 특징을 그대로 따왔어요 [3].
            </p>
            <div className={styles.cites}>
              {CITES.map((c) => (
                <Badge key={c} tone="indigo" size="md">
                  {c}
                </Badge>
              ))}
            </div>
          </GlassCard>

          <GlassCard padding="lg">
            <div className={styles.rowHead}>
              <h2 className={styles.cardTitle}>검색된 문단 · 유사도 순</h2>
              <span className={styles.mono}>임베딩 검색 · 상위 4개</span>
            </div>
            <ol className={styles.passages}>
              {PASSAGES.map((p, i) => (
                <li key={p.text} className={cx(styles.passage, !p.used && styles.unused)}>
                  <span className={styles.rank}>{i + 1}</span>
                  <div className={styles.passageBody}>
                    <p>{p.text}</p>
                    <div className={styles.scoreRow}>
                      <span className={styles.scoreTrack}>
                        <span className={styles.scoreFill} style={{ width: `${p.score * 100}%` }} />
                      </span>
                      <span className={styles.mono}>{p.score.toFixed(2)}</span>
                    </div>
                  </div>
                  <Badge tone={p.used ? 'solid' : 'neutral'} size="md">
                    {p.used ? '답변에 사용' : '사용 안 함'}
                  </Badge>
                </li>
              ))}
            </ol>
          </GlassCard>
        </div>

        <div className={styles.side}>
          <GlassCard padding="lg">
            <h2 className={styles.cardTitle}>임베딩 지도</h2>
            <p className={styles.caption}>질문(★)과 가까운 문단일수록 답변에 쓰일 확률이 높아요.</p>
            <svg viewBox="0 0 100 80" className={styles.map} role="img" aria-label="질문과 문단 사이 거리를 나타낸 임베딩 지도">
              {SCATTER.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y * 0.8} r={0.9} className={styles.scatter} />
              ))}
              <circle cx={STAR.x} cy={STAR.y * 0.8} r={13} className={styles.radius} />
              {NEAR.map((p) => (
                <line key={`${p.x}`} x1={STAR.x} y1={STAR.y * 0.8} x2={p.x} y2={p.y * 0.8} className={styles.link} />
              ))}
              <line x1={STAR.x} y1={STAR.y * 0.8} x2={FAR.x} y2={FAR.y * 0.8} className={styles.linkFar} />
              {NEAR.map((p) => (
                <circle key={`n${p.x}`} cx={p.x} cy={p.y * 0.8} r={1.8} className={styles.near} />
              ))}
              <circle cx={FAR.x} cy={FAR.y * 0.8} r={1.8} className={styles.far} />
              <text x={STAR.x} y={STAR.y * 0.8 + 1.6} className={styles.star}>
                ★
              </text>
            </svg>
          </GlassCard>

          <GlassCard padding="lg">
            <h2 className={styles.cardTitle}>같은 실험 흐름, 다른 기술</h2>
            <div className={styles.flow}>
              {FLOW.map((f, i) => (
                <span key={f} className={styles.flowItem}>
                  <span className={cx(styles.flowChip, i === 2 && styles.flowActive)}>{f}</span>
                  {i < FLOW.length - 1 && <span aria-hidden>→</span>}
                </span>
              ))}
            </div>
            <p className={styles.caption}>
              초파리 실험과 같은 [플레이 → 변화 확인 → 원리 시각화 → 기술 카드 → 다시 플레이] 구조를 재사용해요.
            </p>
          </GlassCard>

          <GlassCard padding="md" className={styles.quote}>
            <Mascot expression="scientist" size={64} alt="" />
            <p>"검색해서 근거를 찾고 답하는 것 — 그게 RAG야!"</p>
          </GlassCard>

          <div className={styles.links}>
            <Button to="/lab" variant="secondary" iconLeft={<Icon name="arrow-left" size={16} />}>
              실험실로
            </Button>
            <Link to="/tree" className={styles.treeLink}>
              기술 트리에서 RAG 노드 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
