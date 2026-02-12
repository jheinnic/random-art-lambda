import { Prev, MMinusN } from './math';
import { LengthOf, InsertIndicesFor, NthOf } from './length';

export type LastNOf<T extends any[], N extends InsertIndicesFor<T>> =
   [
      [
         T
      ],
      [
         [],
         T
      ], [
         [],
         [T[1]],
         T
      ], [
         [],
         [T[2]],
         [T[1], T[2]],
         T
      ], [
         [],
         [T[3]],
         [T[2], T[3]],
         [T[1], T[2], T[3]],
         T
      ], [
         [],
         [T[4]],
         [T[3], T[4]],
         [T[2], T[3], T[4]],
         [T[1], T[2], T[3], T[4]],
         T
      ], [
         [],
         [T[5]],
         [T[4], T[5]],
         [T[3], T[4], T[5]],
         [T[2], T[3], T[4], T[5]],
         [T[1], T[2], T[3], T[4], T[5]],
         T
      ], [
         [],
         [T[6]],
         [T[5], T[6]],
         [T[4], T[5], T[6]],
         [T[3], T[4], T[5], T[6]],
         [T[2], T[3], T[4], T[5], T[6]],
         [T[1], T[2], T[3], T[4], T[5], T[6]],
         T
      ], [
         [],
         [T[7]],
         [T[6], T[7]],
         [T[5], T[6], T[7]],
         [T[4], T[5], T[6], T[7]],
         [T[3], T[4], T[5], T[6], T[7]],
         [T[2], T[3], T[4], T[5], T[6], T[7]],
         [T[1], T[2], T[3], T[4], T[5], T[6], T[7]],
         T
      ], [
         [],
         [T[8]],
         [T[7], T[8]],
         [T[6], T[7], T[8]],
         [T[5], T[6], T[7], T[8]],
         [T[4], T[5], T[6], T[7], T[8]],
         [T[3], T[4], T[5], T[6], T[7], T[8]],
         [T[2], T[3], T[4], T[5], T[6], T[7], T[8]],
         [T[1], T[2], T[3], T[4], T[5], T[6], T[7], T[8]],
         T
      ], [
         [],
         [T[9]],
         [T[8], T[9]],
         [T[7], T[8], T[9]],
         [T[6], T[7], T[8], T[9]],
         [T[5], T[6], T[7], T[8], T[9]],
         [T[4], T[5], T[6], T[7], T[8], T[9]],
         [T[3], T[4], T[5], T[6], T[7], T[8], T[9]],
         [T[2], T[3], T[4], T[5], T[6], T[7], T[8], T[9]],
         [T[1], T[2], T[3], T[4], T[5], T[6], T[7], T[8], T[9]],
         T
      ], [
         [],
         [T[10]],
         [T[9], T[10]],
         [T[8], T[9], T[10]],
         [T[7], T[8], T[9], T[10]],
         [T[6], T[7], T[8], T[9], T[10]],
         [T[5], T[6], T[7], T[8], T[9], T[10]],
         [T[4], T[5], T[6], T[7], T[8], T[9], T[10]],
         [T[3], T[4], T[5], T[6], T[7], T[8], T[9], T[10]],
         [T[2], T[3], T[4], T[5], T[6], T[7], T[8], T[9], T[10]],
         [T[1], T[2], T[3], T[4], T[5], T[6], T[7], T[8], T[9], T[10]],
         T
      ], [
         [],
         [T[11]],
         [T[10], T[11]],
         [T[9], T[10], T[11]],
         [T[8], T[9], T[10], T[11]],
         [T[7], T[8], T[9], T[10], T[11]],
         [T[6], T[7], T[8], T[9], T[10], T[11]],
         [T[5], T[6], T[7], T[8], T[9], T[10], T[11]],
         [T[4], T[5], T[6], T[7], T[8], T[9], T[10], T[11]],
         [T[3], T[4], T[5], T[6], T[7], T[8], T[9], T[10], T[11]],
         [T[2], T[3], T[4], T[5], T[6], T[7], T[8], T[9], T[10], T[11]],
         [T[1], T[2], T[3], T[4], T[5], T[6], T[7], T[8], T[9], T[10], T[11]],
         T
      ]
   ][LengthOf<T>][N];

export type ExceptFirstN<T extends any[], N extends InsertIndicesFor<T>> =
    MMinusN<LengthOf<T>, N> extends InsertIndicesFor<T> ?
        LastNOf<T, MMinusN<LengthOf<T>, N>> : never;

export type ExceptFirst<T extends any[]> =
   Prev<LengthOf<T>> extends InsertIndicesFor<T> ?
       LastNOf<T, Prev<LengthOf<T>>> : never;

export type LastOf<T extends any[]> = NthOf<T, Prev<LengthOf<T>>>;
