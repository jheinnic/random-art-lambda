
type TupleMapper<Tuple extends Array<Iterator<unknown>>> = {
  [Key in keyof Tuple]: Tuple[Key] extends Iterator<infer T> ? T : never;
}

function * zipCheap<T, Tuple extends Array<Iterator<T>>> (
  ...iterators: Tuple
): IterableIterator<TupleMapper<Tuple>> {
  const retval: TupleMapper<Tuple> = new Array<T>(
    iterators.length
  ) as TupleMapper<Tuple>
  while (true) {
    let idx: number = 0
    for (const nextIter of iterators) {
      const cursor = nextIter.next()
      if (cursor.done ?? false) {
        return
      }
      retval[idx++] = cursor.value
    }

    yield retval
  }
}
