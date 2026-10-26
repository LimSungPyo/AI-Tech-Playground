import { Link, useParams } from 'react-router'
import { getCard, getExperiment, getTree } from '../../api'
import type { TechCard } from '../../api/types'
import { Badge, Button, CHARACTERS, Character, EmptyState, Icon, Mascot, Skeleton, Tag, cx } from '../../components'
import { useApi } from '../../hooks/useApi'
import { NeuralOverlay } from '../report/components/NeuralOverlay'
import { StepDiagram } from './components/StepDiagram'
import styles from './CardPage.module.css'

const STEP_LABEL: Record<TechCard['steps'][number]['kind'], string> = {
  research: '원본 연구',
  mechanism: '가져온 메커니즘',
  simplification: '단순화 방식',
  implementation: '우리의 구현',
}

// W2 growth 담당 · 경로 /cards/:cardId · B-10 기술 카드 (60:10606)
export default function CardPage() {
  const { cardId = '' } = useParams()
  const card = useApi((signal) => getCard(cardId, signal), [cardId])
  const expId = card.data?.experimentId
  const exp = useApi(expId ? (signal) => getExperiment(expId, signal) : null, [expId])
  const tree = useApi((signal) => getTree(signal), [])

  if (card.loading) {
    return (
      <div className={styles.page}>
        <Skeleton height={400} />
        <div className={styles.steps}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={280} />
          ))}
        </div>
      </div>
    )
  }
  if (!card.data) {
    return (
      <EmptyState
        expression="confused"
        title={card.error?.status === 404 ? '기술 카드를 찾을 수 없어요' : '기술 카드를 불러오지 못했어요'}
        description={card.error?.message}
        action={
          <Button to="/cards" variant="secondary">
            기술 카드 모음
          </Button>
        }
      />
    )
  }

  const c = card.data
  const character = exp.data?.character ?? 'drosi'
  const isDrosi = character === 'drosi'
  const node = tree.data?.nodes.find((n) => n.experimentId === c.experimentId)
  const treeTo = node ? `/tree?node=${node.id}` : '/tree'

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.portrait}>
            {c.unlocked ? (
              <>
                {isDrosi ? <Mascot expression="neuron" size={260} alt="" /> : <Character id={character} size={240} alt="" />}
                <NeuralOverlay className={styles.net} ringOnly={isDrosi} />
              </>
            ) : (
              <Character id={character} size={240} locked alt="" />
            )}
          </div>
          <div className={styles.heroText}>
            <span className={styles.eyebrowDark}>PLOT TWIST</span>
            {c.unlocked ? (
              <>
                <h1 className={styles.headline}>{c.reveal.headline}</h1>
                <p className={styles.heroBody}>{c.reveal.body}</p>
                <Button to={`/experiments/${c.experimentId}/reveal`} className={styles.replayBtn}>
                  신경망 다시 보기
                </Button>
              </>
            ) : (
              <>
                <h1 className={styles.headline}>
                  <Icon name="lock" size={32} /> 아직 잠긴 기술 카드예요
                </h1>
                <p className={styles.heroBody}>
                  {exp.data ? `${exp.data.code} ${exp.data.title}` : '이 실험'}을 끝내고 반전을 보면 「{c.title}」 카드가 열려요.
                </p>
                <Button to={`/experiments/${c.experimentId}`} className={styles.replayBtn}>
                  실험 보러 가기
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {c.unlocked && (
        <>
          <section aria-labelledby="steps-title">
            <span className={styles.eyebrow}>TECH CARD</span>
            <h2 id="steps-title" className={styles.sectionTitle}>
              기술 카드 — 연구에서 게임까지
            </h2>
            <p className={styles.sectionDesc}>
              원본 연구 → 우리가 가져온 메커니즘 → 단순화 방식 → 우리의 구현을 한 장으로 정리합니다.
            </p>
            <ol className={styles.steps}>
              {c.steps.map((s, i) => (
                <li key={s.kind} className={styles.stepWrap}>
                  <article className={styles.step}>
                    <div className={styles.stepHead}>
                      <span className={styles.stepNo}>{String(i + 1).padStart(2, '0')}</span>
                      {i === c.steps.length - 1 ? (
                        <Badge tone="solid">{STEP_LABEL[s.kind]}</Badge>
                      ) : (
                        <Tag className={styles.stepTag}>{STEP_LABEL[s.kind]}</Tag>
                      )}
                    </div>
                    <h3 className={styles.stepTitle}>{s.title}</h3>
                    <p className={styles.stepBody}>{s.body}</p>
                    <StepDiagram kind={s.kind} />
                  </article>
                  {i < c.steps.length - 1 && <Icon name="arrow-right" size={20} className={styles.stepArrow} />}
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="honest-title">
            <span className={styles.eyebrow}>HONEST BY DESIGN</span>
            <h2 id="honest-title" className={styles.sectionTitle}>
              어디까지가 {exp.data ? speciesOf(exp.data.character) : '생물'}, 어디부터가 사람?
            </h2>
            <p className={styles.sectionDesc}>과장 없이 공개합니다. 커넥톰 시뮬레이션은 실제 뇌의 복제가 아니에요.</p>
            <div className={styles.honest}>
              <div className={styles.box}>
                <h3 className={styles.boxTitle}>생물학적 연결망 · 원본 데이터</h3>
                {c.biologicalVsDesigned.biological.length ? (
                  <ul className={styles.bullets}>
                    {c.biologicalVsDesigned.biological.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.none}>이 기술은 생물의 뇌에서 가져온 부분이 없어요.</p>
                )}
              </div>
              <div className={styles.box}>
                <h3 className={styles.boxTitle}>사람이 설계한 부분</h3>
                <ul className={styles.bullets}>
                  {c.biologicalVsDesigned.designed.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className={cx(styles.box, styles.sources)}>
            <div>
              <h2 className={styles.boxTitle}>참고 연구 · 출처</h2>
              <ul className={styles.sourceList}>
                {c.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.title} <Icon name="arrow-up-right" size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.sourceActions}>
              <Button to={`/experiments/${c.experimentId}/play`} variant="secondary">
                다시 플레이
              </Button>
              <Button to={treeTo} iconRight={<Icon name="arrow-right" size={16} />}>
                기술 트리에서 다음 실험 해금
              </Button>
            </div>
          </section>
        </>
      )}

      <Link to="/cards" className={styles.allLink}>
        <Icon name="grid" size={16} /> 기술 카드 모음 보기
      </Link>
    </div>
  )
}

/** "어디까지가 초파리?" — 캐릭터 이름 대신 생물 이름을 쓴다 */
function speciesOf(id: keyof typeof CHARACTERS) {
  const map: Partial<Record<keyof typeof CHARACTERS, string>> = { drosi: '초파리', wormy: '선충' }
  return map[id] ?? CHARACTERS[id].name
}
