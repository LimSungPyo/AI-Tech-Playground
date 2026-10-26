/** className 합치기: cx('a', cond && 'b', undefined) → 'a b' */
export function cx(...names: (string | false | null | undefined | 0)[]) {
  return names.filter(Boolean).join(' ')
}
