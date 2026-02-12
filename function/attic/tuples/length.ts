import { MMinusN, MPlusN } from './math';

export type MaxLength = 12;
export type SupportedLength = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type SupportedIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type LengthOf<T extends any[]> =
   T extends { length: infer N }
       ? (N extends SupportedLength ? N : never)
       : never;

type IndexTypes = [
   never,
   0,
   0 | 1,
   0 | 1 | 2,
   0 | 1 | 2 | 3,
   0 | 1 | 2 | 3 | 4,
   0 | 1 | 2 | 3 | 4 | 5,
   0 | 1 | 2 | 3 | 4 | 5 | 6,
   0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
   0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
   0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
   0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
   0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
];

type InsertIndexTypes = [
   0,
   0 | 1,
   0 | 1 | 2,
   0 | 1 | 2 | 3,
   0 | 1 | 2 | 3 | 4,
   0 | 1 | 2 | 3 | 4 | 5,
   0 | 1 | 2 | 3 | 4 | 5 | 6,
   0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
   0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
   0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
   0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
   0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11,
   0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
];

export type IndicesByLength<N extends SupportedLength> = IndexTypes[N];
export type IndicesFor<T extends any[]> = IndexTypes[LengthOf<T>];

export type MaxAppendLength<T extends any[]> = MMinusN<MaxLength, LengthOf<T>>
export type AppendableLengths<T extends any[]> =
    LengthOf<T> extends SupportedIndex ?
        (IndexTypes[MaxAppendLength<T>] | MaxAppendLength<T>) : 0;

export type InsertIndicesFor<T extends any[]> = InsertIndexTypes[LengthOf<T>];
export type LengthOrSmaller<T extends any[]> =
    LengthOf<T> extends SupportedLength ?
        (IndicesFor<T> | LengthOf<T>) : SupportedLength;

export type NthOf<T extends any[], N extends IndicesFor<T>> = T[N];
export type LengthMinus<T extends any[], N extends LengthOrSmaller<T>> = MMinusN<LengthOf<T>, N>;
export type LengthPlus<T extends any[], N extends AppendableLengths<T>> = MPlusN<LengthOf<T>, N>;

// export type IndexTuplesByLength = [
//    [],
//    [0],
//    [0, 1],
//    [0, 1, 2],
//    [0, 1, 2, 3],
//    [0, 1, 2, 3, 4],
//    [0, 1, 2, 3, 4, 5],
//    [0, 1, 2, 3, 4, 5, 6],
//    [0, 1, 2, 3, 4, 5, 6, 7],
//    [0, 1, 2, 3, 4, 5, 6, 7, 8],
//    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
//    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
//    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
// ];
// export type LengthIndexTuple<N extends number> = IndexTuplesByLength[N];
// export type IndexTupleFor<T extends any[]> = IndexTuplesByLength[LengthOf<T>];
