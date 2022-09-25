/*
 * This file is part of ocamljs, OCaml to Javascript compiler
 * Copyright (C) 2007-9 Skydeck, Inc
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, write to the Free
 * Software Foundation, Inc., 59 Temple Place - Suite 330, Boston,
 * MA 02111-1307, USA
 */

'use strict';

const util = require('util');

module.exports = {
  new_new_picture: undefined,
  new_picture: undefined,
  old_picture: undefined,
  compute_pixel: undefined,
  word_to_seed: undefined,
  partial_eval: undefined,
  full_eval: undefined
};

(
  function (methodHolder) {

    function ocaml_register(name, fn)
    {
      methodHolder[name] = fn;
    }

    // 'Globals'
    let hash_univ_limit;
    let hash_univ_count;
    let hash_accu;

// compiled by ocamlc 3.11.1, ocamljs 0.2
    const ocamljs$caml_named_value = (
      function () {
        const Match_failure$16g = 'Match_failure';
        const Out_of_memory$17g = 'Out_of_memory';
        const Stack_overflow$24g = 'Stack_overflow';
        const Invalid_argument$18g = 'Invalid_argument';
        const Failure$19g = 'Failure';
        const Not_found$20g = 'Not_found';
        const Sys_error$21g = 'Sys_error';
        const End_of_file$22g = 'End_of_file';
        const Division_by_zero$23g = 'Division_by_zero';
        const Sys_blocked_io$25g = 'Sys_blocked_io';
        const Assert_failure$26g = 'Assert_failure';
        const Undefined_recursive_module$27g = 'Undefined_recursive_module';

        const caml_blit_string = function (s1, o1, s2, o2, n) {
          for (let i = 0; i < n; i++) {
            oc$$ssetu(s2, o2 + i, oc$$srefu(s1, o1 + i));
          }
        };
        const caml_callback = function (f, a) {
          return _(f, [a]);
        };
        const caml_callback2 = function (f, a1, a2) {
          return _(f, [a1, a2]);
        };
        const caml_callback3 = function (f, a1, a2, a3) {
          return _(f, [a1, a2, a3]);
        };
        const caml_callback4 = function (f, a1, a2, a3, a4) {
          return _(f, [a1, a2, a3, a4]);
        };
        const caml_callback5 = function (f, a1, a2, a3, a4, a5) {
          return _(f, [a1, a2, a3, a4, a5]);
        };
        const caml_callbackN = function (f, n, args) {
          return _(f, args);
        };
// XXX caml_callback_exn ?
        const compare_val = function (v1, v2, total) {
          const LESS = -1;
          const GREATER = 1;
          const EQUAL = 0;
          const UNORDERED = -2; // XXX ok?

          // XXX needs some work

          if (v1 == v2 && total) {
            return EQUAL;
          }

          const t1 = typeof v1;
          const t2 = typeof v2;
          if (t1 == t2) {
            switch (t1) {
              case 'boolean':
                if (v1 < v2) {
                  return LESS;
                }
                if (v1 > v2) {
                  return GREATER;
                }
                return EQUAL;
              case 'number':
                if (v1 < v2) {
                  return LESS;
                }
                if (v1 > v2) {
                  return GREATER;
                }
                if (v1 !== v2) {
                  if (!total) {
                    return UNORDERED;
                  }
                  if (v1 === v1) {
                    return GREATER;
                  }
                  if (v2 === v2) {
                    return LESS;
                  }
                  return EQUAL;
                }
                return EQUAL;
              case 'string':
                if (v1 < v2) {
                  return LESS;
                }
                if (v1 > v2) {
                  return GREATER;
                }
                return EQUAL;
              case 'function':
                caml_invalid_argument('equal: functional value');
                return 'ERROR';
              case 'object':
                // like NaN
                if (v1 == null) {
                  if (v2 == null) {
                    return EQUAL;
                  }
                  return LESS;
                }
                if (v2 == null) {
                  return GREATER;
                }

                // XXX is there a way to get the class of an object as a value?
                // XXX is it worth special casing various JS objects?
                if (v1 instanceof Date) {
                  const t1 = v1.getTime();
                  const t2 = v2.getTime();
                  if (t1 < t2) {
                    return LESS;
                  }
                  if (t1 > t2) {
                    return GREATER;
                  }
                  return EQUAL;
                }
                if (v1 instanceof Array) {
                  // we should always either have both tags or neither
                  // so it is OK to fall through here
                  if (v1.t < v2.t) {
                    return LESS;
                  }
                  if (v1.t > v2.t) {
                    return GREATER;
                  }
                  const sz1 = v1.length;
                  const sz2 = v2.length;
                  if (sz1 < sz2) {
                    return LESS;
                  }
                  if (sz1 > sz2) {
                    return GREATER;
                  }
                  if (sz1 == 0) {
                    return EQUAL;
                  }
                  for (let i = 0; i < sz1; i++) {
                    const c = compare_val(v1[i], v2[i], total);
                    if (c != EQUAL) {
                      return c;
                    }
                  }
                  return EQUAL;
                }
                if (v1 instanceof oc$$ms) {
                  const s1 = v1.toString();
                  const s2 = v2.toString();
                  if (s1 < s2) {
                    return LESS;
                  }
                  if (s1 > s2) {
                    return GREATER;
                  }
                  return EQUAL;
                }
                if (v1._m != null && v2._m != null) { // i.e. an OCaml object XXX better test
                  const oid1 = v1[1];
                  const oid2 = v2[1];
                  if (oid1 < oid2) {
                    return LESS;
                  }
                  if (oid1 > oid2) {
                    return GREATER;
                  }
                  return EQUAL;
                }
                return UNORDERED; // XXX
              default:
                return UNORDERED;
            }
          }

          // like NaN
          if (v1 == null) {
            if (v2 == null) {
              return EQUAL;
            }
            return LESS;
          }
          if (v2 == null) {
            return GREATER;
          }

          // one boolean and one int
          if (t1 == 'boolean' || t2 == 'boolean') {
            if (v1 < v2) {
              return LESS;
            }
            if (v1 > v2) {
              return GREATER;
            }
            return EQUAL;
          }
          // one mutable and one immutable string
          if (t1 == 'string' || t2 == 'string') {
            const s1 = v1.toString();
            const s2 = v2.toString();
            if (s1 < s2) {
              return LESS;
            }
            if (s1 > s2) {
              return GREATER;
            }
            return EQUAL;
          }
          // one constructor without data (number) and one with (object Array)
          if (t1 == 'number') {
            return LESS;
          }
          if (t2 == 'number') {
            return GREATER;
          }
          return UNORDERED;
        };
        const caml_compare = function (v1, v2) {
          const res = compare_val(v1, v2, 1);
          return res < 0 ? -1 : res > 0 ? 1 : 0;
        };
        const caml_equal = function (v1, v2) {
          return compare_val(v1, v2, 0) == 0;
        };
        const caml_failwith = function (s) {
          throw $(Failure$19g, s);
        };
        const caml_fill_string = function (s, o, l, c) {
          for (let i = 0; i < l; i++) {
            oc$$ssetu(s, o + i, c);
          }
        };
        const caml_float_compare = function (v1, v2) {
          if (v1 === v2) {
            return 0;
          }
          if (v1 < v2) {
            return -1;
          }
          if (v1 > v2) {
            return 1;
          }
          if (v1 === v1) {
            return 1;
          }
          if (v2 === v2) {
            return -1;
          }
          return 0;
        };
        const caml_float_of_string = function (s) {
          const f = parseFloat(s);
          return isNaN(f) ? caml_failwith('float_of_string') : f;
        };
        const caml_classify_float = function (f) {
          if (isNan(f)) {
            return 4;
          }// FP_nan
          else if (!isFinite(f)) {
            return 3;
          }// FP_infinite
          else if (f === 0) {
            return 2;
          }// FP_zero
          // can't determine subnormal from js afaik
          else {
            return 0;
          } // FP_normal
        };

        const caml_format_int = function (f, a) {
          function parse_format(f)
          {
            return f;
          } // XXX see ints.c
          const f2 = parse_format(f);
          return oc$$sprintf(f2, a);
        };

        const caml_greaterthan = function (v1, v2) {
          return compare_val(v1, v2, 0) > 0;
        };
        const caml_greaterequal = function (v1, v2) {
          return compare_val(v1, v2, 0) >= 0;
        };
        const caml_hash_univ_param = function (count, limit, obj) {
          // globals
          hash_univ_limit = limit;
          hash_univ_count = count;
          hash_accu = 0;

          // XXX needs work
          function hash_aux(obj)
          {
            hash_univ_limit--;
            if (hash_univ_count < 0 || hash_univ_limit < 0) {
              return;
            }

            function combine(n)
            {
              hash_accu = hash_accu * 65599 + n;
            }

            function combine_small(n)
            {
              hash_accu = hash_accu * 19 + n;
            }

            switch (typeof obj) {
              case 'number':
                // XXX for floats C impl examines bit rep
                // XXX for constructors without data C impl uses combine_small
                hash_univ_count--;
                combine(obj);
                break;
              case 'string':
                hash_univ_count--;
                for (let i = obj.length; i > 0; i--) {
                  combine_small(obj.charCodeAt(i));
                }
                break;
              case 'boolean':
                hash_univ_count--;
                combine_small(obj ? 1 : 0);
                break;
              case 'object':
                if (obj instanceof oc$$ms) {
                  hash_aux(obj.toString());
                } else if (obj instanceof Array) { // possibly a block
                  if (obj.t) {
                    hash_univ_count--;
                    combine_small(obj.t);
                    for (let i = obj.length; i > 0; i--) {
                      hash_aux(obj[i]);
                    }
                  }
                }
                else if (obj._m != null) { // OCaml object, use oid
                  hash_univ_count--;
                  combine(obj[1]);
                }
                break;
              default:
                break;
            }
          }

          hash_aux(obj);
          return hash_accu & 0x3FFFFFFF;
        };
        const caml_input_value = function () {
          throw 'caml_input_value';
        };
        const caml_input_value_from_string = function () {
          throw 'caml_input_value_from_string';
        };
        const caml_install_signal_handler = function () {
          throw 'caml_install_signal_handler';
        };
        const caml_int_compare = function (i1, i2) {
          return (
            i1 > i2
          ) - (
            i1 < i2
          );
        };
        const caml_int32_compare = function (i1, i2) {
          return (
            i1 > i2
          ) - (
            i1 < i2
          );
        };
        const caml_int64_compare = function (i1, i2) {
          throw 'caml_int64_compare';
        };
        const caml_int64_float_of_bits = function (s) {
          // see pervasives.ml; int64s are represented by strings
          switch (s) {
            case '9218868437227405312':
              return Number.POSITIVE_INFINITY;
            case '-4503599627370496':
              return Number.NEGATIVE_INFINITY;
            case '9218868437227405313':
              return Number.NaN;
            case '9218868437227405311' :
              return Number.MAX_VALUE;
            case '4503599627370496':
              return Number.MIN_VALUE;
            case '4372995238176751616':
              return 0; // XXX how to get epsilon in js?
            default:
              return 0;
          }
        };
        const caml_int_of_string = function (s) {
          const i = parseInt(s, 10);
          return isNaN(i) ? caml_failwith('int_of_string') : i;
        };
        const caml_int32_of_string = caml_int_of_string;
        const caml_int64_of_string = caml_int_of_string;
        const caml_nativeint_of_string = caml_int_of_string;
        const caml_invalid_argument = function (s) {
          throw $(Invalid_argument$18g, s);
        };
        const caml_is_printable = function (c) {
          return c > 31 && c < 127;
        }; // XXX get this right
        const caml_lessthan = function (v1, v2) {
          return compare_val(v1, v2, 0) - 1 < -1;
        };
        const caml_lessequal = function (v1, v2) {
          return compare_val(v1, v2, 0) - 1 <= -1;
        };
        const caml_make_vect = function (l, i) {
          const a = new Array(l);
          for (let j = 0; j < l; j++) {
            a[j] = i;
          }
          return a;
        };
        const caml_marshal_data_size = function () {
          throw 'caml_marshal_data_size';
        };
        const caml_md5_chan = function () {
          throw 'caml_md5_chan';
        };
        const caml_md5_string = function () {
          throw 'caml_md5_string';
        };
        const caml_ml_channel_size = function () {
          throw 'caml_ml_channel_size';
        };
        const caml_ml_channel_size_64 = function () {
          throw 'caml_ml_channel_size_64';
        };
        const caml_ml_close_channel = function () {
          throw 'caml_ml_close_channel';
        };

        const caml_ml_flush = function (c) {
        };

        const caml_ml_input = function () {
          throw 'caml_ml_input';
        };
        const caml_ml_input_char = function () {
          throw 'caml_ml_input_char';
        };
        const caml_ml_input_int = function () {
          throw 'caml_ml_input_int';
        };
        const caml_ml_input_scan_line = function () {
          throw 'caml_ml_input_scan_line';
        };
        const caml_ml_open_descriptor_in = function () {
          return 0;
        }; // XXX
        const caml_ml_open_descriptor_out = function () {
          return 0;
        }; // XXX
        const caml_ml_out_channels_list = function () {
          return 0;
        };

        const caml_ml_output = function (c, b, s, l) {
          print_verbatim(b);
        };
        const caml_ml_output_char = function (c, ch) {
        };

        const caml_ml_output_int = function () {
          throw 'caml_ml_output_int';
        };
        const caml_ml_pos_in = function () {
          throw 'caml_ml_pos_in';
        };
        const caml_ml_pos_in_64 = function () {
          throw 'caml_ml_pos_in_64';
        };
        const caml_ml_pos_out = function () {
          throw 'caml_ml_pos_out';
        };
        const caml_ml_pos_out_64 = function () {
          throw 'caml_ml_pos_out_64';
        };
        const caml_ml_seek_in = function () {
          throw 'caml_ml_seek_in';
        };
        const caml_ml_seek_in_64 = function () {
          throw 'caml_ml_seek_in_64';
        };
        const caml_ml_seek_out = function () {
          throw 'caml_ml_seek_out';
        };
        const caml_ml_seek_out_64 = function () {
          throw 'caml_ml_seek_out_64';
        };
        const caml_ml_set_binary_mode = function () {
          throw 'caml_ml_set_binary_mode';
        };
        const caml_named_value = function (n) {
          return oc$$nv[n];
        };
        const caml_nativeint_compare = function (i1, i2) {
          return (
            i1 > i2
          ) - (
            i1 < i2
          );
        };
        const caml_notequal = function (v1, v2) {
          return compare_val(v1, v2, 0) != 0;
        };
        const caml_obj_dup = function (a) {
          const l = a.length;
          const d = new Array(l);
          for (let i = 0; i < l; i++) {
            d[i] = a[i];
          }
          d.t = a.t;
          return d;
        };
        const caml_obj_is_block = function (o) {
          return !(
            typeof o == 'number'
          )
        };
        const caml_obj_tag = function (o) {
          return o.t;
        };
        const caml_obj_set_tag = function (o, t) {
          o.t = t;
        };
        const caml_obj_block = function (t, s) {
          if (s == 0) {
            return t;
          } else {
            const a = new Array(s);
            a.t = t;
            return a;
          }
        };
        const caml_obj_truncate = function (o, s) {
          o.length = s;
        };
        const caml_output_value = function () {
          throw 'caml_output_value';
        };
        const caml_output_value_to_string = function () {
          throw 'caml_output_value_to_string';
        };
        const caml_output_value_to_buffer = function () {
          throw 'caml_output_value_to_buffer';
        };
        const caml_record_backtrace = function () {
          throw 'caml_record_backtrace';
        };
        const caml_backtrace_status = function () {
          throw 'caml_backtrace_status';
        };
        const caml_get_exception_backtrace = function () {
          throw 'caml_get_exception_backtrace';
        };
        const caml_register_named_value = function (n, v) {
          oc$$nv[n] = v;
        };
        const caml_string_compare = function (s1, s2) {
          if (oc$$slt(s1, s2)) {
            return -1;
          } else if (oc$$sgt(s1, s2)) {
            return 1;
          } else {
            return 0;
          }
        };
        const caml_sys_exit = function () {
          throw 'caml_sys_exit';
        };
        const init_time = (
          new Date()
        ).getTime() / 1000;
        const caml_sys_time = function () {
          return (
            new Date()
          ).getTime() / 1000 - init_time;
        };
        const caml_sys_get_argv = function () {
          return $('', $());
        }; // XXX put something here?
        const caml_sys_get_config = function () {
          return $('js', 32);
        }; // XXX browser name?
        const caml_sys_open = function () {
          throw 'caml_sys_open';
        };
        const caml_sys_random_seed = function () {
          throw 'caml_sys_random_seed';
        };

// lexing.c

        function Short(tbl, n)
        {
          const s = tbl.charCodeAt(n * 2) + (
            tbl.charCodeAt(n * 2 + 1) << 8
          );
          return s & 32768 ? s + -65536 : s;
        }

        const caml_lex_engine = function (tbl, start_state, lexbuf) {
          let state, base, backtrk, c;

          state = start_state;
          if (state >= 0) {
            /* First entry */
            lexbuf[6] = lexbuf[4] = lexbuf[5];
            lexbuf[7] = -1;
          } else {
            /* Reentry after refill */
            state = -state - 1;
          }
          while (1) {
            /* Lookup base address or action number for current state */
            base = Short(tbl[0], state);
            if (base < 0) {
              return -base - 1;
            }
            /* See if it's a backtrack point */
            backtrk = Short(tbl[1], state);
            if (backtrk >= 0) {
              lexbuf[6] = lexbuf[5];
              lexbuf[7] = backtrk;
            }
            /* See if we need a refill */
            if (lexbuf[5] >= lexbuf[2]) {
              if (lexbuf[8] === false) {
                return -state - 1;
              } else {
                c = 256;
              }
            } else {
              /* Read next input char */
              c = lexbuf[1].charCodeAt(lexbuf[5]);
              lexbuf[5] += 1;
            }
            /* Determine next state */
            if (Short(tbl[4], base + c) == state) {
              state = Short(tbl[3], base + c);
            } else {
              state = Short(tbl[2], state);
            }
            /* If no transition on this char, return to last backtrack point */
            if (state < 0) {
              lexbuf[5] = lexbuf[6];
              if (lexbuf[7] == -1) {
                caml_failwith('lexing: empty token');
              } else {
                return lexbuf[7];
              }
            } else {
              /* Erase the EOF condition only if the EOF pseudo-character was
         consumed by the automaton (i.e. there was no backtrack above) */
              if (c == 256) {
                lexbuf[8] = false;
              }
            }
          }
        };

        /***********************************************/
        /* New lexer engine, with memory of positions  */

        /***********************************************/

        function run_mem(p, pc, mem, curr_pos)
        {
          for (; ;) {
            let dst, src;

            dst = p.charCodeAt(pc++);
            if (dst == 0xff) {
              return;
            }
            src = p.charCodeAt(pc++);
            if (src == 0xff) {
              /*      fprintf(stderr,'[%hhu] <- %d\n',dst,Int_val(curr_pos)) ;*/
              mem[dst] = curr_pos;
            } else {
              /*      fprintf(stderr,'[%hhu] <- [%hhu]\n',dst,src) ; */
              mem[dst] = mem[src];
            }
          }
        }

        function run_tag(p, pc, mem)
        {
          for (; ;) {
            const dst = p.charCodeAt(pc++);
            if (dst == 0xff) {
              return;
            }
            const src = p.charCodeAt(pc++);
            if (src == 0xff) {
              /*      fprintf(stderr,'[%hhu] <- -1\n',dst) ; */
              mem[dst] = -1;
            } else {
              /*      fprintf(stderr,'[%hhu] <- [%hhu]\n',dst,src) ; */
              mem[dst] = mem[src];
            }
          }
        }

        const caml_new_lex_engine = function (tbl, start_state, lexbuf) {
          let state, base, backtrk, c, pstate;
          state = start_state;
          if (state >= 0) {
            /* First entry */
            lexbuf[6] = lexbuf[4] = lexbuf[5];
            lexbuf[7] = -1;
          } else {
            /* Reentry after refill */
            state = -state - 1;
          }
          while (1) {
            /* Lookup base address or action number for current state */
            base = Short(tbl[0], state);
            if (base < 0) {
              const pc_off = Short(tbl[5], state);
              run_tag(tbl[10], pc_off, lexbuf[9]);
              /*      fprintf(stderr,'Perform: %d\n',-base-1) ; */
              return -base - 1;
            }
            /* See if it's a backtrack point */
            backtrk = Short(tbl[1], state);
            if (backtrk >= 0) {
              const pc_off = Short(tbl[6], state);
              run_tag(tbl[10], pc_off, lexbuf[9]);
              lexbuf[6] = lexbuf[5];
              lexbuf[7] = backtrk;

            }
            /* See if we need a refill */
            if (lexbuf[5] >= lexbuf[2]) {
              if (lexbuf[8] === false) {
                return -state - 1;
              } else {
                c = 256;
              }
            } else {
              /* Read next input char */
              c = lexbuf[1].charCodeAt(lexbuf[5]);
              lexbuf[5] += 1;
            }
            /* Determine next state */
            pstate = state;
            if (Short(tbl[4], base + c) == state) {
              state = Short(tbl[3], base + c);
            } else {
              state = Short(tbl[2], state);
            }
            /* If no transition on this char, return to last backtrack point */
            if (state < 0) {
              lexbuf[5] = lexbuf[6];
              if (lexbuf[7] == -1) {
                caml_failwith('lexing: empty token');
              } else {
                return lexbuf[7];
              }
            } else {
              /* If some transition, get and perform memory moves */
              const base_code = Short(tbl[5], pstate);
              let pc_off;
              if (Short(tbl[9], base_code + c) == pstate) {
                pc_off = Short(tbl[8], base_code + c);
              } else {
                pc_off = Short(tbl[7], pstate);
              }
              if (pc_off > 0) {
                run_mem(tbl[10], pc_off, lexbuf[9], lexbuf[5]);
              }
              /* Erase the EOF condition only if the EOF pseudo-character was
         consumed by the automaton (i.e. there was no backtrack above)
       */
              if (c == 256) {
                lexbuf[8] = false;
              }
            }
          }
        };

// parsing.c

        let caml_parser_trace = false;

        /* Auxiliary for printing token just read */

        function token_name(names, number)
        {
          let n = 0;
          for (/*nothing*/; number > 0; number--) {
            const i = names.indexOf('\x00', n);
            if (i == -1) {
              return '<unknown token>';
            }
            n = i + 1;
          }
          return names.substr(n, names.indexOf('\x00', n) - n);
        }

        function print_token(tables, state, tok)
        {
          if (typeof tok == 'number') {
            print('State ' + state + ': read token ' + token_name(tables[14], tok));
          } else {
            print('State ' + state + ': read token ' + token_name(tables[15], tok.t) + '(' + tok[0] + ')');
          }
        }

        /* The pushdown automata */

        const caml_parse_engine = function (tables, env, cmd, arg) {
          let sp, asp;
          let state, state1;
          let n, n1, n2, m, errflag;

          loop: while (true) {
            // noinspection FallThroughInSwitchStatementJS
            switch (cmd) {

              case 0:
                state = 0;
                sp = env[13];
                errflag = 0;

              case -1:
                n = Short(tables[5], state);
                if (n != 0) {
                  cmd = -7;
                  continue;
                }
                if (env[6] >= 0) {
                  cmd = -2;
                  continue;
                }
                env[13] = sp;
                env[14] = state;
                env[15] = errflag;
                return 0;
              /* The ML code calls the lexer and updates */
              /* symb_start and symb_end */
              case 1:
                sp = env[13];
                state = env[14];
                errflag = env[15];
                if (!(
                  typeof arg === 'number'
                ))
                {
                  env[6] = tables[2][arg.t];
                  env[7] = arg[0];
                } else {
                  env[6] = tables[1][arg];
                  env[7] = 0;
                }
                if (caml_parser_trace) {
                  print_token(tables, state, arg);
                }

              case -2:
                n1 = Short(tables[7], state);
                n2 = n1 + env[6];
                if (n1 !== 0 && n2 >= 0 && n2 <= tables[10] &&
                  Short(tables[12], n2) === env[6])
                {
                  cmd = -4;
                  continue;
                }
                n1 = Short(tables[8], state);
                n2 = n1 + env[6];
                if (n1 !== 0 && n2 >= 0 && n2 <= tables[10] &&
                  Short(tables[12], n2) === env[6])
                {
                  n = Short(tables[11], n2);
                  cmd = -7;
                  continue;
                }
                if (errflag > 0) {
                  cmd = -3;
                  continue;
                }
                env[13] = sp;
                env[14] = state;
                env[15] = errflag;
                return 5;
              /* The ML code calls the error function */
              case 5:
                sp = env[13];
                state = env[14];
                errflag = env[15];
              case -3:
                if (errflag < 3) {
                  errflag = 3;
                  while (1) {
                    state1 = env[0][sp];
                    n1 = Short(tables[7], state1);
                    n2 = n1 + 256;
                    if (n1 != 0 && n2 >= 0 && n2 <= tables[10] &&
                      Short(tables[12], n2) == 256)
                    {
                      if (caml_parser_trace) {
                        print('Recovering in state ' + state1);
                      }
                      cmd = -5;
                      continue loop;
                    } else {
                      if (caml_parser_trace) {
                        print('Discarding state ' + state1);
                      }
                      if (sp <= env[5]) {
                        if (caml_parser_trace) {
                          print('No more states to discard');
                        }
                        return 1;
                        /* The ML code raises Parse_error */
                      }
                      sp--;
                    }
                  }
                } else {
                  if (env[6] == 0) {
                    return 1;
                  }
                  /* The ML code raises Parse_error */
                  if (caml_parser_trace) {
                    print('Discarding last token read');
                  }
                  env[6] = -1;
                  cmd = -1;
                  continue;
                }

              case -4:
                env[6] = -1;
                if (errflag > 0) {
                  errflag--;
                }
              case -5:
                if (caml_parser_trace) {
                  print('State ' + state + ': shift to state ' + Short(tables[11], n2));
                }
                state = Short(tables[11], n2);
                sp++;
                if (sp < env[4]) {
                  cmd = -6;
                  continue;
                }
                env[13] = sp;
                env[14] = state;
                env[15] = errflag;
                return 2;
              /* The ML code resizes the stacks */
              case 2:
                sp = env[13];
                state = env[14];
                errflag = env[15];
              case -6:
                env[0][sp] = state;
                env[1][sp] = env[7];
                env[2][sp] = env[8];
                env[3][sp] = env[9];
                cmd = -1;
                continue;

              case -7:
                if (caml_parser_trace) {
                  print('State ' + state + ': reduce by rule ' + n);
                }
                m = Short(tables[4], n);
                env[10] = sp;
                env[12] = n;
                env[11] = m;
                sp = sp - m + 1;
                m = Short(tables[3], n);
                state1 = env[0][sp - 1];
                n1 = Short(tables[9], m);
                n2 = n1 + state1;
                if (n1 != 0 && n2 >= 0 && n2 <= tables[10] &&
                  Short(tables[12], n2) == state1)
                {
                  state = Short(tables[11], n2);
                } else {
                  state = Short(tables[6], m);
                }
                if (sp < env[4]) {
                  cmd = -8;
                  continue;
                }
                env[13] = sp;
                env[14] = state;
                env[15] = errflag;
                return 3;
              /* The ML code resizes the stacks */
              case 3:
                sp = env[13];
                state = env[14];
                errflag = env[15];
              case -8:
                env[13] = sp;
                env[14] = state;
                env[15] = errflag;
                return 4;
              /* The ML code calls the semantic action */
              case 4:
                sp = env[13];
                state = env[14];
                errflag = env[15];
                env[0][sp] = state;
                env[1][sp] = arg;
                asp = env[10];
                env[3][sp] = env[3][asp];
                if (sp > asp) {
                  /* This is an epsilon production. Take symb_start equal to symb_end. */
                  env[2][sp] = env[3][asp];
                }
                cmd = -1;

            }
          }
        };

        const caml_set_parser_trace = function (flag) {
          const oldflag = caml_parser_trace;
          caml_parser_trace = flag;
          return oldflag;
        };

        const oc$$nv = {};

// XXX name these sensibly and compactify code afterwards

        // function ___a(m, t, a)
        // {
        //   return m.apply(t, a);
        // }

        /*@cc_on @if (@_win32 && @_jscript_version >= 5)
function ___a(m, t, a) {
  if (m.apply)
    return m.apply(t, a);
  else
    // IE < 8 doesn't support apply for DOM methods, but does support 'cached' methods bound to an object
    switch (a.length) {
    case 0: return m();
    case 1: return m(a[0]);
    case 2: return m(a[0], a[1]);
    case 3: return m(a[0], a[1], a[2]);
    case 4: return m(a[0], a[1], a[2], a[3]);
    case 5: return m(a[0], a[1], a[2], a[3], a[4]);
    case 6: return m(a[0], a[1], a[2], a[3], a[4], a[5]);
    case 7: return m(a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
    default: throw 'unimplemented';
    }
}
@end @*/

        function ___m(m, t, a)
        {
          function ap(a1, a2)
          {
            // const a = new Array();
            // for (let i = 0; i < a1.length; i++) {
            //   a.push(a1[i]);
            // }
            // for (let i = 0; i < a2.length; i++) {
            //   a.push(a2[i]);
            // }
            return [...a1, ...a2];
          }

          while (true) {
            const al = a.length;
            const ml = m.length;

            if (al < ml) {
              switch (ml - al) {
                case 1:
                  return _f(function (z) {
                    return m.apply(t, [...a, z]);
                  });
                case 2:
                  return _f(function (z, y) {
                    return m.apply(t, [...a, z, y]);
                  });
                case 3:
                  return _f(function (z, y, x) {
                    return m.apply(t, [...a, z, y, x]);
                  });
                case 4:
                  return _f(function (z, y, x, w) {
                    return m.apply(t, [...a, z, y, x, w]);
                  });
                case 5:
                  return _f(function (z, y, x, w, v) {
                    return m.apply(t, [...a, z, y, x, w, v]);
                  });
                case 6:
                  return _f(function (z, y, x, w, v, u) {
                    return m.apply(t, [...a, z, y, x, w, v, u]);
                  });
                case 7:
                  return _f(function (z, y, x, w, v, u, s) {
                    return m.apply(t, [...a, z, y, x, w, v, u, s]);
                  });
                default:
                  throw 'unimplemented';
              }
            } else if (al === ml) {
              return m.apply(t, a);
            } else {
              // al > ml
              m = _m(m, t, a.slice(0, ml));
              t = m;
              a = a.slice(ml);
            }
          }
        }

        let $in_tail = false;

        // tail call
        function __m(m, t, args)
        {
          if (m.$oc) {
            if ($in_tail) {
              args.$m = m;
              args.$t = t;
              args.$tr = true;
              return args;
            }
            else {
              return _m(m, t, args);
            }
          } else {
            const old_in_tail = $in_tail;
            $in_tail = false;
            try {
              return m.apply(t, args);
            }
            finally {
              $in_tail = old_in_tail;
            }
          }
        }

        function __(t, args)
        {
          return __m(t, t, args);
        }

        // non tail call
        function _m(m, t, args)
        {
          if (m.$oc) {
            const old_in_tail = $in_tail;
            $in_tail = true;
            try {
              let v = __m(m, t, args);
              while (v && v.$tr) {
                v = ___m(v.$m, v.$t, v);
              }
              return v;
            }
            finally {
              $in_tail = old_in_tail;
            }
          } else {
            const old_in_tail = $in_tail;
            $in_tail = false;
            try {
              return m.apply(t, args);
            }
            finally {
              $in_tail = old_in_tail;
            }
          }
        }

        function _(t, args)
        {
          return _m(t, t, args);
        }

        function _f(f)
        {
          f.$oc = true;
          return f;
        }

        function $N(t, a)
        {
          const l = a.length;
          const b = new Array(l);
          for (let i = 0; i < l; i++) {
            b[i] = a[i];
          }
          b.t = t;
          return b;
        }

        function $()
        {
          return $N(0, arguments);
        }

        function $1()
        {
          return $N(1, arguments);
        }

        function $2()
        {
          return $N(2, arguments);
        }

        function $3()
        {
          return $N(3, arguments);
        }

        function $4()
        {
          return $N(4, arguments);
        }

        function $5()
        {
          return $N(5, arguments);
        }

        function $6()
        {
          return $N(6, arguments);
        }

        function $7()
        {
          return $N(7, arguments);
        }

        function $8()
        {
          return $N(8, arguments);
        }

        function $9()
        {
          return $N(9, arguments);
        }

        function $t(a)
        {
          return a.t;
        }

        function $xM(t)
        {
          return {$t: t};
        }

        function $xN(t, a)
        {
          a.$t = t;
          return a;
        }

        function $xt(a)
        {
          return a.$t;
        }

        function oc$$arefs(o, i)
        {
          return i < o.length ? o[i] : oc$Pervasives$[0]('index out of bounds');
        }

        function oc$$asets(o, i, v)
        {
          return i < o.length ? o[i] = v : oc$Pervasives$[0]('index out of bounds');
        }

// mutable strings, argh

        function oc$$ms(a)
        {
          this.a = a;
          this.length = a.length;
        }

// XXX cache the string rep?
        oc$$ms.prototype.toString = function () {
          return String.fromCharCode.apply(null, this.a);
        };

        function oc$$lms(s)
        {
          const l = s.length;
          const a = new Array(l);
          for (let i = 0; i < l; i++) {
            a[i] = s.charCodeAt(i);
          }
          return new oc$$ms(a);
        }

        function oc$$cms(n)
        {
          return new oc$$ms(new Array(n));
        }

        function oc$$srefu(o, i)
        {
          return typeof o == 'string' ? o.charCodeAt(i) : o.a[i];
        }

        function oc$$ssetu(o, i, v)
        {
          o.a[i] = v;
        }

        function oc$$srefs(o, i)
        {
          return i < o.length ? oc$$srefu(o, i) : oc$Pervasives$[0]('index out of bounds');
        }

        function oc$$ssets(o, i, v)
        {
          return i < o.length ? oc$$ssetu(o, i, v) : oc$Pervasives$[0]('index out of bounds');
        }

        function oc$$seq(s1, s2)
        {
          return s1.toString() == s2.toString();
        }

        function oc$$sneq(s1, s2)
        {
          return s1.toString() != s2.toString();
        }

        function oc$$slt(s1, s2)
        {
          return s1.toString() < s2.toString();
        }

        function oc$$sgt(s1, s2)
        {
          return s1.toString() > s2.toString();
        }

        function oc$$slte(s1, s2)
        {
          return s1.toString() <= s2.toString();
        }

        function oc$$sgte(s1, s2)
        {
          return s1.toString() >= s2.toString();
        }

        /*
**  sprintf.js -- POSIX sprintf(3) style formatting function for JavaScript
**  Copyright (c) 2006-2007 Ralf S. Engelschall <rse@engelschall.com>
**  Partly based on Public Domain code by Jan Moesen <http://jan.moesen.nu/>
**  Licensed under GPL <http://www.gnu.org/licenses/gpl.txt>
**
**  modified for ocamljs to more closely match Linux
**
**  $LastChangedDate$
**  $LastChangedRevision$
*/

        /*  make sure the ECMAScript 3.0 Number.toFixed() method is available  */
        if (typeof Number.prototype.toFixed != 'undefined') {
          (
            function () {
              /*  see http://www.jibbering.com/faq/#FAQ4_6 for details  */
              function Stretch(Q, L, c)
              {
                let S = Q;
                if (c.length > 0) {
                  while (S.length < L) {
                    S = c + S;
                  }
                }
                return S;
              }

              function StrU(X, M, N)
              { /* X >= 0.0 */
                let T;
                const S = String(Math.round(X * Number('1e' + N)));
                if (S.search && S.search(/\D/) != -1) {
                  return '' + X;
                }
                const RR = String(Stretch(S, M + N, '0'));
                return RR.substring(
                  0, T = (
                    length - N
                  )) + '.' + substring(T);
              }

              function Sign(X)
              {
                return X < 0 ? '-' : '';
              }

              function StrS(X, M, N)
              {
                return Sign(X) + StrU(Math.abs(X), M, N);
              }

              Number.prototype.toFixed = function (n) {
                return StrS(this, 1, n)
              };
            }
          )();
        }

        /*  the sprintf() function  */
        const oc$$sprintf = function () {
          /*  argument sanity checking  */
          if (!arguments || arguments.length < 1) {
            alert('sprintf:ERROR: not enough arguments 1');
          }

          /*  initialize processing queue  */
          let argumentnum = 0;
          let done = '',
            todo = arguments[argumentnum++];

          /*  parse still to be done format string  */
          let m;
          while (
            m = /^([^%]*)%(\d+$)?([\-#0\ +\']+)?(\*|\d+)?(\.\*|\.\d+)?([%dioulLnNxXfFgGcs])(.*)$/.exec(todo)
            )
          {
            let pProlog = m[1],
              pAccess = m[2],
              pFlags = m[3],
              pMinLength = m[4],
              pPrecision = m[5],
              pType = m[6],
              pEpilog = m[7];

            /*  determine substitution  */
            let subst;
            if (pType == '%')
            /*  special case: escaped percent character  */{
              subst = '%';
            } else {
              /*  parse padding and justify aspects of flags  */
              let padWith = ' ';
              let justifyRight = true;
              if (pFlags) {
                if (pFlags.indexOf('0') >= 0) {
                  padWith = '0';
                }
                if (pFlags.indexOf('-') >= 0) {
                  padWith = ' ';
                  justifyRight = false;
                }
              }
              else {
                pFlags = '';
              }

              /*  determine minimum length  */
              let minLength = -1;
              if (pMinLength) {
                if (pMinLength == '*') {
                  const access = argumentnum++;
                  if (access >= arguments.length) {
                    alert('sprintf:ERROR: not enough arguments 2');
                  }
                  minLength = arguments[access];
                }
                else {
                  minLength = parseInt(pMinLength, 10);
                }
              }

              /*  determine precision  */
              let precision = -1;
              if (pPrecision) {
                if (pPrecision == '.*') {
                  const access = argumentnum++;
                  if (access >= arguments.length) {
                    alert('sprintf:ERROR: not enough arguments 3');
                  }
                  precision = arguments[access];
                }
                else {
                  precision = parseInt(pPrecision.substring(1), 10);
                }
              }

              /*  determine how to fetch argument  */
              let access = argumentnum++;
              if (pAccess) {
                access = parseInt(pAccess.substring(0, pAccess.length - 1), 10);
              }
              if (access >= arguments.length) {
                alert('sprintf:ERROR: not enough arguments 4');
              }

              /*  dispatch into expansions according to type  */
              let prefix = '';
              switch (pType) {
                case 'd':
                case 'i':
                  subst = arguments[access];
                  if (typeof subst != 'number') {
                    subst = 0;
                  }
                  subst = subst.toString(10);
                  if (pFlags.indexOf('#') >= 0 && subst >= 0) {
                    subst = '+' + subst;
                  }
                  if (pFlags.indexOf(' ') >= 0 && subst >= 0) {
                    subst = ' ' + subst;
                  }
                  break;
                case 'o':
                  subst = arguments[access];
                  if (typeof subst != 'number') {
                    subst = 0;
                  }
                  subst = subst.toString(8);
                  break;
                case 'u':
                case 'l':
                case 'L':
                case 'n':
                case 'N':
                  subst = arguments[access];
                  if (typeof subst != 'number') {
                    subst = 0;
                  }
                  subst = Math.abs(subst);
                  subst = subst.toString(10);
                  break;
                case 'x':
                  subst = arguments[access];
                  if (typeof subst != 'number') {
                    subst = 0;
                  }
                  subst = subst.toString(16)
                    .toLowerCase();
                  if (pFlags.indexOf('#') >= 0) {
                    prefix = '0x';
                  }
                  break;
                case 'X':
                  subst = arguments[access];
                  if (typeof subst != 'number') {
                    subst = 0;
                  }
                  subst = subst.toString(16)
                    .toUpperCase();
                  if (pFlags.indexOf('#') >= 0) {
                    prefix = '0X';
                  }
                  break;
                case 'f':
                case 'F':
                case 'g':
                case 'G':
                  subst = arguments[access];
                  if (typeof subst != 'number') {
                    subst = 0.0;
                  }
                  subst = 0.0 + subst;
                  if (precision > -1) {
                    if (subst.toFixed) {
                      subst = subst.toFixed(precision);
                    } else {
                      subst = (
                        Math.round(subst * Math.pow(10, precision)) / Math.pow(10, precision)
                      );
                      subst += '0000000000';
                      subst = subst.substr(0, subst.indexOf('.') + precision + 1);
                    }
                  }
                  subst = '' + subst;
                  if (pFlags.indexOf('\'') >= 0) {
                    let k = 0;
                    for (let i = (subst.length - 1) - 3; i >= 0; i -= 3)
                    {
                      subst = subst.substring(0, i) + (k === 0 ? '.' : ',') + subst.substring(i);
                      k = (k + 1) % 2;
                    }
                  }
                  subst = subst.replace('Infinity', 'inf');
                  subst = subst.replace('NaN', 'nan');
                  break;
                case 'c':
                  subst = arguments[access];
                  if (typeof subst !== 'number') {
                    subst = 0;
                  }
                  subst = String.fromCharCode(subst);
                  break;
                case 's':
                  subst = arguments[access];
                  if (precision > -1) {
                    subst = subst.substr(0, precision);
                  }
                  if (typeof subst !== 'string') {
                    subst = '';
                  }
                  break;
              }

              /*  apply optional padding  */
              const padding = minLength - subst.toString().length - prefix.toString().length;
              if (padding > 0) {
                const arrTmp = new Array(padding + 1);
                if (justifyRight) {
                  subst = arrTmp.join(padWith) + subst;
                } else {
                  subst = subst + arrTmp.join(padWith);
                }
              }

              /*  add optional prefix  */
              subst = prefix + subst;
            }

            /*  update the processing queue  */
            done = done + pProlog + subst;
            todo = pEpilog;
          }
          return (done + todo);
        };

        /*@cc_on @if (@_win32 && @_jscript_version >= 5) if (!window.XMLHttpRequest)
window.XMLHttpRequest = function() { return new ActiveXObject('Microsoft.XMLHTTP') };
@end @*/
        const oc$Pervasives$ =
          function () {
            const failwith$54 = _f(function (s$55) {
              throw $(Failure$19g, s$55);
            });
            const invalid_arg$56 = _f(function (s$57) {
              throw $(Invalid_argument$18g, s$57);
            });
            const Exit$58 = $('Pervasives.Exit');
            const min$66 = _f(function (x$67, y$68) {
              if (caml_lessequal(x$67, y$68)) {
                return x$67;
              }
              return y$68;
            });
            const max$69 = _f(function (x$70, y$71) {
              if (caml_greaterequal(x$70, y$71)) {
                return x$70;
              }
              return y$71;
            });
            const abs$87 = _f(function (x$88) {
              if (x$88 >= 0) {
                return x$88;
              }
              return -x$88;
            });
            const lnot$92 = _f(function (x$93) {
              return x$93 ^ -1;
            });
            const min_int$97 = 1 << (
              1 << 31 === 0 ? 30 : 62
            );
            const max_int$98 = min_int$97 - 1;
            const infinity$131 = caml_int64_float_of_bits('9218868437227405312');
            const neg_infinity$132 = caml_int64_float_of_bits('-4503599627370496');
            const nan$133 = caml_int64_float_of_bits('9218868437227405313');
            const max_float$134 = caml_int64_float_of_bits('9218868437227405311');
            const min_float$135 = caml_int64_float_of_bits('4503599627370496');
            const epsilon_float$136 = caml_int64_float_of_bits('4372995238176751616');
            const $5E$152 = _f(function (s1$153, s2$154) {
              return s1$153.toString() + s2$154.toString();
            });
            const char_of_int$157 =
              _f(function (n$158) {
                if (n$158 < 0 || n$158 > 255) {
                  return __(invalid_arg$56, ['char_of_int']);
                }
                return n$158;
              });
            const string_of_bool$164 = _f(function (b$165) {
              if (b$165) {
                return 'true';
              }
              return 'false';
            });
            const bool_of_string$166 =
              _f(function (param$428) {
                if (!oc$$sneq(param$428, 'false')) {
                  return false;
                }
                if (oc$$sneq(param$428, 'true')) {
                  return __(invalid_arg$56, ['bool_of_string']);
                }
                return true;
              });
            const string_of_int$167 = _f(function (n$168) {
              return caml_format_int('%d', n$168);
            });
            const String$171 = $();
            const valid_float_lexem$172 =
              _f(function (s$173) {
                const l$174 = s$173.length;
                const loop$175 =
                  _f(function (i$176) {
                    if (i$176 >= l$174) {
                      return __($5E$152, [s$173, '.']);
                    }
                    const match$427 = oc$$srefs(s$173, i$176);
                    let $r58 = false;
                    r$58: {
                      {
                        if (!(
                          match$427 >= 48
                        ))
                        {
                          {
                            if (!(
                              match$427 !== 45
                            ))
                            {
                              {
                                $r58 = true;
                                break r$58;
                              }
                            }
                            return s$173;
                          }
                        }
                        if (!(
                          match$427 >= 58
                        ))
                        {
                          {
                            $r58 = true;
                            break r$58;
                          }
                        }
                        return s$173;
                      }
                    }
                    if ($r58) {
                      return __(loop$175, [i$176 + 1]);
                    }
                  });
                return __(loop$175, [0]);
              });
            const string_of_float$177 = _f(function (f$178) {
              return __(valid_float_lexem$172, [oc$$sprintf('%.12g', f$178)]);
            });
            const $40$180 =
              _f(function (l1$181, l2$182) {
                if (l1$181) {
                  return $(l1$181[0], _($40$180, [l1$181[1], l2$182]));
                }
                return l2$182;
              });
            const stdin$189 = caml_ml_open_descriptor_in(0);
            const stdout$190 = caml_ml_open_descriptor_out(1);
            const stderr$191 = caml_ml_open_descriptor_out(2);
            const open_out_gen$212 =
              _f(function (mode$213, perm$214, name$215) {
                return caml_ml_open_descriptor_out(caml_sys_open(name$215, mode$213, perm$214));
              });
            const open_out$216 = _f(function (name$217) {
              return __(open_out_gen$212, [$(1, $(3, $(4, $(7, 0)))), 438, name$217]);
            });
            const open_out_bin$218 = _f(function (name$219) {
              return __(open_out_gen$212, [$(1, $(3, $(4, $(6, 0)))), 438, name$219]);
            });
            const flush_all$222 =
              _f(function (param$424) {
                const iter$223 =
                  _f(function (param$425) {
                    if (param$425) {
                      {
                        try {
                          caml_ml_flush(param$425[0]);
                        } catch (exn$426) {
                        }
                        return __(iter$223, [param$425[1]]);
                      }
                    }
                    return 0;
                  });
                return __(iter$223, [caml_ml_out_channels_list(0)]);
              });
            const output_string$228 = _f(function (oc$229, s$230) {
              return caml_ml_output(oc$229, s$230, 0, s$230.length);
            });
            const output$231 =
              _f(function (oc$232, s$233, ofs$234, len$235) {
                if (ofs$234 < 0 || (
                  len$235 < 0 || ofs$234 > s$233.length - len$235
                ))
                {
                  return __(invalid_arg$56, ['output']);
                }
                return caml_ml_output(oc$232, s$233, ofs$234, len$235);
              });
            const output_value$239 = _f(function (chan$240, v$241) {
              return caml_output_value(chan$240, v$241, 0);
            });
            const close_out$246 = _f(function (oc$247) {
              caml_ml_flush(oc$247);
              return caml_ml_close_channel(oc$247);
            });
            const close_out_noerr$248 =
              _f(function (oc$249) {
                try {
                  caml_ml_flush(oc$249);
                } catch (exn$423) {
                }
                try {
                  return caml_ml_close_channel(oc$249);
                } catch (exn$422) {
                  return 0;
                }
              });
            const open_in_gen$251 =
              _f(function (mode$252, perm$253, name$254) {
                return caml_ml_open_descriptor_in(caml_sys_open(name$254, mode$252, perm$253));
              });
            const open_in$255 = _f(function (name$256) {
              return __(open_in_gen$251, [$(0, $(7, 0)), 0, name$256]);
            });
            const open_in_bin$257 = _f(function (name$258) {
              return __(open_in_gen$251, [$(0, $(6, 0)), 0, name$258]);
            });
            const input$261 =
              _f(function (ic$262, s$263, ofs$264, len$265) {
                if (ofs$264 < 0 || (
                  len$265 < 0 || ofs$264 > s$263.length - len$265
                ))
                {
                  return __(invalid_arg$56, ['input']);
                }
                return caml_ml_input(ic$262, s$263, ofs$264, len$265);
              });
            const unsafe_really_input$266 =
              _f(function (ic$267, s$268, ofs$269, len$270) {
                if (len$270 <= 0) {
                  return 0;
                }
                const r$271 = caml_ml_input(ic$267, s$268, ofs$269, len$270);
                if (r$271 === 0) {
                  throw $(End_of_file$22g);
                }
                return __(unsafe_really_input$266, [ic$267, s$268, ofs$269 + r$271, len$270 - r$271]);
              });
            const really_input$272 =
              _f(function (ic$273, s$274, ofs$275, len$276) {
                if (ofs$275 < 0 || (
                  len$276 < 0 || ofs$275 > s$274.length - len$276
                ))
                {
                  return __(invalid_arg$56, ['really_input']);
                }
                return __(unsafe_really_input$266, [ic$273, s$274, ofs$275, len$276]);
              });
            const input_line$278 =
              _f(function (chan$279) {
                const build_result$280 =
                  _f(function (buf$281, pos$282, param$421) {
                    if (param$421) {
                      {
                        const hd$283 = param$421[0];
                        const len$285 = hd$283.length;
                        caml_blit_string(hd$283, 0, buf$281, pos$282 - len$285, len$285);
                        return __(build_result$280, [buf$281, pos$282 - len$285, param$421[1]]);
                      }
                    }
                    return buf$281;
                  });
                const scan$286 =
                  _f(function (accu$287, len$288) {
                    const n$289 = caml_ml_input_scan_line(chan$279);
                    if (!(
                      n$289 === 0
                    ))
                    {
                      {
                        if (n$289 > 0) {
                          {
                            const res$290 = oc$$cms(n$289 - 1);
                            caml_ml_input(chan$279, res$290, 0, n$289 - 1);
                            caml_ml_input_char(chan$279);
                            if (accu$287) {
                              {
                                const len$291 = len$288 + n$289 - 1;
                                return __(
                                  build_result$280, [oc$$cms(len$291), len$291, $(res$290, accu$287)]);
                              }
                            }
                            return res$290;
                          }
                        }
                        const beg$292 = oc$$cms(-n$289);
                        caml_ml_input(chan$279, beg$292, 0, -n$289);
                        return __(scan$286, [$(beg$292, accu$287), len$288 - n$289]);
                      }
                    }
                    if (accu$287) {
                      return __(build_result$280, [oc$$cms(len$288), len$288, accu$287]);
                    }
                    throw $(End_of_file$22g);
                  });
                return __(scan$286, [0, 0]);
              });
            const close_in_noerr$300 = _f(function (ic$301) {
              try {
                return caml_ml_close_channel(ic$301);
              } catch (exn$420) {
                return 0;
              }
            });
            const print_char$303 = _f(function (c$304) {
              return caml_ml_output_char(stdout$190, c$304);
            });
            const print_string$305 = _f(function (s$306) {
              return __(output_string$228, [stdout$190, s$306]);
            });
            const print_int$307 = _f(function (i$308) {
              return __(output_string$228, [stdout$190, _(string_of_int$167, [i$308])]);
            });
            const print_float$309 = _f(function (f$310) {
              return __(output_string$228, [stdout$190, _(string_of_float$177, [f$310])]);
            });
            const print_endline$311 =
              _f(function (s$312) {
                _(output_string$228, [stdout$190, s$312]);
                caml_ml_output_char(stdout$190, 10);
                return caml_ml_flush(stdout$190);
              });
            const print_newline$313 = _f(function (param$419) {
              caml_ml_output_char(stdout$190, 10);
              return caml_ml_flush(stdout$190);
            });
            const prerr_char$314 = _f(function (c$315) {
              return caml_ml_output_char(stderr$191, c$315);
            });
            const prerr_string$316 = _f(function (s$317) {
              return __(output_string$228, [stderr$191, s$317]);
            });
            const prerr_int$318 = _f(function (i$319) {
              return __(output_string$228, [stderr$191, _(string_of_int$167, [i$319])]);
            });
            const prerr_float$320 = _f(function (f$321) {
              return __(output_string$228, [stderr$191, _(string_of_float$177, [f$321])]);
            });
            const prerr_endline$322 =
              _f(function (s$323) {
                _(output_string$228, [stderr$191, s$323]);
                caml_ml_output_char(stderr$191, 10);
                return caml_ml_flush(stderr$191);
              });
            const prerr_newline$324 = _f(function (param$418) {
              caml_ml_output_char(stderr$191, 10);
              return caml_ml_flush(stderr$191);
            });
            const read_line$325 = _f(function (param$417) {
              caml_ml_flush(stdout$190);
              return __(input_line$278, [stdin$189]);
            });
            const read_int$326 = _f(function (param$416) {
              return caml_int_of_string(_(read_line$325, [0]));
            });
            const read_float$327 = _f(function (param$415) {
              return caml_float_of_string(_(read_line$325, [0]));
            });
            const LargeFile$334 = $();
            const $5E$5E$349 = _f(function (fmt1$350, fmt2$351) {
              return _($5E$152, [fmt1$350, fmt2$351]);
            });
            const string_of_format$352 =
              _f(function (fmt$353) {
                const s$354 = fmt$353;
                const l$355 = s$354.length;
                const r$356 = oc$$cms(l$355);
                caml_blit_string(s$354, 0, r$356, 0, l$355);
                return r$356;
              });
            const exit_function$358 = $(flush_all$222);
            const at_exit$359 =
              _f(function (f$360) {
                const g$361 = exit_function$358[0];
                return exit_function$358[0] = _f(function (param$414) {
                  _(f$360, [0]);
                  return __(g$361, [0]);
                });
              });
            const do_at_exit$362 = _f(function (param$413) {
              return __(exit_function$358[0], [0]);
            });
            const exit$363 = _f(function (retcode$364) {
              _(do_at_exit$362, [0]);
              return caml_sys_exit(retcode$364);
            });
            caml_register_named_value('Pervasives.do_at_exit', do_at_exit$362);
            return $(invalid_arg$56, failwith$54, Exit$58, min$66, max$69, abs$87, max_int$98, min_int$97,
              lnot$92, infinity$131,
              neg_infinity$132, nan$133, max_float$134, min_float$135, epsilon_float$136, $5E$152,
              char_of_int$157,
              string_of_bool$164, bool_of_string$166, string_of_int$167, string_of_float$177, $40$180,
              stdin$189, stdout$190,
              stderr$191, print_char$303, print_string$305, print_int$307, print_float$309,
              print_endline$311, print_newline$313,
              prerr_char$314, prerr_string$316, prerr_int$318, prerr_float$320, prerr_endline$322,
              prerr_newline$324, read_line$325,
              read_int$326, read_float$327, open_out$216, open_out_bin$218, open_out_gen$212,
              _f(function (prim$381) {
                return caml_ml_flush(prim$381);
              }), flush_all$222,
              _f(function (prim$383, prim$382) {
                return caml_ml_output_char(prim$383, prim$382);
              }), output_string$228, output$231,
              _f(function (prim$385, prim$384) {
                return caml_ml_output_char(prim$385, prim$384);
              }),
              _f(function (prim$387, prim$386) {
                return caml_ml_output_int(prim$387, prim$386);
              }), output_value$239,
              _f(function (prim$389, prim$388) {
                return caml_ml_seek_out(prim$389, prim$388);
              }),
              _f(function (prim$390) {
                return caml_ml_pos_out(prim$390);
              }),
              _f(function (prim$391) {
                return caml_ml_channel_size(prim$391);
              }), close_out$246, close_out_noerr$248,
              _f(function (prim$393, prim$392) {
                return caml_ml_set_binary_mode(prim$393, prim$392);
              }), open_in$255,
              open_in_bin$257, open_in_gen$251, _f(function (prim$394) {
                return caml_ml_input_char(prim$394);
              }), input_line$278,
              input$261, really_input$272, _f(function (prim$395) {
                return caml_ml_input_char(prim$395);
              }),
              _f(function (prim$396) {
                return caml_ml_input_int(prim$396);
              }),
              _f(function (prim$397) {
                return caml_input_value(prim$397);
              }),
              _f(function (prim$399, prim$398) {
                return caml_ml_seek_in(prim$399, prim$398);
              }),
              _f(function (prim$400) {
                return caml_ml_pos_in(prim$400);
              }),
              _f(function (prim$401) {
                return caml_ml_channel_size(prim$401);
              }),
              _f(function (prim$402) {
                return caml_ml_close_channel(prim$402);
              }), close_in_noerr$300,
              _f(function (prim$404, prim$403) {
                return caml_ml_set_binary_mode(prim$404, prim$403);
              }),
              $(
                _f(function (prim$406, prim$405) {
                  return caml_ml_seek_out_64(prim$406, prim$405);
                }),
                _f(function (prim$407) {
                  return caml_ml_pos_out_64(prim$407);
                }),
                _f(function (prim$408) {
                  return caml_ml_channel_size_64(prim$408);
                }),
                _f(function (prim$410, prim$409) {
                  return caml_ml_seek_in_64(prim$410, prim$409);
                }),
                _f(function (prim$411) {
                  return caml_ml_pos_in_64(prim$411);
                }),
                _f(function (prim$412) {
                  return caml_ml_channel_size_64(prim$412);
                })), string_of_format$352, $5E$5E$349, exit$363,
              at_exit$359, valid_float_lexem$172, unsafe_really_input$266, do_at_exit$362);
          }();
        const oc$Char$ =
          function () {
            const chr$60 = _f(function (n$61) {
              if (n$61 < 0 || n$61 > 255) {
                return __(oc$Pervasives$[0], ['Char.chr']);
              }
              return n$61;
            });
            const escaped$66 =
              _f(function (c$67) {
                let $r7 = false;
                r$7: {
                  {
                    if (!(
                      c$67 !== 39
                    ))
                    {
                      return '\\\'';
                    }
                    if (!(
                      c$67 !== 92
                    ))
                    {
                      return '\\\\';
                    }
                    if (c$67 >= 14) {
                      {
                        $r7 = true;
                        break r$7;
                      }
                    }
                    switch (c$67) {
                      case 0:
                        $r7 = true;
                        break r$7;
                      case 1:
                        $r7 = true;
                        break r$7;
                      case 2:
                        $r7 = true;
                        break r$7;
                      case 3:
                        $r7 = true;
                        break r$7;
                      case 4:
                        $r7 = true;
                        break r$7;
                      case 5:
                        $r7 = true;
                        break r$7;
                      case 6:
                        $r7 = true;
                        break r$7;
                      case 7:
                        $r7 = true;
                        break r$7;
                      case 8:
                        return '\\b';
                      case 9:
                        return '\\t';
                      case 10:
                        return '\\n';
                      case 11:
                        $r7 = true;
                        break r$7;
                      case 12:
                        $r7 = true;
                        break r$7;
                      case 13:
                        return '\\r';
                      default:
                        return null;
                    }
                  }
                }
                if ($r7) {
                  {
                    if (caml_is_printable(c$67)) {
                      {
                        const s$68 = oc$$cms(1);
                        oc$$ssetu(s$68, 0, c$67);
                        return s$68;
                      }
                    }
                    const n$69 = c$67;
                    const s$70 = oc$$cms(4);
                    oc$$ssetu(s$70, 0, 92);
                    oc$$ssetu(s$70, 1, 48 + (
                      n$69 / 100 >> 0
                    ));
                    oc$$ssetu(s$70, 2, 48 + (
                      n$69 / 10 >> 0
                    ) % 10);
                    oc$$ssetu(s$70, 3, 48 + n$69 % 10);
                    return s$70;
                  }
                }
              });
            const lowercase$71 =
              _f(function (c$72) {
                if (c$72 >= 65 && c$72 <= 90 || (
                  c$72 >= 192 && c$72 <= 214 || c$72 >= 216 && c$72 <= 222
                ))
                {
                  return c$72 + 32;
                }
                return c$72;
              });
            const uppercase$73 =
              _f(function (c$74) {
                if (c$74 >= 97 && c$74 <= 122 || (
                  c$74 >= 224 && c$74 <= 246 || c$74 >= 248 && c$74 <= 254
                ))
                {
                  return c$74 - 32;
                }
                return c$74;
              });
            const compare$76 = _f(function (c1$77, c2$78) {
              return c1$77 - c2$78;
            });
            return $(chr$60, escaped$66, lowercase$71, uppercase$73, compare$76);
          }();
        const oc$List$ =
          function () {
            const length_aux$58 =
              _f(function (len$59, param$394) {
                if (param$394) {
                  return __(length_aux$58, [len$59 + 1, param$394[1]]);
                }
                return len$59;
              });
            const length$62 = _f(function (l$63) {
              return __(length_aux$58, [0, l$63]);
            });
            const hd$64 = _f(function (param$393) {
              if (param$393) {
                return param$393[0];
              }
              return __(oc$Pervasives$[1], ['hd']);
            });
            const tl$67 = _f(function (param$392) {
              if (param$392) {
                return param$392[1];
              }
              return __(oc$Pervasives$[1], ['tl']);
            });
            const nth$70 =
              _f(function (l$71, n$72) {
                if (n$72 < 0) {
                  return __(oc$Pervasives$[0], ['List.nth']);
                }
                const nth_aux$73 =
                  _f(function (l$74, n$75) {
                    if (!l$74) {
                      return __(oc$Pervasives$[1], ['nth']);
                    }
                    if (n$75 === 0) {
                      return l$74[0];
                    }
                    return __(nth_aux$73, [l$74[1], n$75 - 1]);
                  });
                return __(nth_aux$73, [l$71, n$72]);
              });
            const append$78 = oc$Pervasives$[21];
            const rev_append$79 =
              _f(function (l1$80, l2$81) {
                if (l1$80) {
                  return __(rev_append$79, [l1$80[1], $(l1$80[0], l2$81)]);
                }
                return l2$81;
              });
            const rev$84 = _f(function (l$85) {
              return __(rev_append$79, [l$85, 0]);
            });
            const flatten$86 =
              _f(function (param$391) {
                if (param$391) {
                  return __(oc$Pervasives$[21], [param$391[0], _(flatten$86, [param$391[1]])]);
                }
                return 0;
              });
            const map$90 =
              _f(function (f$91, param$390) {
                if (param$390) {
                  {
                    const r$94 = _(f$91, [param$390[0]]);
                    return $(r$94, _(map$90, [f$91, param$390[1]]));
                  }
                }
                return 0;
              });
            const rev_map$95 =
              _f(function (f$96, l$97) {
                const rmap_f$98 =
                  _f(function (accu$99, param$389) {
                    if (param$389) {
                      return __(
                        rmap_f$98, [$(_(f$96, [param$389[0]]), accu$99), param$389[1]]);
                    }
                    return accu$99;
                  });
                return __(rmap_f$98, [0, l$97]);
              });
            const iter$102 =
              _f(function (f$103, param$388) {
                if (param$388) {
                  {
                    _(f$103, [param$388[0]]);
                    return __(iter$102, [f$103, param$388[1]]);
                  }
                }
                return 0;
              });
            const fold_left$106 =
              _f(function (f$107, accu$108, l$109) {
                if (l$109) {
                  return __(fold_left$106, [f$107, _(f$107, [accu$108, l$109[0]]), l$109[1]]);
                }
                return accu$108;
              });
            const fold_right$112 =
              _f(function (f$113, l$114, accu$115) {
                if (l$114) {
                  return __(f$113, [l$114[0], _(fold_right$112, [f$113, l$114[1], accu$115])]);
                }
                return accu$115;
              });
            const map2$118 =
              _f(function (f$119, l1$120, l2$121) {
                let $r34 = false;
                r$34: {
                  {
                    if (!l1$120) {
                      {
                        if (l2$121) {
                          {
                            $r34 = true;
                            break r$34;
                          }
                        }
                        return 0;
                      }
                    }
                    if (!l2$121) {
                      {
                        $r34 = true;
                        break r$34;
                      }
                    }
                    const r$126 = _(f$119, [l1$120[0], l2$121[0]]);
                    return $(r$126, _(map2$118, [f$119, l1$120[1], l2$121[1]]));
                  }
                }
                if ($r34) {
                  return __(oc$Pervasives$[0], ['List.map2']);
                }
              });
            const rev_map2$127 =
              _f(function (f$128, l1$129, l2$130) {
                const rmap2_f$131 =
                  _f(function (accu$132, l1$133, l2$134) {
                    let $r31 = false;
                    r$31: {
                      {
                        if (!l1$133) {
                          {
                            if (l2$134) {
                              {
                                $r31 = true;
                                break r$31;
                              }
                            }
                            return accu$132;
                          }
                        }
                        if (!l2$134) {
                          {
                            $r31 = true;
                            break r$31;
                          }
                        }
                        return __(
                          rmap2_f$131,
                          [$(_(f$128, [l1$133[0], l2$134[0]]), accu$132), l1$133[1], l2$134[1]]);
                      }
                    }
                    if ($r31) {
                      return __(oc$Pervasives$[0], ['List.rev_map2']);
                    }
                  });
                return __(rmap2_f$131, [0, l1$129, l2$130]);
              });
            const iter2$139 =
              _f(function (f$140, l1$141, l2$142) {
                let $r30 = false;
                r$30: {
                  {
                    if (!l1$141) {
                      {
                        if (l2$142) {
                          {
                            $r30 = true;
                            break r$30;
                          }
                        }
                        return 0;
                      }
                    }
                    if (!l2$142) {
                      {
                        $r30 = true;
                        break r$30;
                      }
                    }
                    _(f$140, [l1$141[0], l2$142[0]]);
                    return __(iter2$139, [f$140, l1$141[1], l2$142[1]]);
                  }
                }
                if ($r30) {
                  return __(oc$Pervasives$[0], ['List.iter2']);
                }
              });
            const fold_left2$147 =
              _f(function (f$148, accu$149, l1$150, l2$151) {
                let $r29 = false;
                r$29: {
                  {
                    if (!l1$150) {
                      {
                        if (l2$151) {
                          {
                            $r29 = true;
                            break r$29;
                          }
                        }
                        return accu$149;
                      }
                    }
                    if (!l2$151) {
                      {
                        $r29 = true;
                        break r$29;
                      }
                    }
                    return __(
                      fold_left2$147,
                      [f$148, _(f$148, [accu$149, l1$150[0], l2$151[0]]), l1$150[1], l2$151[1]]);
                  }
                }
                if ($r29) {
                  return __(oc$Pervasives$[0], ['List.fold_left2']);
                }
              });
            const fold_right2$156 =
              _f(function (f$157, l1$158, l2$159, accu$160) {
                let $r28 = false;
                r$28: {
                  {
                    if (!l1$158) {
                      {
                        if (l2$159) {
                          {
                            $r28 = true;
                            break r$28;
                          }
                        }
                        return accu$160;
                      }
                    }
                    if (!l2$159) {
                      {
                        $r28 = true;
                        break r$28;
                      }
                    }
                    return __(
                      f$157,
                      [l1$158[0], l2$159[0], _(fold_right2$156, [f$157, l1$158[1], l2$159[1], accu$160])]);
                  }
                }
                if ($r28) {
                  return __(oc$Pervasives$[0], ['List.fold_right2']);
                }
              });
            const for_all$165 =
              _f(function (p$166, param$377) {
                if (param$377) {
                  return _(p$166, [param$377[0]]) && _(for_all$165, [p$166, param$377[1]]);
                }
                return true;
              });
            const exists$169 =
              _f(function (p$170, param$376) {
                if (param$376) {
                  return _(p$170, [param$376[0]]) || _(exists$169, [p$170, param$376[1]]);
                }
                return false;
              });
            const for_all2$173 =
              _f(function (p$174, l1$175, l2$176) {
                let $r27 = false;
                r$27: {
                  {
                    if (!l1$175) {
                      {
                        if (l2$176) {
                          {
                            $r27 = true;
                            break r$27;
                          }
                        }
                        return true;
                      }
                    }
                    if (!l2$176) {
                      {
                        $r27 = true;
                        break r$27;
                      }
                    }
                    return _(p$174, [l1$175[0], l2$176[0]]) && _(
                      for_all2$173, [p$174, l1$175[1], l2$176[1]]);
                  }
                }
                if ($r27) {
                  return __(oc$Pervasives$[0], ['List.for_all2']);
                }
              });
            const exists2$181 =
              _f(function (p$182, l1$183, l2$184) {
                let $r26 = false;
                r$26: {
                  {
                    if (!l1$183) {
                      {
                        if (l2$184) {
                          {
                            $r26 = true;
                            break r$26;
                          }
                        }
                        return false;
                      }
                    }
                    if (!l2$184) {
                      {
                        $r26 = true;
                        break r$26;
                      }
                    }
                    return _(p$182, [l1$183[0], l2$184[0]]) || _(
                      exists2$181, [p$182, l1$183[1], l2$184[1]]);
                  }
                }
                if ($r26) {
                  return __(oc$Pervasives$[0], ['List.exists2']);
                }
              });
            const mem$189 =
              _f(function (x$190, param$371) {
                if (param$371) {
                  return caml_compare(param$371[0], x$190) === 0 || _(
                    mem$189, [x$190, param$371[1]]);
                }
                return false;
              });
            const memq$193 =
              _f(function (x$194, param$370) {
                if (param$370) {
                  return param$370[0] === x$194 || _(memq$193, [x$194, param$370[1]]);
                }
                return false;
              });
            const assoc$197 =
              _f(function (x$198, param$368) {
                if (param$368) {
                  {
                    const match$369 = param$368[0];
                    if (caml_compare(match$369[0], x$198) === 0) {
                      return match$369[1];
                    }
                    return __(assoc$197, [x$198, param$368[1]]);
                  }
                }
                throw $(Not_found$20g);
              });
            const assq$202 =
              _f(function (x$203, param$366) {
                if (param$366) {
                  {
                    const match$367 = param$366[0];
                    if (match$367[0] === x$203) {
                      return match$367[1];
                    }
                    return __(assq$202, [x$203, param$366[1]]);
                  }
                }
                throw $(Not_found$20g);
              });
            const mem_assoc$207 =
              _f(function (x$208, param$364) {
                if (param$364) {
                  return caml_compare(param$364[0][0], x$208) === 0 || _(
                    mem_assoc$207, [x$208, param$364[1]]);
                }
                return false;
              });
            const mem_assq$212 =
              _f(function (x$213, param$362) {
                if (param$362) {
                  return param$362[0][0] === x$213 || _(mem_assq$212, [x$213, param$362[1]]);
                }
                return false;
              });
            const remove_assoc$217 =
              _f(function (x$218, param$361) {
                if (param$361) {
                  {
                    const l$222 = param$361[1];
                    const pair$221 = param$361[0];
                    if (caml_compare(pair$221[0], x$218) === 0) {
                      return l$222;
                    }
                    return $(pair$221, _(remove_assoc$217, [x$218, l$222]));
                  }
                }
                return 0;
              });
            const remove_assq$223 =
              _f(function (x$224, param$360) {
                if (param$360) {
                  {
                    const l$228 = param$360[1];
                    const pair$227 = param$360[0];
                    if (pair$227[0] === x$224) {
                      return l$228;
                    }
                    return $(pair$227, _(remove_assq$223, [x$224, l$228]));
                  }
                }
                return 0;
              });
            const find$229 =
              _f(function (p$230, param$359) {
                if (param$359) {
                  {
                    const x$231 = param$359[0];
                    if (_(p$230, [x$231])) {
                      return x$231;
                    }
                    return __(find$229, [p$230, param$359[1]]);
                  }
                }
                throw $(Not_found$20g);
              });
            const find_all$233 =
              _f(function (p$234) {
                const find$235 =
                  _f(function (accu$236, param$358) {
                    if (param$358) {
                      {
                        const l$238 = param$358[1];
                        const x$237 = param$358[0];
                        if (_(p$234, [x$237])) {
                          return __(find$235, [$(x$237, accu$236), l$238]);
                        }
                        return __(find$235, [accu$236, l$238]);
                      }
                    }
                    return __(rev$84, [accu$236]);
                  });
                return __(find$235, [0]);
              });
            const partition$240 =
              _f(function (p$241, l$242) {
                const part$243 =
                  _f(function (yes$244, no$245, param$357) {
                    if (param$357) {
                      {
                        const l$247 = param$357[1];
                        const x$246 = param$357[0];
                        if (_(p$241, [x$246])) {
                          return __(part$243, [$(x$246, yes$244), no$245, l$247]);
                        }
                        return __(part$243, [yes$244, $(x$246, no$245), l$247]);
                      }
                    }
                    return $(_(rev$84, [yes$244]), _(rev$84, [no$245]));
                  });
                return __(part$243, [0, 0, l$242]);
              });
            const split$248 =
              _f(function (param$354) {
                if (param$354) {
                  {
                    const match$356 = param$354[0];
                    const match$355 = _(split$248, [param$354[1]]);
                    return $($(match$356[0], match$355[0]), $(match$356[1], match$355[1]));
                  }
                }
                return $(0, 0);
              });
            const combine$254 =
              _f(function (l1$255, l2$256) {
                let $r21 = false;
                r$21: {
                  {
                    if (!l1$255) {
                      {
                        if (l2$256) {
                          {
                            $r21 = true;
                            break r$21;
                          }
                        }
                        return 0;
                      }
                    }
                    if (!l2$256) {
                      {
                        $r21 = true;
                        break r$21;
                      }
                    }
                    return $($(l1$255[0], l2$256[0]), _(combine$254, [l1$255[1], l2$256[1]]));
                  }
                }
                if ($r21) {
                  return __(oc$Pervasives$[0], ['List.combine']);
                }
              });
            const merge$261 =
              _f(function (cmp$262, l1$263, l2$264) {
                if (!l1$263) {
                  return l2$264;
                }
                if (l2$264) {
                  {
                    const h2$269 = l2$264[0];
                    const h1$267 = l1$263[0];
                    if (_(cmp$262, [h1$267, h2$269]) <= 0) {
                      return $(
                        h1$267, _(merge$261, [cmp$262, l1$263[1], l2$264]));
                    }
                    return $(h2$269, _(merge$261, [cmp$262, l1$263, l2$264[1]]));
                  }
                }
                return l1$263;
              });
            const chop$271 =
              _f(function (k$272, l$273) {
                if (k$272 === 0) {
                  return l$273;
                }
                if (l$273) {
                  return __(chop$271, [k$272 - 1, l$273[1]]);
                }
                throw $(Assert_failure$26g, $('ocaml/stdlib/list.ml', 213, 11));
              });
            const stable_sort$276 =
              _f(function (cmp$277, l$278) {
                const rev_merge$279 =
                  _f(function (l1$280, l2$281, accu$282) {
                    if (!l1$280) {
                      return __(rev_append$79, [l2$281, accu$282]);
                    }
                    if (l2$281) {
                      {
                        const h2$287 = l2$281[0];
                        const h1$285 = l1$280[0];
                        if (_(cmp$277, [h1$285, h2$287]) <= 0) {
                          return __(rev_merge$279, [l1$280[1], l2$281, $(h1$285, accu$282)]);
                        }
                        return __(rev_merge$279, [l1$280, l2$281[1], $(h2$287, accu$282)]);
                      }
                    }
                    return __(rev_append$79, [l1$280, accu$282]);
                  });
                const rev_merge_rev$289 =
                  _f(function (l1$290, l2$291, accu$292) {
                    if (!l1$290) {
                      return __(rev_append$79, [l2$291, accu$292]);
                    }
                    if (l2$291) {
                      {
                        const h2$297 = l2$291[0];
                        const h1$295 = l1$290[0];
                        if (_(cmp$277, [h1$295, h2$297]) > 0) {
                          return __(rev_merge_rev$289, [l1$290[1], l2$291, $(h1$295, accu$292)]);
                        }
                        return __(rev_merge_rev$289, [l1$290, l2$291[1], $(h2$297, accu$292)]);
                      }
                    }
                    return __(rev_append$79, [l1$290, accu$292]);
                  });
                const sort$299 =
                  _f(function (n$301, l$302) {
                    let $r9 = false;
                    r$9: {
                      {
                        if (!(
                          n$301 !== 2
                        ))
                        {
                          {
                            if (!l$302) {
                              {
                                $r9 = true;
                                break r$9;
                              }
                            }
                            const match$334 = l$302[1];
                            if (!match$334) {
                              {
                                $r9 = true;
                                break r$9;
                              }
                            }
                            const x2$304 = match$334[0];
                            const x1$303 = l$302[0];
                            if (_(cmp$277, [x1$303, x2$304]) <= 0) {
                              return $(x1$303, $(x2$304, 0));
                            }
                            return $(x2$304, $(x1$303, 0));
                          }
                        }
                        if (n$301 !== 3) {
                          {
                            $r9 = true;
                            break r$9;
                          }
                        }
                        if (!l$302) {
                          {
                            $r9 = true;
                            break r$9;
                          }
                        }
                        const match$336 = l$302[1];
                        if (!match$336) {
                          {
                            $r9 = true;
                            break r$9;
                          }
                        }
                        const match$337 = match$336[1];
                        if (!match$337) {
                          {
                            $r9 = true;
                            break r$9;
                          }
                        }
                        const x3$307 = match$337[0];
                        const x2$306 = match$336[0];
                        const x1$305 = l$302[0];
                        if (!(
                          _(cmp$277, [x1$305, x2$306]) <= 0
                        ))
                        {
                          {
                            if (_(cmp$277, [x1$305, x3$307]) <= 0) {
                              return $(
                                x2$306, $(x1$305, $(x3$307, 0)));
                            }
                            if (_(cmp$277, [x2$306, x3$307]) <= 0) {
                              return $(
                                x2$306, $(x3$307, $(x1$305, 0)));
                            }
                            return $(x3$307, $(x2$306, $(x1$305, 0)));
                          }
                        }
                        if (_(cmp$277, [x2$306, x3$307]) <= 0) {
                          return $(x1$305, $(x2$306, $(x3$307, 0)));
                        }
                        if (_(cmp$277, [x1$305, x3$307]) <= 0) {
                          return $(x1$305, $(x3$307, $(x2$306, 0)));
                        }
                        return $(x3$307, $(x1$305, $(x2$306, 0)));
                      }
                    }
                    if ($r9) {
                      {
                        const n1$310 = n$301 >>> 1;
                        const n2$311 = n$301 - n1$310;
                        const l2$312 = _(chop$271, [n1$310, l$302]);
                        const s1$313 = _(rev_sort$300, [n1$310, l$302]);
                        const s2$314 = _(rev_sort$300, [n2$311, l2$312]);
                        return __(rev_merge_rev$289, [s1$313, s2$314, 0]);
                      }
                    }
                  });
                const rev_sort$300 =
                  _f(function (n$315, l$316) {
                    let $r15 = false;
                    r$15: {
                      {
                        if (!(
                          n$315 !== 2
                        ))
                        {
                          {
                            if (!l$316) {
                              {
                                $r15 = true;
                                break r$15;
                              }
                            }
                            const match$341 = l$316[1];
                            if (!match$341) {
                              {
                                $r15 = true;
                                break r$15;
                              }
                            }
                            const x2$318 = match$341[0];
                            const x1$317 = l$316[0];
                            if (_(cmp$277, [x1$317, x2$318]) > 0) {
                              return $(x1$317, $(x2$318, 0));
                            }
                            return $(x2$318, $(x1$317, 0));
                          }
                        }
                        if (n$315 !== 3) {
                          {
                            $r15 = true;
                            break r$15;
                          }
                        }
                        if (!l$316) {
                          {
                            $r15 = true;
                            break r$15;
                          }
                        }
                        const match$343 = l$316[1];
                        if (!match$343) {
                          {
                            $r15 = true;
                            break r$15;
                          }
                        }
                        const match$344 = match$343[1];
                        if (!match$344) {
                          {
                            $r15 = true;
                            break r$15;
                          }
                        }
                        const x3$321 = match$344[0];
                        const x2$320 = match$343[0];
                        const x1$319 = l$316[0];
                        if (!(
                          _(cmp$277, [x1$319, x2$320]) > 0
                        ))
                        {
                          {
                            if (_(cmp$277, [x1$319, x3$321]) > 0) {
                              return $(x2$320, $(x1$319, $(x3$321, 0)));
                            }
                            if (_(cmp$277, [x2$320, x3$321]) > 0) {
                              return $(x2$320, $(x3$321, $(x1$319, 0)));
                            }
                            return $(x3$321, $(x2$320, $(x1$319, 0)));
                          }
                        }
                        if (_(cmp$277, [x2$320, x3$321]) > 0) {
                          return $(x1$319, $(x2$320, $(x3$321, 0)));
                        }
                        if (_(cmp$277, [x1$319, x3$321]) > 0) {
                          return $(x1$319, $(x3$321, $(x2$320, 0)));
                        }
                        return $(x3$321, $(x1$319, $(x2$320, 0)));
                      }
                    }
                    if ($r15) {
                      {
                        const n1$324 = n$315 >>> 1;
                        const n2$325 = n$315 - n1$324;
                        const l2$326 = _(chop$271, [n1$324, l$316]);
                        const s1$327 = _(sort$299, [n1$324, l$316]);
                        const s2$328 = _(sort$299, [n2$325, l2$326]);
                        return __(rev_merge$279, [s1$327, s2$328, 0]);
                      }
                    }
                  });
                const len$329 = _(length$62, [l$278]);
                if (len$329 < 2) {
                  return l$278;
                }
                return __(sort$299, [len$329, l$278]);
              });
            return $(length$62, hd$64, tl$67, nth$70, rev$84, append$78, rev_append$79, flatten$86,
              flatten$86, iter$102, map$90,
              rev_map$95, fold_left$106, fold_right$112, iter2$139, map2$118, rev_map2$127, fold_left2$147,
              fold_right2$156,
              for_all$165, exists$169, for_all2$173, exists2$181, mem$189, memq$193, find$229, find_all$233,
              find_all$233,
              partition$240, assoc$197, assq$202, mem_assoc$207, mem_assq$212, remove_assoc$217,
              remove_assq$223, split$248,
              combine$254, stable_sort$276, stable_sort$276, stable_sort$276, merge$261);
          }();
        const oc$String$ =
          function () {
            const make$66 = _f(function (n$67, c$68) {
              const s$69 = oc$$cms(n$67);
              caml_fill_string(s$69, 0, n$67, c$68);
              return s$69;
            });
            const copy$70 =
              _f(function (s$71) {
                const len$72 = s$71.length;
                const r$73 = oc$$cms(len$72);
                caml_blit_string(s$71, 0, r$73, 0, len$72);
                return r$73;
              });
            const sub$74 =
              _f(function (s$75, ofs$76, len$77) {
                if (ofs$76 < 0 || (
                  len$77 < 0 || ofs$76 > s$75.length - len$77
                ))
                {
                  return __(oc$Pervasives$[0], ['String.sub']);
                }
                const r$78 = oc$$cms(len$77);
                caml_blit_string(s$75, ofs$76, r$78, 0, len$77);
                return r$78;
              });
            const fill$79 =
              _f(function (s$80, ofs$81, len$82, c$83) {
                if (ofs$81 < 0 || (
                  len$82 < 0 || ofs$81 > s$80.length - len$82
                ))
                {
                  return __(oc$Pervasives$[0], ['String.fill']);
                }
                return caml_fill_string(s$80, ofs$81, len$82, c$83);
              });
            const blit$84 =
              _f(function (s1$85, ofs1$86, s2$87, ofs2$88, len$89) {
                if (len$89 < 0 || (
                  ofs1$86 < 0 || (
                    ofs1$86 > s1$85.length - len$89 || (
                      ofs2$88 < 0 || ofs2$88 > s2$87.length - len$89
                    )
                  )
                ))
                {
                  return __(oc$Pervasives$[0], ['String.blit']);
                }
                return caml_blit_string(s1$85, ofs1$86, s2$87, ofs2$88, len$89);
              });
            const iter$90 =
              _f(function (f$91, a$92) {
                for (let i$93 = 0; i$93 <= a$92.length - 1; i$93++) {
                  (
                    function (i$93) {
                      _(f$91, [oc$$srefu(a$92, i$93)]);
                    }(i$93)
                  );
                }
              });
            const concat$94 =
              _f(function (sep$95, l$96) {
                if (l$96) {
                  {
                    const hd$97 = l$96[0];
                    const num$99 = $(0);
                    const len$100 = $(0);
                    _(oc$List$[9], [
                      _f(function (s$101) {
                        num$99[0]++;
                        return len$100[0] = len$100[0] + s$101.length;
                      }), l$96
                    ]);
                    const r$102 = oc$$cms(len$100[0] + sep$95.length * (
                      num$99[0] - 1
                    ));
                    caml_blit_string(hd$97, 0, r$102, 0, hd$97.length);
                    const pos$103 = $(hd$97.length);
                    _(
                      oc$List$[9],
                      [
                        _f(function (s$104) {
                          caml_blit_string(sep$95, 0, r$102, pos$103[0], sep$95.length);
                          pos$103[0] = pos$103[0] + sep$95.length;
                          caml_blit_string(s$104, 0, r$102, pos$103[0], s$104.length);
                          return pos$103[0] = pos$103[0] + s$104.length;
                        }),
                        l$96[1]
                      ]);
                    return r$102;
                  }
                }
                return '';
              });
            const escaped$108 =
              _f(function (s$109) {
                let n$110 = 0;
                for (let i$111 = 0; i$111 <= s$109.length - 1; i$111++) {
                  (
                    function (i$111) {
                      n$110 =
                        n$110 +
                        function () {
                          const c$112 = oc$$srefu(s$109, i$111);
                          let $r26 = false;
                          r$26: {
                            {
                              let $r27 = false;
                              r$27: {
                                {
                                  if (!(
                                    c$112 >= 14
                                  ))
                                  {
                                    {
                                      if (!(
                                        c$112 >= 11
                                      ))
                                      {
                                        {
                                          if (!(
                                            c$112 >= 8
                                          ))
                                          {
                                            {
                                              $r27 = true;
                                              break r$27;
                                            }
                                          }
                                          $r26 = true;
                                          break r$26;
                                        }
                                      }
                                      if (!(
                                        c$112 >= 13
                                      ))
                                      {
                                        {
                                          $r27 = true;
                                          break r$27;
                                        }
                                      }
                                      $r26 = true;
                                      break r$26;
                                    }
                                  }
                                  if (!(
                                    c$112 !== 34
                                  ))
                                  {
                                    {
                                      $r26 = true;
                                      break r$26;
                                    }
                                  }
                                  if (!(
                                    c$112 !== 92
                                  ))
                                  {
                                    {
                                      $r26 = true;
                                      break r$26;
                                    }
                                  }
                                  $r27 = true;
                                  break r$27;
                                }
                              }
                              if ($r27) {
                                {
                                  if (caml_is_printable(c$112)) {
                                    return 1;
                                  }
                                  return 4;
                                }
                              }
                            }
                          }
                          if ($r26) {
                            return 2;
                          }
                        }();
                    }(i$111)
                  );
                }
                if (n$110 === s$109.length) {
                  return s$109;
                }
                const s$27$113 = oc$$cms(n$110);
                n$110 = 0;
                for (let i$114 = 0; i$114 <= s$109.length - 1; i$114++) {
                  (
                    function (i$114) {
                      const c$115 = oc$$srefu(s$109, i$114);
                      let $r24 = false;
                      r$24: {
                        {
                          const switcher$178 = -34 + c$115;
                          if (!(
                            switcher$178 < 0 || switcher$178 > 58
                          ))
                          {
                            {
                              if (!(
                                -1 + switcher$178 < 0 || -1 + switcher$178 > 56
                              ))
                              {
                                {
                                  $r24 = true;
                                  break r$24;
                                }
                              }
                              oc$$ssetu(s$27$113, n$110, 92);
                              n$110 = 1 + n$110;
                              oc$$ssetu(s$27$113, n$110, c$115);
                            }
                          }
                          else {
                            {
                              if (switcher$178 >= -20) {
                                {
                                  $r24 = true;
                                  break r$24;
                                }
                              }
                              const s$181 = 34 + switcher$178;
                              switch (s$181) {
                                case 0:
                                  $r24 = true;
                                  break r$24;
                                case 1:
                                  $r24 = true;
                                  break r$24;
                                case 2:
                                  $r24 = true;
                                  break r$24;
                                case 3:
                                  $r24 = true;
                                  break r$24;
                                case 4:
                                  $r24 = true;
                                  break r$24;
                                case 5:
                                  $r24 = true;
                                  break r$24;
                                case 6:
                                  $r24 = true;
                                  break r$24;
                                case 7:
                                  $r24 = true;
                                  break r$24;
                                case 8:
                                  oc$$ssetu(s$27$113, n$110, 92);
                                  n$110 = 1 + n$110;
                                  oc$$ssetu(s$27$113, n$110, 98);
                                  break;
                                case 9:
                                  oc$$ssetu(s$27$113, n$110, 92);
                                  n$110 = 1 + n$110;
                                  oc$$ssetu(s$27$113, n$110, 116);
                                  break;
                                case 10:
                                  oc$$ssetu(s$27$113, n$110, 92);
                                  n$110 = 1 + n$110;
                                  oc$$ssetu(s$27$113, n$110, 110);
                                  break;
                                case 11:
                                  $r24 = true;
                                  break r$24;
                                case 12:
                                  $r24 = true;
                                  break r$24;
                                case 13:
                                  oc$$ssetu(s$27$113, n$110, 92);
                                  n$110 = 1 + n$110;
                                  oc$$ssetu(s$27$113, n$110, 114);
                                  break;
                                default:
                                  break;
                              }
                            }
                          }
                        }
                      }
                      if ($r24) {
                        if (caml_is_printable(c$115)) {
                          oc$$ssetu(s$27$113, n$110, c$115);
                        } else {
                          {
                            const a$117 = c$115;
                            oc$$ssetu(s$27$113, n$110, 92);
                            n$110 = 1 + n$110;
                            oc$$ssetu(s$27$113, n$110, 48 + (
                              a$117 / 100 >> 0
                            ));
                            n$110 = 1 + n$110;
                            oc$$ssetu(s$27$113, n$110, 48 + (
                              a$117 / 10 >> 0
                            ) % 10);
                            n$110 = 1 + n$110;
                            oc$$ssetu(s$27$113, n$110, 48 + a$117 % 10);
                          }
                        }
                      }
                      n$110 = 1 + n$110;
                    }(i$114)
                  );
                }
                return s$27$113;
              });
            const map$118 =
              _f(function (f$119, s$120) {
                const l$121 = s$120.length;
                if (l$121 === 0) {
                  return s$120;
                }
                const r$122 = oc$$cms(l$121);
                for (let i$123 = 0; i$123 <= l$121 - 1; i$123++) {
                  (
                    function (i$123) {
                      oc$$ssetu(r$122, i$123, _(f$119, [oc$$srefu(s$120, i$123)]));
                    }(i$123)
                  );
                }
                return r$122;
              });
            const uppercase$124 = _f(function (s$125) {
              return __(map$118, [oc$Char$[3], s$125]);
            });
            const lowercase$126 = _f(function (s$127) {
              return __(map$118, [oc$Char$[2], s$127]);
            });
            const apply1$128 =
              _f(function (f$129, s$130) {
                if (s$130.length === 0) {
                  return s$130;
                }
                const r$131 = _(copy$70, [s$130]);
                oc$$ssetu(r$131, 0, _(f$129, [oc$$srefu(s$130, 0)]));
                return r$131;
              });
            const capitalize$132 = _f(function (s$133) {
              return __(apply1$128, [oc$Char$[3], s$133]);
            });
            const uncapitalize$134 = _f(function (s$135) {
              return __(apply1$128, [oc$Char$[2], s$135]);
            });
            const index_rec$136 =
              _f(function (s$137, lim$138, i$139, c$140) {
                if (i$139 >= lim$138) {
                  throw $(Not_found$20g);
                }
                if (oc$$srefu(s$137, i$139) === c$140) {
                  return i$139;
                }
                return __(index_rec$136, [s$137, lim$138, i$139 + 1, c$140]);
              });
            const index$141 = _f(function (s$142, c$143) {
              return __(index_rec$136, [s$142, s$142.length, 0, c$143]);
            });
            const index_from$144 =
              _f(function (s$145, i$146, c$147) {
                const l$148 = s$145.length;
                if (i$146 < 0 || i$146 > l$148) {
                  return __(oc$Pervasives$[0], ['String.index_from']);
                }
                return __(index_rec$136, [s$145, l$148, i$146, c$147]);
              });
            const rindex_rec$149 =
              _f(function (s$150, i$151, c$152) {
                if (i$151 < 0) {
                  throw $(Not_found$20g);
                }
                if (oc$$srefu(s$150, i$151) === c$152) {
                  return i$151;
                }
                return __(rindex_rec$149, [s$150, i$151 - 1, c$152]);
              });
            const rindex$153 = _f(function (s$154, c$155) {
              return __(rindex_rec$149, [s$154, s$154.length - 1, c$155]);
            });
            const rindex_from$156 =
              _f(function (s$157, i$158, c$159) {
                if (i$158 < -1 || i$158 >= s$157.length) {
                  return __(
                    oc$Pervasives$[0], ['String.rindex_from']);
                }
                return __(rindex_rec$149, [s$157, i$158, c$159]);
              });
            const contains_from$160 =
              _f(function (s$161, i$162, c$163) {
                const l$164 = s$161.length;
                if (i$162 < 0 || i$162 > l$164) {
                  return __(oc$Pervasives$[0], ['String.contains_from']);
                }
                try {
                  _(index_rec$136, [s$161, l$164, i$162, c$163]);
                  return true;
                }
                catch (exn$177) {
                  if (exn$177[0] === Not_found$20g) {
                    return false;
                  }
                  throw exn$177;
                }
              });
            const contains$165 = _f(function (s$166, c$167) {
              return __(contains_from$160, [s$166, 0, c$167]);
            });
            const rcontains_from$168 =
              _f(function (s$169, i$170, c$171) {
                if (i$170 < 0 || i$170 >= s$169.length) {
                  return __(
                    oc$Pervasives$[0], ['String.rcontains_from']);
                }
                try {
                  _(rindex_rec$149, [s$169, i$170, c$171]);
                  return true;
                }
                catch (exn$176) {
                  if (exn$176[0] === Not_found$20g) {
                    return false;
                  }
                  throw exn$176;
                }
              });
            const compare$173 = _f(function (prim$175, prim$174) {
              return caml_compare(prim$175, prim$174);
            });
            return $(make$66, copy$70, sub$74, fill$79, blit$84, concat$94, iter$90, escaped$108, index$141,
              rindex$153, index_from$144,
              rindex_from$156, contains$165, contains_from$160, rcontains_from$168, uppercase$124,
              lowercase$126, capitalize$132,
              uncapitalize$134, compare$173);
          }();
        const oc$Array$ =
          function () {
            const init$65 =
              _f(function (l$66, f$67) {
                if (l$66 === 0) {
                  return $();
                }
                const res$68 = caml_make_vect(l$66, _(f$67, [0]));
                for (let i$69 = 1; i$69 <= -1 + l$66; i$69++) {
                  (
                    function (i$69) {
                      res$68[i$69] = _(f$67, [i$69]);
                    }(i$69)
                  );
                }
                return res$68;
              });
            const make_matrix$70 =
              _f(function (sx$71, sy$72, init$73) {
                const res$74 = caml_make_vect(sx$71, $());
                for (let x$75 = 0; x$75 <= -1 + sx$71; x$75++) {
                  (
                    function (x$75) {
                      res$74[x$75] = caml_make_vect(sy$72, init$73);
                    }(x$75)
                  );
                }
                return res$74;
              });
            const copy$77 =
              _f(function (a$78) {
                const l$79 = a$78.length;
                if (l$79 === 0) {
                  return $();
                }
                const res$80 = caml_make_vect(l$79, a$78[0]);
                for (let i$81 = 1; i$81 <= -1 + l$79; i$81++) {
                  (
                    function (i$81) {
                      res$80[i$81] = a$78[i$81];
                    }(i$81)
                  );
                }
                return res$80;
              });
            const append$82 =
              _f(function (a1$83, a2$84) {
                const l1$85 = a1$83.length;
                const l2$86 = a2$84.length;
                if (l1$85 === 0 && l2$86 === 0) {
                  return $();
                }
                const r$87 = caml_make_vect(
                  l1$85 + l2$86, (
                    l1$85 > 0 ? a1$83 : a2$84
                  )[0]);
                for (let i$88 = 0; i$88 <= l1$85 - 1; i$88++) {
                  (
                    function (i$88) {
                      r$87[i$88] = a1$83[i$88];
                    }(i$88)
                  );
                }
                for (let i$89 = 0; i$89 <= l2$86 - 1; i$89++) {
                  (
                    function (i$89) {
                      r$87[i$89 + l1$85] = a2$84[i$89];
                    }(i$89)
                  );
                }
                return r$87;
              });
            const concat_aux$90 =
              _f(function (init$91, al$92) {
                const size$93 =
                  _f(function (accu$94, param$262) {
                    if (param$262) {
                      return __(
                        size$93, [
                          accu$94 + (
                            param$262[0]
                          ).length, param$262[1]
                        ]);
                    }
                    return accu$94;
                  });
                const res$97 = caml_make_vect(_(size$93, [0, al$92]), init$91);
                const fill$98 =
                  _f(function (pos$99, param$261) {
                    if (param$261) {
                      {
                        const h$100 = param$261[0];
                        for (let i$102 = 0; i$102 <= h$100.length - 1; i$102++) {
                          (
                            function (i$102) {
                              res$97[pos$99 + i$102] = h$100[i$102];
                            }(i$102)
                          );
                        }
                        return __(fill$98, [pos$99 + h$100.length, param$261[1]]);
                      }
                    }
                    return 0;
                  });
                _(fill$98, [0, al$92]);
                return res$97;
              });
            const concat$103 =
              _f(function (al$104) {
                const find_init$105 =
                  _f(function (param$260) {
                    if (param$260) {
                      {
                        const a$106 = param$260[0];
                        if (a$106.length > 0) {
                          return __(concat_aux$90, [a$106[0], al$104]);
                        }
                        return __(find_init$105, [param$260[1]]);
                      }
                    }
                    return $();
                  });
                return __(find_init$105, [al$104]);
              });
            const sub$108 =
              _f(function (a$109, ofs$110, len$111) {
                if (ofs$110 < 0 || (
                  len$111 < 0 || ofs$110 > a$109.length - len$111
                ))
                {
                  return __(oc$Pervasives$[0], ['Array.sub']);
                }
                if (len$111 === 0) {
                  return $();
                }
                const r$112 = caml_make_vect(len$111, a$109[ofs$110]);
                for (let i$113 = 1; i$113 <= len$111 - 1; i$113++) {
                  (
                    function (i$113) {
                      r$112[i$113] = a$109[ofs$110 + i$113];
                    }(i$113)
                  );
                }
                return r$112;
              });
            const fill$114 =
              _f(function (a$115, ofs$116, len$117, v$118) {
                if (ofs$116 < 0 || (
                  len$117 < 0 || ofs$116 > a$115.length - len$117
                ))
                {
                  return __(oc$Pervasives$[0], ['Array.fill']);
                }
                for (let i$119 = ofs$116; i$119 <= ofs$116 + len$117 - 1; i$119++) {
                  (
                    function (i$119) {
                      a$115[i$119] = v$118;
                    }(i$119)
                  );
                }
              });
            const blit$120 =
              _f(function (a1$121, ofs1$122, a2$123, ofs2$124, len$125) {
                if (len$125 < 0 ||
                  (
                    ofs1$122 < 0 || (
                      ofs1$122 > a1$121.length - len$125 || (
                        ofs2$124 < 0 || ofs2$124 > a2$123.length - len$125
                      )
                    )
                  ))
                {
                  return __(oc$Pervasives$[0], ['Array.blit']);
                }
                if (ofs1$122 < ofs2$124) {
                  for (let i$126 = len$125 - 1; i$126 >= 0; i$126--) {
                    (
                      function (i$126) {
                        a2$123[ofs2$124 + i$126] = a1$121[ofs1$122 + i$126];
                      }(i$126)
                    );
                  }
                }
                for (let i$127 = 0; i$127 <= len$125 - 1; i$127++) {
                  (
                    function (i$127) {
                      a2$123[ofs2$124 + i$127] = a1$121[ofs1$122 + i$127];
                    }(i$127)
                  );
                }
              });
            const iter$128 =
              _f(function (f$129, a$130) {
                for (let i$131 = 0; i$131 <= a$130.length - 1; i$131++) {
                  (
                    function (i$131) {
                      _(f$129, [a$130[i$131]]);
                    }(i$131)
                  );
                }
              });
            const map$132 =
              _f(function (f$133, a$134) {
                const l$135 = a$134.length;
                if (l$135 === 0) {
                  return $();
                }
                const r$136 = caml_make_vect(l$135, _(f$133, [a$134[0]]));
                for (let i$137 = 1; i$137 <= l$135 - 1; i$137++) {
                  (
                    function (i$137) {
                      r$136[i$137] = _(f$133, [a$134[i$137]]);
                    }(i$137)
                  );
                }
                return r$136;
              });
            const iteri$138 =
              _f(function (f$139, a$140) {
                for (let i$141 = 0; i$141 <= a$140.length - 1; i$141++) {
                  (
                    function (i$141) {
                      _(f$139, [i$141, a$140[i$141]]);
                    }(i$141)
                  );
                }
              });
            const mapi$142 =
              _f(function (f$143, a$144) {
                const l$145 = a$144.length;
                if (l$145 === 0) {
                  return $();
                }
                const r$146 = caml_make_vect(l$145, _(f$143, [0, a$144[0]]));
                for (let i$147 = 1; i$147 <= l$145 - 1; i$147++) {
                  (
                    function (i$147) {
                      r$146[i$147] = _(f$143, [i$147, a$144[i$147]]);
                    }(i$147)
                  );
                }
                return r$146;
              });
            const to_list$148 =
              _f(function (a$149) {
                const tolist$150 =
                  _f(function (i$151, res$152) {
                    if (i$151 < 0) {
                      return res$152;
                    }
                    return __(tolist$150, [i$151 - 1, $(a$149[i$151], res$152)]);
                  });
                return __(tolist$150, [a$149.length - 1, 0]);
              });
            const list_length$153 =
              _f(function (accu$154, param$259) {
                if (param$259) {
                  return __(list_length$153, [1 + accu$154, param$259[1]]);
                }
                return accu$154;
              });
            const of_list$157 =
              _f(function (l$160) {
                if (l$160) {
                  {
                    const a$161 = caml_make_vect(_(list_length$153, [0, l$160]), l$160[0]);
                    const fill$162 =
                      _f(function (i$163, param$258) {
                        if (param$258) {
                          {
                            a$161[i$163] = param$258[0];
                            return __(fill$162, [i$163 + 1, param$258[1]]);
                          }
                        }
                        return a$161;
                      });
                    return __(fill$162, [1, l$160[1]]);
                  }
                }
                return $();
              });
            const fold_left$166 =
              _f(function (f$167, x$168, a$169) {
                let r$170 = x$168;
                for (let i$171 = 0; i$171 <= a$169.length - 1; i$171++) {
                  (
                    function (i$171) {
                      r$170 = _(f$167, [r$170, a$169[i$171]]);
                    }(i$171)
                  );
                }
                return r$170;
              });
            const fold_right$172 =
              _f(function (f$173, a$174, x$175) {
                let r$176 = x$175;
                for (let i$177 = a$174.length - 1; i$177 >= 0; i$177--) {
                  (
                    function (i$177) {
                      r$176 = _(f$173, [a$174[i$177], r$176]);
                    }(i$177)
                  );
                }
                return r$176;
              });
            const Bottom$178 = $('Array.Bottom');
            const sort$179 =
              _f(function (cmp$180, a$181) {
                const maxson$182 =
                  _f(function (l$183, i$184) {
                    const i31$185 = i$184 + i$184 + i$184 + 1;
                    let x$186 = i31$185;
                    if (i31$185 + 2 < l$183) {
                      {
                        if (_(cmp$180, [oc$$arefs(a$181, i31$185), oc$$arefs(a$181, i31$185 + 1)])
                          < 0)
                        {
                          x$186 = i31$185 + 1;
                        } else {
                        }
                        if (_(cmp$180, [oc$$arefs(a$181, x$186), oc$$arefs(a$181, i31$185 + 2)])
                          < 0)
                        {
                          x$186 = i31$185 + 2;
                        } else {
                        }
                        return x$186;
                      }
                    }
                    if (i31$185 + 1 < l$183 && _(
                      cmp$180, [oc$$arefs(a$181, i31$185), oc$$arefs(a$181, i31$185 + 1)]) < 0)
                    {
                      return i31$185 + 1;
                    }
                    if (i31$185 < l$183) {
                      return i31$185;
                    }
                    throw $(Bottom$178, i$184);
                  });
                const trickledown$187 =
                  _f(function (l$188, i$189, e$190) {
                    const j$191 = _(maxson$182, [l$188, i$189]);
                    if (_(cmp$180, [oc$$arefs(a$181, j$191), e$190]) > 0) {
                      {
                        oc$$asets(a$181, i$189, oc$$arefs(a$181, j$191));
                        return __(trickledown$187, [l$188, j$191, e$190]);
                      }
                    }
                    return oc$$asets(a$181, i$189, e$190);
                  });
                const trickle$192 =
                  _f(function (l$193, i$194, e$195) {
                    try {
                      return _(trickledown$187, [l$193, i$194, e$195]);
                    }
                    catch (exn$257) {
                      if (exn$257[0] === Bottom$178) {
                        return oc$$asets(a$181, exn$257[1], e$195);
                      }
                      throw exn$257;
                    }
                  });
                const bubbledown$197 =
                  _f(function (l$198, i$199) {
                    const j$200 = _(maxson$182, [l$198, i$199]);
                    oc$$asets(a$181, i$199, oc$$arefs(a$181, j$200));
                    return __(bubbledown$197, [l$198, j$200]);
                  });
                const bubble$201 =
                  _f(function (l$202, i$203) {
                    try {
                      return _(bubbledown$197, [l$202, i$203]);
                    }
                    catch (exn$256) {
                      if (exn$256[0] === Bottom$178) {
                        return exn$256[1];
                      }
                      throw exn$256;
                    }
                  });
                const trickleup$205 =
                  _f(function (i$206, e$207) {
                    const father$208 = (
                      i$206 - 1
                    ) / 3 >> 0;
                    if (i$206 !== father$208) {
                    } else {
                      throw $(
                        Assert_failure$26g, $('ocaml/stdlib/array.ml', 208, 4));
                    }
                    if (_(cmp$180, [oc$$arefs(a$181, father$208), e$207]) < 0) {
                      {
                        oc$$asets(a$181, i$206, oc$$arefs(a$181, father$208));
                        if (father$208 > 0) {
                          return __(trickleup$205, [father$208, e$207]);
                        }
                        return oc$$asets(a$181, 0, e$207);
                      }
                    }
                    return oc$$asets(a$181, i$206, e$207);
                  });
                const l$209 = a$181.length;
                for (
                  let i$210 = ((l$209 + 1) / 3 >> 0) - 1; i$210 >= 0; i$210--)
                {
                  (
                    function (i$210) {
                      _(trickle$192, [l$209, i$210, oc$$arefs(a$181, i$210)]);
                    }(i$210)
                  );
                }
                for (let i$211 = l$209 - 1; i$211 >= 2; i$211--) {
                  (
                    function (i$211) {
                      const e$212 = oc$$arefs(a$181, i$211);
                      oc$$asets(a$181, i$211, oc$$arefs(a$181, 0));
                      _(trickleup$205, [_(bubble$201, [i$211, 0]), e$212]);
                    }(i$211)
                  );
                }
                if (l$209 > 1) {
                  {
                    const e$213 = oc$$arefs(a$181, 1);
                    oc$$asets(a$181, 1, oc$$arefs(a$181, 0));
                    return oc$$asets(a$181, 0, e$213);
                  }
                }
                return 0;
              });
            const cutoff$214 = 5;
            const stable_sort$215 =
              _f(function (cmp$216, a$217) {
                const merge$218 =
                  _f(function (src1ofs$219, src1len$220, src2$221, src2ofs$222, src2len$223, dst$224,
                    dstofs$225)
                  {
                    const src1r$226 = src1ofs$219 + src1len$220;
                    const src2r$227 = src2ofs$222 + src2len$223;
                    const loop$228 =
                      _f(function (i1$229, s1$230, i2$231, s2$232, d$233) {
                        if (_(cmp$216, [s1$230, s2$232]) <= 0) {
                          {
                            oc$$asets(dst$224, d$233, s1$230);
                            const i1$234 = i1$229 + 1;
                            if (i1$234 < src1r$226) {
                              return __(
                                loop$228, [i1$234, oc$$arefs(a$217, i1$234), i2$231, s2$232, d$233 + 1]);
                            }
                            return __(blit$120, [src2$221, i2$231, dst$224, d$233 + 1, src2r$227 - i2$231]);
                          }
                        }
                        oc$$asets(dst$224, d$233, s2$232);
                        const i2$235 = i2$231 + 1;
                        if (i2$235 < src2r$227) {
                          return __(
                            loop$228, [i1$229, s1$230, i2$235, oc$$arefs(src2$221, i2$235), d$233 + 1]);
                        }
                        return __(blit$120, [a$217, i1$229, dst$224, d$233 + 1, src1r$226 - i1$229]);
                      });
                    return __(
                      loop$228,
                      [
                        src1ofs$219,
                        oc$$arefs(a$217, src1ofs$219),
                        src2ofs$222,
                        oc$$arefs(src2$221, src2ofs$222),
                        dstofs$225
                      ]);
                  });
                const isortto$236 =
                  _f(function (srcofs$237, dst$238, dstofs$239, len$240) {
                    for (let i$241 = 0; i$241 <= len$240 - 1; i$241++) {
                      (
                        function (i$241) {
                          const e$242 = oc$$arefs(a$217, srcofs$237 + i$241);
                          let j$243 = dstofs$239 + i$241 - 1;
                          while (j$243 >= dstofs$239 && _(cmp$216, [oc$$arefs(dst$238, j$243), e$242])
                          > 0)
                          {
                            {
                              oc$$asets(dst$238, j$243 + 1, oc$$arefs(dst$238, j$243));
                              j$243 = -1 + j$243;
                            }
                          }
                          oc$$asets(dst$238, j$243 + 1, e$242);
                        }(i$241)
                      );
                    }
                  });
                const sortto$244 =
                  _f(function (srcofs$245, dst$246, dstofs$247, len$248) {
                    if (len$248 <= cutoff$214) {
                      return __(
                        isortto$236, [srcofs$245, dst$246, dstofs$247, len$248]);
                    }
                    const l1$249 = len$248 / 2 >> 0;
                    const l2$250 = len$248 - l1$249;
                    _(sortto$244, [srcofs$245 + l1$249, dst$246, dstofs$247 + l1$249, l2$250]);
                    _(sortto$244, [srcofs$245, a$217, srcofs$245 + l2$250, l1$249]);
                    return __(
                      merge$218, [
                        srcofs$245 + l2$250, l1$249, dst$246, dstofs$247 + l1$249, l2$250, dst$246,
                        dstofs$247
                      ]);
                  });
                const l$251 = a$217.length;
                if (l$251 <= cutoff$214) {
                  return __(isortto$236, [0, a$217, 0, l$251]);
                }
                const l1$252 = l$251 / 2 >> 0;
                const l2$253 = l$251 - l1$252;
                const t$254 = caml_make_vect(l2$253, oc$$arefs(a$217, 0));
                _(sortto$244, [l1$252, t$254, 0, l2$253]);
                _(sortto$244, [0, a$217, l2$253, l1$252]);
                return __(merge$218, [l2$253, l1$252, t$254, 0, l2$253, a$217, 0]);
              });
            return $(init$65, make_matrix$70, make_matrix$70, append$82, concat$103, sub$108, copy$77,
              fill$114, blit$120, to_list$148,
              of_list$157, iter$128, map$132, iteri$138, mapi$142, fold_left$166, fold_right$172, sort$179,
              stable_sort$215,
              stable_sort$215);
          }();
        const oc$Sys$ =
          function () {
            const match$118 = caml_sys_get_argv(0);
            const match$117 = caml_sys_get_config(0);
            const word_size$63 = match$117[1];
            const max_array_length$64 = (1 << word_size$63 - 10) - 1;
            const max_string_length$65 = (word_size$63 / 8 >> 0) * max_array_length$64 - 1;
            const interactive$76 = $(false);
            const set_signal$85 = _f(function (sig_num$86, sig_beh$87) {
              caml_install_signal_handler(sig_num$86, sig_beh$87);
              return 0;
            });
            const sigabrt$88 = -1;
            const sigalrm$89 = -2;
            const sigfpe$90 = -3;
            const sighup$91 = -4;
            const sigill$92 = -5;
            const sigint$93 = -6;
            const sigkill$94 = -7;
            const sigpipe$95 = -8;
            const sigquit$96 = -9;
            const sigsegv$97 = -10;
            const sigterm$98 = -11;
            const sigusr1$99 = -12;
            const sigusr2$100 = -13;
            const sigchld$101 = -14;
            const sigcont$102 = -15;
            const sigstop$103 = -16;
            const sigtstp$104 = -17;
            const sigttin$105 = -18;
            const sigttou$106 = -19;
            const sigvtalrm$107 = -20;
            const sigprof$108 = -21;
            const Break$109 = $('Sys.Break');
            const catch_break$110 =
              _f(function (on$111) {
                if (on$111) {
                  return __(set_signal$85, [
                    sigint$93, $(_f(function (param$116) {
                      throw $(Break$109);
                    }))
                  ]);
                }
                return __(set_signal$85, [sigint$93, 0]);
              });
            const ocaml_version$112 = '3.11.1';
            return $(match$118[1], match$118[0], interactive$76, match$117[0], word_size$63,
              max_string_length$65, max_array_length$64,
              set_signal$85, sigabrt$88, sigalrm$89, sigfpe$90, sighup$91, sigill$92, sigint$93, sigkill$94,
              sigpipe$95, sigquit$96,
              sigsegv$97, sigterm$98, sigusr1$99, sigusr2$100, sigchld$101, sigcont$102, sigstop$103,
              sigtstp$104, sigttin$105,
              sigttou$106, sigvtalrm$107, sigprof$108, Break$109, catch_break$110, ocaml_version$112);
          }();
        const oc$Int32$ =
          function () {
            const zero$76 = 0;
            const one$77 = 1;
            const minus_one$78 = -1;
            const succ$79 = _f(function (n$80) {
              return n$80 + 1;
            });
            const pred$81 = _f(function (n$82) {
              return n$82 - 1;
            });
            const abs$83 = _f(function (n$84) {
              if (n$84 >= 0) {
                return n$84;
              }
              return -n$84;
            });
            const min_int$85 = -2147483648;
            const max_int$86 = 2147483647;
            const lognot$87 = _f(function (n$88) {
              return n$88 ^ -1;
            });
            const to_string$90 = _f(function (n$91) {
              return caml_format_int('%d', n$91);
            });
            const compare$94 = _f(function (x$95, y$96) {
              return caml_int32_compare(x$95, y$96);
            });
            return $(
              zero$76, one$77, minus_one$78, succ$79, pred$81, abs$83, max_int$86, min_int$85, lognot$87,
              to_string$90, compare$94);
          }();
        const oc$Int64$ =
          function () {
            const zero$78 = '0';
            const one$79 = '1';
            const minus_one$80 = '-1';
            const succ$81 = _f(function (n$82) {
              return n$82 + '1';
            });
            const pred$83 = _f(function (n$84) {
              return n$84 - '1';
            });
            const abs$85 = _f(function (n$86) {
              if (n$86 >= '0') {
                return n$86;
              }
              return -n$86;
            });
            const min_int$87 = '-9223372036854775808';
            const max_int$88 = '9223372036854775807';
            const lognot$89 = _f(function (n$90) {
              return n$90 ^ '-1';
            });
            const to_string$92 = _f(function (n$93) {
              return caml_format_int('%d', n$93);
            });
            const compare$98 = _f(function (x$99, y$100) {
              return caml_int64_compare(x$99, y$100);
            });
            return $(
              zero$78, one$79, minus_one$80, succ$81, pred$83, abs$85, max_int$88, min_int$87, lognot$89,
              to_string$92, compare$98);
          }();
        const oc$Nativeint$ =
          function () {
            const zero$76 = 0;
            const one$77 = 1;
            const minus_one$78 = -1;
            const succ$79 = _f(function (n$80) {
              return n$80 + 1;
            });
            const pred$81 = _f(function (n$82) {
              return n$82 - 1;
            });
            const abs$83 = _f(function (n$84) {
              if (n$84 >= 0) {
                return n$84;
              }
              return -n$84;
            });
            const size$85 = oc$Sys$[4];
            const min_int$86 = 1 << size$85 - 1;
            const max_int$87 = min_int$86 - 1;
            const lognot$88 = _f(function (n$89) {
              return n$89 ^ -1;
            });
            const to_string$91 = _f(function (n$92) {
              return caml_format_int('%d', n$92);
            });
            const compare$95 = _f(function (x$96, y$97) {
              return caml_nativeint_compare(x$96, y$97);
            });
            return $(zero$76, one$77, minus_one$78, succ$79, pred$81, abs$83, size$85, max_int$87,
              min_int$86, lognot$88, to_string$91,
              compare$95);
          }();
        const oc$Ocamljs$ =
          function () {
            const option_of_nullable$74 = _f(function (x$75) {
              if (x$75 === null) {
                return 0;
              }
              return $(x$75);
            });
            const nullable_of_option$76 = _f(function (x$77) {
              if (x$77) {
                return x$77[0];
              }
              return null;
            });
            const is_null$79 = _f(function (a$80) {
              return caml_equal(a$80, null);
            });
            const Inline$268 = function () {
              const Jslib_ast$262 = $();
              const _loc$267 = 0;
              return $(Jslib_ast$262, _loc$267);
            }();
            return $(option_of_nullable$74, nullable_of_option$76, is_null$79, Inline$268);
          }();
        const oc$Types$ =
          function () {
            const value$96 = _f(function (param$132) {
              return param$132[0][0];
            });
            const sorts$98 = $(0, $(1, $(2, $(3, 0))));
            const string_of_color$99 =
              _f(function (param$131) {
                return __(
                  oc$Pervasives$[15],
                  [
                    '{r=',
                    _(
                      oc$Pervasives$[15],
                      [
                        _(oc$Pervasives$[20], [param$131[0]]),
                        _(
                          oc$Pervasives$[15],
                          [
                            ';',
                            _(
                              oc$Pervasives$[15],
                              [
                                'g=',
                                _(
                                  oc$Pervasives$[15],
                                  [
                                    _(oc$Pervasives$[20], [param$131[1]]),
                                    _(
                                      oc$Pervasives$[15],
                                      [
                                        ';',
                                        _(
                                          oc$Pervasives$[15],
                                          [
                                            'b=', _(
                                            oc$Pervasives$[15],
                                            [_(oc$Pervasives$[20], [param$131[2]]), '}'])
                                          ])
                                      ])
                                  ])
                              ])
                          ])
                      ])
                  ]);
              });
            const string_of_sort$103 =
              _f(function (param$130) {
                switch (param$130) {
                  case 0:
                    return 'bool';
                  case 1:
                    return 'float';
                  case 2:
                    return 'point';
                  case 3:
                    return 'color';
                  default:
                    return null;
                }
              });
            return $(value$96, sorts$98, string_of_color$99, string_of_sort$103);
          }();
        const oc$Myrandom$ =
          function () {
            const State$139 =
              function () {
                const new_state$63 = _f(function (param$197) {
                  return $(caml_make_vect(55, 0), 0);
                });
                const assign$64 =
                  _f(function (st1$65, st2$66) {
                    _(oc$Array$[8], [st2$66[0], 0, st1$65[0], 0, 55]);
                    return st1$65[1] = st2$66[1];
                  });
                const pad$67 =
                  _f(function (k$68, s$69) {
                    const n$70 = s$69.length;
                    if (n$70 <= k$68) {
                      return __(
                        oc$Pervasives$[15], [s$69, _(oc$String$[0], [k$68 - n$70, 97])]);
                    }
                    return __(oc$String$[2], [s$69, n$70 - k$68, k$68]);
                  });
                const full_init$71 =
                  _f(function (s$72, seed$73) {
                    const combine$74 =
                      _f(function (accu$75, x$76) {
                        return __(
                          pad$67, [16, _(oc$Pervasives$[15], [accu$75, _(oc$Pervasives$[19], [x$76])])]);
                      });
                    const extract$77 =
                      _f(function (d$78) {
                        return oc$$srefs(d$78, 0) + (
                          oc$$srefs(d$78, 1) << 8
                        ) + (
                          oc$$srefs(d$78, 2) << 16
                        ) ^ oc$$srefs(d$78, 3) << 22;
                      });
                    const l$79 = seed$73.length;
                    for (let i$80 = 0; i$80 <= 54; i$80++) {
                      (
                        function (i$80) {
                          oc$$asets(s$72[0], i$80, i$80);
                        }(i$80)
                      );
                    }
                    let accu$81 = 'x';
                    for (let i$82 = 0; i$82 <= 54 + _(oc$Pervasives$[4], [55, l$79]); i$82++) {
                      (
                        function (i$82) {
                          const j$83 = i$82 % 55;
                          const k$84 = i$82 % l$79;
                          accu$81 = _(combine$74, [accu$81, oc$$arefs(seed$73, k$84)]);
                          oc$$asets(s$72[0], j$83, oc$$arefs(s$72[0], j$83) ^ _(extract$77, [accu$81]));
                        }(i$82)
                      );
                    }
                    return s$72[1] = 0;
                  });
                const make$85 =
                  _f(function (seed$86) {
                    const result$87 = _(new_state$63, [0]);
                    _(full_init$71, [result$87, seed$86]);
                    return result$87;
                  });
                const copy$88 =
                  _f(function (s$89) {
                    const result$90 = _(new_state$63, [0]);
                    _(assign$64, [result$90, s$89]);
                    return result$90;
                  });
                const bits$91 =
                  _f(function (s$92) {
                    s$92[1] = (s$92[1] + 1) % 55;
                    const newval$93 = oc$$arefs(s$92[0], (s$92[1] + 24) % 55) + oc$$arefs(s$92[0], s$92[1]) & 1073741823;
                    oc$$asets(s$92[0], s$92[1], newval$93);
                    return newval$93;
                  });
                const intaux$94 =
                  _f(function (s$95, n$96) {
                    const r$97 = _(bits$91, [s$95]);
                    const v$98 = r$97 % n$96;
                    if (r$97 - v$98 > 1073741823 - n$96 + 1) {
                      return __(intaux$94, [s$95, n$96]);
                    }
                    return v$98;
                  });
                const int$99 =
                  _f(function (s$100, bound$101) {
                    if (bound$101 > 1073741823 || bound$101 <= 0) {
                      return __(
                        oc$Pervasives$[0], ['Myrandom.int']);
                    }
                    return __(intaux$94, [s$100, bound$101]);
                  });
                const int32aux$102 =
                  _f(function (s$103, n$104) {
                    const b1$105 = _(bits$91, [s$103]);
                    const b2$106 = (
                      _(bits$91, [s$103]) & 1
                    ) << 30;
                    const r$107 = b1$105 | b2$106;
                    const v$108 = r$107 % n$104;
                    if (r$107 - v$108 > oc$Int32$[6] - n$104 + 1) {
                      return __(int32aux$102, [s$103, n$104]);
                    }
                    return v$108;
                  });
                const int32$109 =
                  _f(function (s$110, bound$111) {
                    if (bound$111 <= 0) {
                      return __(oc$Pervasives$[0], ['Random.int32']);
                    }
                    return __(int32aux$102, [s$110, bound$111]);
                  });
                const int64aux$112 =
                  _f(function (s$113, n$114) {
                    const b1$115 = _(bits$91, [s$113]);
                    const b2$116 = _(bits$91, [s$113]) << 30;
                    const b3$117 = (
                      _(bits$91, [s$113]) & 7
                    ) << 60;
                    const r$118 = b1$115 | (
                      b2$116 | b3$117
                    );
                    const v$119 = r$118 % n$114;
                    if (r$118 - v$119 > oc$Int64$[6] - n$114 + '1') {
                      return __(int64aux$112, [s$113, n$114]);
                    }
                    return v$119;
                  });
                const int64$120 =
                  _f(function (s$121, bound$122) {
                    if (bound$122 <= '0') {
                      return __(oc$Pervasives$[0], ['Random.int64']);
                    }
                    return __(int64aux$112, [s$121, bound$122]);
                  });
                const nativeint$123 =
                  oc$Nativeint$[6] === 32 ?
                    _f(function (s$124, bound$125) {
                      return _(int32$109, [s$124, bound$125]);
                    }) :
                    _f(function (s$126, bound$127) {
                      return _(int64$120, [s$126, bound$127]);
                    });
                const rawfloat$128 =
                  _f(function (s$129) {
                    const scale$130 = 1073741824.0;
                    const r0$131 = _(bits$91, [s$129]);
                    const r1$132 = _(bits$91, [s$129]);
                    const r2$133 = _(bits$91, [s$129]);
                    return (
                      (
                        r0$131 / scale$130 + r1$132
                      ) / scale$130 + r2$133
                    ) / scale$130;
                  });
                const float$134 = _f(function (s$135, bound$136) {
                  return _(rawfloat$128, [s$135]) * bound$136;
                });
                const bool$137 = _f(function (s$138) {
                  return (
                    _(bits$91, [s$138]) & 1
                  ) === 0;
                });
                return $(new_state$63, assign$64, pad$67, full_init$71, make$85, copy$88, bits$91,
                  intaux$94, int$99, int32aux$102,
                  int32$109, int64aux$112, int64$120, nativeint$123, rawfloat$128, float$134, bool$137);
              }();
            const default$140 =
              $(caml_obj_dup(
                $(509760043, 399328820, 99941072, 112282318, 611886020, 516451399, 626288598, 337482183,
                  748548471, 808894867,
                  657927153, 386437385, 42355480, 977713532, 311548488, 13857891, 307938721, 93724463,
                  1041159001, 444711218,
                  1040610926, 233671814, 664494626, 1071756703, 188709089, 420289414, 969883075, 513442196,
                  275039308,
                  918830973, 598627151, 134083417, 823987070, 619204222, 81893604, 871834315, 398384680,
                  475117924, 520153386,
                  324637501, 38588599, 435158812, 168033706, 585877294, 328347186, 293179100, 671391820,
                  846150845, 283985689,
                  502873302, 718642511, 938465128, 962756406, 107944131, 192910970)), 0);
            const bits$141 = _f(function (param$195) {
              return __(State$139[6], [default$140]);
            });
            const int$142 = _f(function (bound$143) {
              return __(State$139[8], [default$140, bound$143]);
            });
            const int32$144 = _f(function (bound$145) {
              return __(State$139[10], [default$140, bound$145]);
            });
            const nativeint$146 = _f(function (bound$147) {
              return __(State$139[13], [default$140, bound$147]);
            });
            const int64$148 = _f(function (bound$149) {
              return __(State$139[12], [default$140, bound$149]);
            });
            const float$150 = _f(function (scale$151) {
              return __(State$139[15], [default$140, scale$151]);
            });
            const bool$152 = _f(function (param$194) {
              return __(State$139[16], [default$140]);
            });
            const full_init$153 = _f(function (seed$154) {
              return __(State$139[3], [default$140, seed$154]);
            });
            const init$155 = _f(function (seed$156) {
              return __(State$139[3], [default$140, $(seed$156)]);
            });
            const get_state$157 = _f(function (param$193) {
              return __(State$139[5], [default$140]);
            });
            const set_state$158 = _f(function (s$159) {
              return __(State$139[1], [default$140, s$159]);
            });
            return $(State$139, default$140, bits$141, int$142, int32$144, nativeint$146, int64$148,
              float$150, bool$152, full_init$153,
              init$155, get_state$157, set_state$158);
          }();
        const oc$Util$ =
          function () {
            const pi$74 = Math.atan2(0.0, -1.0);
            const mod_float$27$75 =
              _f(function (a$76, b$77) {
                const x$78 = a$76 / b$77;
                const n$79 = Math.floor(Math.abs(x$78));
                if (x$78 >= 0.0) {
                  return a$76 - n$79 * b$77;
                }
                return a$76 + n$79 * b$77;
              });
            const range$80 =
              _f(function ($2Aopt$2A$81, $2Aopt$2A$84, $2Aopt$2A$87, $2Aopt$2A$90, x$93) {
                const a$82 = $2Aopt$2A$81 ? $2Aopt$2A$81[0] : -1.0;
                const b$85 = $2Aopt$2A$84 ? $2Aopt$2A$84[0] : 1.0;
                const min$88 = $2Aopt$2A$87 ? $2Aopt$2A$87[0] : -1.0;
                const max$91 = $2Aopt$2A$90 ? $2Aopt$2A$90[0] : 1.0;
                return max$91 -
                  (
                    max$91 - min$88
                  ) *
                  Math.abs(_(
                    mod_float$27$75, [
                      Math.abs(x$93 - a$82), 2.0 * (
                        b$85 - a$82
                      )
                    ]) / (
                    b$85 - a$82
                  ) - 1.0);
              });
            const rgb_range$94 =
              _f(function ($2Aopt$2A$95, $2Aopt$2A$98, x$101) {
                const min$96 = $2Aopt$2A$95 ? $2Aopt$2A$95[0] : -1.0;
                const max$99 = $2Aopt$2A$98 ? $2Aopt$2A$98[0] : 1.0;
                return min$96 + (
                  max$99 - min$96
                ) * (
                  0.5 + Math.atan(2.0 * x$101) / pi$74
                );
              });
            const prob$102 = _f(function (param$418) {
              return __(oc$Myrandom$[7], [1.0]);
            });
            const rnd_int$103 = _f(function (a$104, b$105) {
              return a$104 + _(oc$Myrandom$[3], [b$105 - a$104 + 1]);
            });
            const rnd_float$106 = _f(function (u$107, v$108) {
              return u$107 + _(oc$Myrandom$[7], [v$108 - u$107]);
            });
            const rnd_name$109 =
              _f(function (n1$110, n2$111) {
                const pick$112 = _f(function (a$113) {
                  return oc$$arefs(a$113, _(oc$Myrandom$[3], [a$113.length]));
                });
                const prefix$114 = caml_obj_dup(
                  $('pre', 'sup', 'sub', 'anti', 'de', 'non', 'a', 'e', 'ae', 'u', 'i'));
                const syllable$115 =
                  _f(function (param$417) {
                    const vowels$116 = caml_obj_dup(
                      $('a', 'a', 'ae', 'e', 'e', 'ea', 'ee', 'y', 'i', 'o', 'oo', 'ou', 'u'));
                    const consonants$117 =
                      caml_obj_dup(
                        $('b', 'bl', 'bv', 'c', 'ck', 'ch', 'd', 'd', 'f', 'fl', 'g', 'gl', 'gg', 'h', 'j',
                          'k', 'l',
                          'll', 'm', 'n', 'nt', 'ng', 'p', 'pr', 'pl', 'qu', 'r', 'rr', 's', 'sh', 'st',
                          'sp', 't', 'tr',
                          't', 'v', 'x'));
                    const c$118 = _(pick$112, [consonants$117]);
                    const v$119 = _(pick$112, [vowels$116]);
                    return __(oc$Pervasives$[15], [c$118, v$119]);
                  });
                const ending$120 =
                  _f(function (param$416) {
                    const noun$121 =
                      caml_obj_dup(
                        $('', '', '', 're', 'er', 'es', 'ub', 'imp', 'ius', 'or', 'ors', 'ack', 'ent',
                          'ies', 'ry', 'elp',
                          'ay', 'ays'));
                    const adj$122 =
                      caml_obj_dup(
                        $('', '', '', 'ish', 'er', 'est', 'al', 'ary', 'ing', 'ight', 'ough', 'ich', 'ed',
                          'ian', 'ast',
                          'ool'));
                    const n$123 = _(pick$112, [noun$121]);
                    const a$124 = _(pick$112, [adj$122]);
                    return $(n$123, a$124);
                  });
                const make$125 =
                  _f(function (k$126) {
                    if (k$126 <= 0) {
                      return '';
                    }
                    const s$127 = _(syllable$115, [0]);
                    const ss$128 = _(make$125, [k$126 - 1]);
                    return __(oc$Pervasives$[15], [s$127, ss$128]);
                  });
                const match$415 = _(ending$120, [0]);
                const noun$131 =
                  _(
                    oc$Pervasives$[15],
                    [_(prob$102, [0]) < 0.5 ? '' : _(pick$112, [prefix$114]), _(make$125, [n1$110])]);
                const adj$132 =
                  _(
                    oc$Pervasives$[15],
                    [_(prob$102, [0]) < 0.5 ? '' : _(pick$112, [prefix$114]), _(make$125, [n2$111])]);
                return __(
                  oc$Pervasives$[15],
                  [
                    adj$132,
                    _(
                      oc$Pervasives$[15],
                      [
                        match$415[1],
                        _(oc$Pervasives$[15], [' ', _(oc$Pervasives$[15], [noun$131, match$415[0]])])
                      ])
                  ]);
              });
            const split_name$133 =
              _f(function (str$134) {
                try {
                  const k$135 = _(oc$String$[8], [str$134, 32]);
                  return $(
                    _(oc$String$[2], [str$134, 0, k$135]),
                    _(oc$String$[2], [str$134, k$135 + 1, str$134.length - k$135 - 1]));
                }
                catch (exn$414) {
                  if (exn$414[0] === Not_found$20g) {
                    return $(
                      _(oc$Pervasives$[15], [str$134, ' ']), str$134);
                  }
                  throw exn$414;
                }
              });
            const nest$136 =
              _f(function (f$137, x$138, n$139) {
                if (n$139 <= 0) {
                  return x$138;
                }
                return __(f$137, [_(nest$136, [f$137, x$138, n$139 - 1])]);
              });
            const rnd_partition$140 =
              _f(function (q$141, k$142) {
                const inc$143 =
                  _f(function (param$411) {
                    const n$146 = param$411[0];
                    let $r140 = false;
                    r$140: {
                      {
                        if (!!n$146) {
                          {
                            $r140 = true;
                            break r$140;
                          }
                        }
                        const match$412 = param$411[1];
                        if (!match$412) {
                          {
                            $r140 = true;
                            break r$140;
                          }
                        }
                        return $(match$412[0] + 1, match$412[1]);
                      }
                    }
                    if ($r140) {
                      {
                        const match$413 = param$411[1];
                        if (match$413) {
                          return $(match$413[0], _(inc$143, [$(n$146 - 1, match$413[1])]));
                        }
                        return __(oc$Pervasives$[1], ['rnd_partition: an impossible thing happened']);
                      }
                    }
                  });
                return __(
                  nest$136,
                  [
                    _f(function (is$149) {
                      const r$150 = _(rnd_int$103, [0, k$142 - 1]);
                      return __(inc$143, [$(r$150, is$149)]);
                    }),
                    _(nest$136, [
                      _f(function (zs$151) {
                        return $(0, zs$151);
                      }), 0, k$142
                    ]),
                    q$141
                  ]);
              });
            const map_range$152 =
              _f(function (f$153, a$154, b$155) {
                if (a$154 > b$155) {
                  return 0;
                }
                const x$156 = _(f$153, [a$154]);
                const xs$157 = _(map_range$152, [f$153, a$154 + 1, b$155]);
                return $(x$156, xs$157);
              });
            const pick_exp$158 =
              _f(function (p$159, lst$160) {
                const pck$161 =
                  _f(function (u$162, v$163, param$410) {
                    if (param$410) {
                      {
                        const xs$166 = param$410[1];
                        const x$164 = param$410[0];
                        if (!xs$166) {
                          return x$164;
                        }
                        if (v$163 <= u$162) {
                          return x$164;
                        }
                        return __(
                          pck$161, [
                            u$162 * (
                              1.0 - p$159
                            ), v$163 - u$162, xs$166
                          ]);
                      }
                    }
                    return __(oc$Pervasives$[1], ['pick_exp: empty list']);
                  });
                const n$167 = _(oc$List$[0], [lst$160]);
                // console.log(Math.pow(1.0 - p$159, n$167));
                const q$168 = _(rnd_float$106, [0.0, 1.0 - Math.pow(1.0 - p$159, n$167)]);
                return __(pck$161, [p$159, q$168, lst$160]);
              });
            const pick_exp_maybe$169 =
              _f(function (p$170, lst$171) {
                const pck$172 =
                  _f(function (u$173, v$174, param$409) {
                    if (!param$409) {
                      return 0;
                    }
                    if (v$174 <= u$173) {
                      return $(param$409[0]);
                    }
                    return __(
                      pck$172, [
                        u$173 * (
                          1.0 - p$170
                        ), v$174 - u$173, param$409[1]
                      ]);
                  });
                const q$177 = _(rnd_float$106, [0.0, 1.0]);
                return __(pck$172, [p$170, q$177, lst$171]);
              });
            const pick$178 =
              _f(function (lst$179) {
                return __(oc$List$[3], [lst$179, _(rnd_int$103, [0, _(oc$List$[0], [lst$179]) - 1])]);
              });
            const pick_many$180 =
              _f(function (n$181, lst$182) {
                const split$183 =
                  _f(function (n$184, param$407) {
                    if (param$407) {
                      {
                        const xs$186 = param$407[1];
                        const x$185 = param$407[0];
                        if (n$184 === 0) {
                          return $(x$185, xs$186);
                        }
                        const match$408 = _(split$183, [n$184 - 1, xs$186]);
                        return $(match$408[0], $(x$185, match$408[1]));
                      }
                    }
                    throw $(Match_failure$16g, $('util.ml', 115, 18));
                  });
                const pck$189 =
                  _f(function (n$190, lst$191, xs$192) {
                    if (n$190 === 0) {
                      return xs$192;
                    }
                    const k$193 = _(rnd_int$103, [0, _(oc$List$[0], [lst$191]) - 1]);
                    const match$406 = _(split$183, [k$193, lst$191]);
                    return __(pck$189, [n$190 - 1, match$406[1], $(match$406[0], xs$192)]);
                  });
                return __(pck$189, [n$181, lst$182, 0]);
              });
            const index_of$196 =
              _f(function (x$197, param$405) {
                if (!param$405) {
                  return __(oc$Pervasives$[1], ['index_of: empty list']);
                }
                if (caml_equal(x$197, param$405[0])) {
                  return 0;
                }
                return 1 + _(index_of$196, [x$197, param$405[1]]);
              });
            const enumerate$200 =
              _f(function (lst$201) {
                const enum$202 =
                  _f(function (k$203, param$404) {
                    if (param$404) {
                      return $($(param$404[0], k$203), _(enum$202, [k$203 + 1, param$404[1]]));
                    }
                    return 0;
                  });
                return __(enum$202, [0, lst$201]);
              });
            const unionq$206 =
              _f(function (x$207, lst$210) {
                if (lst$210) {
                  {
                    const y$208 = lst$210[0];
                    if (x$207 === y$208) {
                      return lst$210;
                    }
                    return $(y$208, _(unionq$206, [x$207, lst$210[1]]));
                  }
                }
                return $(x$207, 0);
              });
            const count$211 =
              _f(function (lst$212, tok$213) {
                const c$214 = _(oc$List$[10], [
                  _f(function (t$215) {
                    return $(t$215, $(0));
                  }), tok$213
                ]);
                _(oc$List$[9], [
                  _f(function (x$216) {
                    return _(oc$List$[29], [x$216, c$214])[0]++;
                  }), lst$212
                ]);
                return __(oc$List$[10], [
                  _f(function (param$403) {
                    return $(param$403[0], param$403[1][0]);
                  }), c$214
                ]);
              });
            const color_of_rgb$219 = _f(function (r$220, g$221, b$222) {
              return $(r$220, g$221, b$222);
            });
            const rgb_of_color$223 =
              _f(function (param$401) {
                return $(
                  _(rgb_range$94, [$(0.0), $(255.0), param$401[0]]) >> 0,
                  _(rgb_range$94, [$(0.0), $(255.0), param$401[1]]) >> 0,
                  _(rgb_range$94, [$(0.0), $(255.0), param$401[2]]) >> 0);
              });
            const rgb_of_hsl$227 =
              _f(function (h$228, sl$229, l$230) {
                const v$231 = l$230 <= 0.5 ? l$230 * (
                  1.0 + sl$229
                ) : l$230 + sl$229 - l$230 * sl$229;
                if (v$231 <= 0.0) {
                  return $(0.0, 0.0, 0.0);
                }
                const m$232 = l$230 + l$230 - v$231;
                const sv$233 = (
                  v$231 - m$232
                ) / v$231;
                const h6$234 = Math.abs(h$228 * 6.0);
                const sextant$235 = (
                  h6$234 >> 0
                ) % 6;
                const fract$236 = h6$234 - Math.floor(h6$234);
                const vsf$237 = v$231 * sv$233 * fract$236;
                const mid1$238 = m$232 + vsf$237;
                const mid2$239 = v$231 - vsf$237;
                if (sextant$235 < 0 || sextant$235 > 4) {
                  return $(v$231, m$232, mid2$239);
                }
                switch (sextant$235) {
                  case 0:
                    return $(v$231, mid1$238, m$232);
                  case 1:
                    return $(mid2$239, v$231, m$232);
                  case 2:
                    return $(m$232, v$231, mid1$238);
                  case 3:
                    return $(m$232, mid2$239, v$231);
                  case 4:
                    return $(mid1$238, m$232, v$231);
                  default:
                    return null;
                }
              });
            const rnd_color$240 =
              _f(function (param$400) {
                const r$241 = _(rnd_float$106, [-1.0, 1.0]);
                const g$242 = _(rnd_float$106, [-1.0, 1.0]);
                const b$243 = _(rnd_float$106, [-1.0, 1.0]);
                return __(color_of_rgb$219, [r$241, g$242, b$243]);
              });
            const rgb_force$244 =
              _f(function (param$398, param$399) {
                const dr$251 = param$398[0] - param$399[0];
                const dg$252 = param$398[1] - param$399[1];
                const db$253 = param$398[2] - param$399[2];
                const d2$254 = 1.0 / (
                  dr$251 * dr$251 + dg$252 * dg$252 + db$253 * db$253
                );
                return $(dr$251 * d2$254, dg$252 * d2$254, db$253 * d2$254);
              });
            const palette_force$255 =
              _f(function (c$256, p$257) {
                return __(
                  oc$List$[12],
                  [
                    _f(function (param$396, d$261) {
                      const z$260 = param$396[2];
                      const y$259 = param$396[1];
                      const x$258 = param$396[0];
                      if (caml_equal(d$261, c$256)) {
                        return $(x$258, y$259, z$260);
                      }
                      const match$397 = _(rgb_force$244, [c$256, d$261]);
                      return $(x$258 + match$397[0], y$259 + match$397[1], z$260 + match$397[2]);
                    }),
                    $(0.0, 0.0, 0.0),
                    p$257
                  ]);
              });
            const string_of_color$265 =
              _f(function (param$395) {
                return __(
                  oc$Pervasives$[15],
                  [
                    _(oc$Pervasives$[20], [param$395[0]]),
                    _(
                      oc$Pervasives$[15],
                      [
                        ', ',
                        _(
                          oc$Pervasives$[15],
                          [
                            _(oc$Pervasives$[20], [param$395[1]]),
                            _(oc$Pervasives$[15], [', ', _(oc$Pervasives$[20], [param$395[2]])])
                          ])
                      ])
                  ]);
              });
            const string_of_palette$269 =
              _f(function (p$270) {
                return __(oc$String$[5], ['\n', _(oc$List$[10], [string_of_color$265, p$270])]);
              });
            const mix$271 =
              _f(function (t$272, param$392, param$393) {
                const u$279 = 1.0 - t$272;
                return $(t$272 * param$392[0] + u$279 * param$393[0], t$272 * param$392[1] + u$279
                  * param$393[1],
                  t$272 * param$392[2] + u$279 * param$393[2]);
              });
            const mix3$280 =
              _f(function (u$281, v$282, param$388, param$389, param$390) {
                const w$292 = 1.0 - u$281 - v$282;
                return $(
                  u$281 * param$388[0] + v$282 * param$389[0] + w$292 * param$390[0],
                  u$281 * param$388[1] + v$282 * param$389[1] + w$292 * param$390[1],
                  u$281 * param$388[2] + v$282 * param$389[2] + w$292 * param$390[2]);
              });
            const mix4$293 =
              _f(function (u$294, v$295, w$296, param$383, param$384, param$385, param$386) {
                const t$309 = 1.0 - u$294 - v$295;
                return $(
                  u$294 * param$383[0] + v$295 * param$384[0] + w$296 * param$385[0] + t$309 * param$386[0],
                  u$294 * param$383[1] + v$295 * param$384[1] + w$296 * param$385[1] + t$309 * param$386[1],
                  u$294 * param$383[2] + v$295 * param$384[2] + w$296 * param$385[2] + t$309
                  * param$386[2]);
              });
            const minimize$310 =
              _f(function (f$311, lst$312) {
                const m$313 =
                  _f(function (y$314, v$315, param$382) {
                    if (param$382) {
                      {
                        const xs$317 = param$382[1];
                        const x$316 = param$382[0];
                        const w$318 = _(f$311, [x$316]);
                        if (caml_lessthan(v$315, w$318)) {
                          return __(m$313, [y$314, v$315, xs$317]);
                        }
                        return __(m$313, [x$316, w$318, xs$317]);
                      }
                    }
                    return y$314;
                  });
                if (lst$312) {
                  {
                    const x$319 = lst$312[0];
                    return __(m$313, [x$319, _(f$311, [x$319]), lst$312[1]]);
                  }
                }
                return __(oc$Pervasives$[1], ['minimize: empty list']);
              });
            const get$321 = _f(function (x$322, lst$323) {
              return __(oc$List$[29], [x$322, lst$323]);
            });
            const put$324 =
              _f(function (x$325, v$326, param$381) {
                if (param$381) {
                  {
                    const lst$330 = param$381[1];
                    const p$329 = param$381[0];
                    const y$327 = p$329[0];
                    if (caml_equal(x$325, y$327)) {
                      return $($(y$327, $(v$326, p$329[1])), lst$330);
                    }
                    return $(p$329, _(put$324, [x$325, v$326, lst$330]));
                  }
                }
                return $($(x$325, $(v$326, 0)), 0);
              });
            const uniq$331 =
              _f(function (param$380) {
                if (param$380) {
                  {
                    const xs$333 = param$380[1];
                    const x$332 = param$380[0];
                    if (_(oc$List$[23], [x$332, xs$333])) {
                      return __(uniq$331, [xs$333]);
                    }
                    return $(x$332, _(uniq$331, [xs$333]));
                  }
                }
                return 0;
              });
            const union$334 =
              _f(function (lst$335) {
                return __(
                  oc$List$[37],
                  [
                    _f(function (prim$379, prim$378) {
                      return caml_compare(prim$379, prim$378);
                    }), _(uniq$331, [lst$335])
                  ]);
              });
            const prng_init$336 =
              _f(function (str$337) {
                if (oc$$sneq(str$337, '')) {
                  {
                    const n$338 = str$337.length;
                    const a$339 = caml_make_vect(n$338, 0);
                    for (let i$340 = 0; i$340 <= n$338 - 1; i$340++) {
                      (
                        function (i$340) {
                          oc$$asets(a$339, i$340, i$340 * i$340 + oc$$srefs(str$337, i$340));
                        }(i$340)
                      );
                    }
                    return __(oc$Myrandom$[9], [a$339]);
                  }
                }
                return __(oc$Myrandom$[9], [$(0)]);
              });
            return $(pi$74, mod_float$27$75, range$80, rgb_range$94, prob$102, rnd_int$103, rnd_float$106,
              rnd_name$109, split_name$133,
              nest$136, rnd_partition$140, map_range$152, pick_exp$158, pick_exp_maybe$169, pick$178,
              pick_many$180, index_of$196,
              enumerate$200, unionq$206, count$211, color_of_rgb$219, rgb_of_color$223, rgb_of_hsl$227,
              rnd_color$240,
              rgb_force$244, palette_force$255, string_of_color$265, string_of_palette$269, mix$271,
              mix3$280, mix4$293,
              minimize$310, get$321, put$324, uniq$331, union$334, prng_init$336);
          }();
        const oc$Op$ =
          function () {
            const op_scalar$83 =
              _f(function (name$84, r$85) {
                return $(name$84, 0, 1, _f(function (param$968, param$969, param$970) {
                  return $1(r$85[0]);
                }));
              });
            const op_pt$86 =
              _f(function (x$87, y$88) {
                return $('pt', 0, 2, _f(function (param$964, param$965, param$966) {
                  return $2(x$87[0], y$88[0]);
                }));
              });
            const O$491 =
              function () {
                const palette_f$89 =
                  $('palette_f', $(1, 0), 3,
                    _f(function (param$953) {
                      let $r378 = false;
                      r$378: {
                        {
                          const match$958 = _(oc$Util$[15], [2, param$953[2]]);
                          if (!match$958) {
                            {
                              $r378 = true;
                              break r$378;
                            }
                          }
                          const match$959 = match$958[1];
                          if (!match$959) {
                            {
                              $r378 = true;
                              break r$378;
                            }
                          }
                          if (match$959[1]) {
                            {
                              $r378 = true;
                              break r$378;
                            }
                          }
                          return _f(function (param$954) {
                            let $r377 = false;
                            r$377: {
                              {
                                if (!param$954) {
                                  {
                                    $r377 = true;
                                    break r$377;
                                  }
                                }
                                if (param$954[1]) {
                                  {
                                    $r377 = true;
                                    break r$377;
                                  }
                                }
                                return _f(function (param$955) {
                                  const match$956 = _(oc$Types$[0], [param$954[0]]);
                                  switch ($t(match$956)) {
                                    case 1:
                                      return $3(_(
                                        oc$Util$[28],
                                        [
                                          _(oc$Util$[2], [0, 0, $(-1.0), $(2.0), match$956[0]]),
                                          match$958[0],
                                          match$959[0]
                                        ]));
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 34, 24));
                                  }
                                });
                              }
                            }
                            if ($r377) {
                              throw $(Match_failure$16g, $('op.ml', 33, 4));
                            }
                          });
                        }
                      }
                      if ($r378) {
                        throw $(Match_failure$16g, $('op.ml', 32, 6));
                      }
                    }));
                const palette_p$95 =
                  $('palette_p', $(2, 0), 3,
                    _f(function (param$942) {
                      let $r372 = false;
                      r$372: {
                        {
                          const match$947 = _(oc$Util$[15], [2, param$942[2]]);
                          if (!match$947) {
                            {
                              $r372 = true;
                              break r$372;
                            }
                          }
                          const match$948 = match$947[1];
                          if (!match$948) {
                            {
                              $r372 = true;
                              break r$372;
                            }
                          }
                          if (match$948[1]) {
                            {
                              $r372 = true;
                              break r$372;
                            }
                          }
                          return _f(function (param$943) {
                            let $r371 = false;
                            r$371: {
                              {
                                if (!param$943) {
                                  {
                                    $r371 = true;
                                    break r$371;
                                  }
                                }
                                if (param$943[1]) {
                                  {
                                    $r371 = true;
                                    break r$371;
                                  }
                                }
                                return _f(function (param$944) {
                                  const match$945 = _(oc$Types$[0], [param$943[0]]);
                                  switch ($t(match$945)) {
                                    case 2:
                                      const x$102 = Math.abs(match$945[0]);
                                      const y$103 = Math.abs(match$945[1]);
                                      const t$104 = 1.0 / (
                                        x$102 + y$103
                                      );
                                      return $3(
                                        _(oc$Util$[28], [x$102 * t$104, match$947[0], match$948[0]]));
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 46, 24));
                                  }
                                });
                              }
                            }
                            if ($r371) {
                              throw $(Match_failure$16g, $('op.ml', 45, 4));
                            }
                          });
                        }
                      }
                      if ($r372) {
                        throw $(Match_failure$16g, $('op.ml', 44, 6));
                      }
                    }));
                const palette_pf$105 =
                  $('palette_pf', $(2, $(1, 0)), 3,
                    _f(function (param$928) {
                      let $r363 = false;
                      r$363: {
                        {
                          const match$935 = _(oc$Util$[15], [3, param$928[2]]);
                          if (!match$935) {
                            {
                              $r363 = true;
                              break r$363;
                            }
                          }
                          const match$936 = match$935[1];
                          if (!match$936) {
                            {
                              $r363 = true;
                              break r$363;
                            }
                          }
                          const match$937 = match$936[1];
                          if (!match$937) {
                            {
                              $r363 = true;
                              break r$363;
                            }
                          }
                          if (match$937[1]) {
                            {
                              $r363 = true;
                              break r$363;
                            }
                          }
                          return _f(function (param$929) {
                            let $r362 = false;
                            r$362: {
                              {
                                if (!param$929) {
                                  {
                                    $r362 = true;
                                    break r$362;
                                  }
                                }
                                const match$933 = param$929[1];
                                if (!match$933) {
                                  {
                                    $r362 = true;
                                    break r$362;
                                  }
                                }
                                if (match$933[1]) {
                                  {
                                    $r362 = true;
                                    break r$362;
                                  }
                                }
                                return _f(function (param$930) {
                                  const match$932 = _(oc$Types$[0], [param$929[0]]);
                                  switch ($t(match$932)) {
                                    case 2:
                                      const match$931 = _(oc$Types$[0], [match$933[0]]);
                                      switch ($t(match$931)) {
                                        case 1:
                                          const x$115 = Math.abs(match$932[0]);
                                          const y$116 = Math.abs(match$932[1]);
                                          const z$117 = Math.abs(match$931[0]);
                                          const t$118 = 1.0 / (
                                            x$115 + y$116 + z$117
                                          );
                                          const c$119 =
                                            _(
                                              oc$Util$[29],
                                              [
                                                x$115 * t$118, y$116 * t$118, match$935[0], match$936[0],
                                                match$937[0]
                                              ]);
                                          return $3(c$119);
                                        default:
                                          throw $(Match_failure$16g, $('op.ml', 62, 24));
                                      }
                                      break;
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 61, 24));
                                  }
                                });
                              }
                            }
                            if ($r362) {
                              throw $(Match_failure$16g, $('op.ml', 60, 4));
                            }
                          });
                        }
                      }
                      if ($r363) {
                        throw $(Match_failure$16g, $('op.ml', 59, 6));
                      }
                    }));
                const palette_pp$120 =
                  $('palette_pp', $(2, $(2, 0)), 3,
                    _f(function (param$913) {
                      let $r351 = false;
                      r$351: {
                        {
                          const match$920 = _(oc$Util$[15], [4, param$913[2]]);
                          if (!match$920) {
                            {
                              $r351 = true;
                              break r$351;
                            }
                          }
                          const match$921 = match$920[1];
                          if (!match$921) {
                            {
                              $r351 = true;
                              break r$351;
                            }
                          }
                          const match$922 = match$921[1];
                          if (!match$922) {
                            {
                              $r351 = true;
                              break r$351;
                            }
                          }
                          const match$923 = match$922[1];
                          if (!match$923) {
                            {
                              $r351 = true;
                              break r$351;
                            }
                          }
                          if (match$923[1]) {
                            {
                              $r351 = true;
                              break r$351;
                            }
                          }
                          return _f(function (param$914) {
                            let $r350 = false;
                            r$350: {
                              {
                                if (!param$914) {
                                  {
                                    $r350 = true;
                                    break r$350;
                                  }
                                }
                                const match$918 = param$914[1];
                                if (!match$918) {
                                  {
                                    $r350 = true;
                                    break r$350;
                                  }
                                }
                                if (match$918[1]) {
                                  {
                                    $r350 = true;
                                    break r$350;
                                  }
                                }
                                return _f(function (param$915) {
                                  const match$917 = _(oc$Types$[0], [param$914[0]]);
                                  switch ($t(match$917)) {
                                    case 2:
                                      const match$916 = _(oc$Types$[0], [match$918[0]]);
                                      switch ($t(match$916)) {
                                        case 2:
                                          const x$132 = Math.abs(match$917[0]);
                                          const y$133 = Math.abs(match$917[1]);
                                          const z$134 = Math.abs(match$916[0]);
                                          const w$135 = Math.abs(match$916[1]);
                                          const t$136 = 1.0 / (
                                            x$132 + y$133 + z$134 + w$135
                                          );
                                          return $3(_(
                                            oc$Util$[30],
                                            [
                                              x$132 * t$136,
                                              y$133 * t$136,
                                              z$134 * t$136,
                                              match$920[0],
                                              match$921[0],
                                              match$922[0],
                                              match$923[0]
                                            ]));
                                        default:
                                          throw $(Match_failure$16g, $('op.ml', 80, 24));
                                      }
                                      break;
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 79, 24));
                                  }
                                });
                              }
                            }
                            if ($r350) {
                              throw $(Match_failure$16g, $('op.ml', 78, 4));
                            }
                          });
                        }
                      }
                      if ($r351) {
                        throw $(Match_failure$16g, $('op.ml', 77, 6));
                      }
                    }));
                const saturate$137 =
                  $('saturate', $(3, $(1, 0)), 3,
                    _f(function (param$905, param$906) {
                      let $r339 = false;
                      r$339: {
                        {
                          if (!param$906) {
                            {
                              $r339 = true;
                              break r$339;
                            }
                          }
                          const match$910 = param$906[1];
                          if (!match$910) {
                            {
                              $r339 = true;
                              break r$339;
                            }
                          }
                          if (match$910[1]) {
                            {
                              $r339 = true;
                              break r$339;
                            }
                          }
                          return _f(function (param$907) {
                            const match$909 = _(oc$Types$[0], [param$906[0]]);
                            switch ($t(match$909)) {
                              case 3:
                                const c$143 = match$909[0];
                                const b$142 = c$143[2];
                                const g$141 = c$143[1];
                                const r$140 = c$143[0];
                                const match$908 = _(oc$Types$[0], [match$910[0]]);
                                switch ($t(match$908)) {
                                  case 1:
                                    const t$145 =
                                      _(
                                        oc$Pervasives$[4],
                                        [1.0, _(oc$Util$[2], [0, 0, $(0.0), $(1.1), match$908[0]])]);
                                    const mx$146 = _(
                                      oc$Pervasives$[4], [r$140, _(oc$Pervasives$[4], [g$141, b$142])])
                                      + 0.01;
                                    const mn$147 = _(
                                      oc$Pervasives$[3], [r$140, _(oc$Pervasives$[3], [g$141, b$142])])
                                      - 0.01;
                                    const d$148 = 1.0 / (
                                      mx$146 - mn$147
                                    );
                                    return $3(_(
                                      oc$Util$[28],
                                      [
                                        t$145,
                                        c$143,
                                        _(
                                          oc$Util$[20],
                                          [
                                            2.0 * (
                                              r$140 - mn$147
                                            ) * d$148 - 1.0,
                                            2.0 * (
                                              g$141 - mn$147
                                            ) * d$148 - 1.0,
                                            2.0 * (
                                              b$142 - mn$147
                                            ) * d$148 - 1.0
                                          ])
                                      ]));
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 96, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 95, 20));
                            }
                          });
                        }
                      }
                      if ($r339) {
                        throw $(Match_failure$16g, $('op.ml', 94, 20));
                      }
                    }));
                const scalar$149 =
                  $('scalar', $(2, 0), 1,
                    _f(function (param$897) {
                      const match$902 = _(oc$Util$[14], [param$897[0]]);
                      const phi$154 = _(oc$Util$[14], [param$897[1]]);
                      const u$155 = Math.cos(2.0 * oc$Util$[0] * phi$154);
                      const v$156 = Math.sin(2.0 * oc$Util$[0] * phi$154);
                      return _f(function (param$898) {
                        let $r325 = false;
                        r$325: {
                          {
                            if (!param$898) {
                              {
                                $r325 = true;
                                break r$325;
                              }
                            }
                            if (param$898[1]) {
                              {
                                $r325 = true;
                                break r$325;
                              }
                            }
                            return _f(function (param$899) {
                              const match$900 = _(oc$Types$[0], [param$898[0]]);
                              switch ($t(match$900)) {
                                case 2:
                                  return $1((
                                      match$900[0] - match$902[0]
                                    ) * u$155 +
                                    (
                                      match$900[1] - match$902[1]
                                    ) * v$156);
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 118, 24));
                              }
                            });
                          }
                        }
                        if ($r325) {
                          throw $(Match_failure$16g, $('op.ml', 117, 4));
                        }
                      });
                    }));
                const pmult$160 =
                  $('pmult', $(2, $(2, 0)), 2,
                    _f(function (param$886) {
                      const match$893 = _(oc$Util$[14], [param$886[0]]);
                      const y$163 = match$893[1];
                      const x$162 = match$893[0];
                      return _f(function (param$887) {
                        let $r319 = false;
                        r$319: {
                          {
                            if (!param$887) {
                              {
                                $r319 = true;
                                break r$319;
                              }
                            }
                            const match$891 = param$887[1];
                            if (!match$891) {
                              {
                                $r319 = true;
                                break r$319;
                              }
                            }
                            if (match$891[1]) {
                              {
                                $r319 = true;
                                break r$319;
                              }
                            }
                            return _f(function (param$888) {
                              const match$890 = _(oc$Types$[0], [param$887[0]]);
                              switch ($t(match$890)) {
                                case 2:
                                  const match$889 = _(oc$Types$[0], [match$891[0]]);
                                  switch ($t(match$889)) {
                                    case 2:
                                      const u$27$170 = match$890[0] - x$162;
                                      const v$27$171 = match$890[1] - y$163;
                                      const w$27$172 = match$889[0] - x$162;
                                      const t$27$173 = match$889[1] - y$163;
                                      return $2(
                                        x$162 + u$27$170 * w$27$172 - v$27$171 * t$27$173,
                                        y$163 + u$27$170 * t$27$173 + v$27$171 * w$27$172);
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 130, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 129, 24));
                              }
                            });
                          }
                        }
                        if ($r319) {
                          throw $(Match_failure$16g, $('op.ml', 128, 5));
                        }
                      });
                    }));
                const protfold$174 =
                  $('protfold', $(2, $(2, 0)), 2,
                    _f(function (param$876) {
                      const n$176 = oc$Util$[0] / Math.ceil(
                        _(oc$Util$[2], [0, 0, $(1.5), $(12.0), _(oc$Util$[14], [param$876[1]])]));
                      return _f(function (param$877) {
                        let $r308 = false;
                        r$308: {
                          {
                            if (!param$877) {
                              {
                                $r308 = true;
                                break r$308;
                              }
                            }
                            const match$881 = param$877[1];
                            if (!match$881) {
                              {
                                $r308 = true;
                                break r$308;
                              }
                            }
                            if (match$881[1]) {
                              {
                                $r308 = true;
                                break r$308;
                              }
                            }
                            return _f(function (param$878) {
                              const match$880 = _(oc$Types$[0], [param$877[0]]);
                              switch ($t(match$880)) {
                                case 2:
                                  const match$879 = _(oc$Types$[0], [match$881[0]]);
                                  switch ($t(match$879)) {
                                    case 2:
                                      const y$182 = match$879[1];
                                      const x$181 = match$879[0];
                                      const u$27$183 = match$880[0] - x$181;
                                      const v$27$184 = match$880[1] - y$182;
                                      const phi$185 =
                                        _(
                                          oc$Util$[2],
                                          [
                                            $(-n$176),
                                            $(n$176),
                                            $(-oc$Util$[0]),
                                            $(oc$Util$[0]),
                                            Math.atan2(v$27$184, u$27$183)
                                          ]);
                                      const r$186 = Math.sqrt(u$27$183 * u$27$183 + v$27$184 * v$27$184);
                                      return $2(x$181 + r$186 * Math.cos(phi$185), y$182 + r$186 * Math.sin(
                                        phi$185));
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 146, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 145, 24));
                              }
                            });
                          }
                        }
                        if ($r308) {
                          throw $(Match_failure$16g, $('op.ml', 144, 4));
                        }
                      });
                    }));
                const fold$187 =
                  $('fold', $(2, $(2, $(1, 0))), 2,
                    _f(function (param$864) {
                      const s$188 = param$864[1];
                      const wgh1$190 =
                        _(
                          oc$Pervasives$[4],
                          [0.0, _(oc$Util$[2], [0, 0, $(-1.1), $(0.3), _(oc$Util$[14], [s$188])])]);
                      const wgh2$191 =
                        _(
                          oc$Pervasives$[4],
                          [0.0, _(oc$Util$[2], [0, 0, $(-1.1), $(0.3), _(oc$Util$[14], [s$188])])]);
                      const match$873 = _(oc$Util$[14], [param$864[0]]);
                      const x1$194 = (
                        1.0 - wgh1$190
                      ) * match$873[0];
                      const y1$195 = (
                        1.0 - wgh1$190
                      ) * match$873[1];
                      const phi$196 = (
                        1.0 - wgh2$191
                      ) * 2.0 * oc$Util$[0] * _(oc$Util$[14], [s$188]);
                      return _f(function (param$865) {
                        let $r292 = false;
                        r$292: {
                          {
                            if (!param$865) {
                              {
                                $r292 = true;
                                break r$292;
                              }
                            }
                            const match$870 = param$865[1];
                            if (!match$870) {
                              {
                                $r292 = true;
                                break r$292;
                              }
                            }
                            const match$871 = match$870[1];
                            if (!match$871) {
                              {
                                $r292 = true;
                                break r$292;
                              }
                            }
                            if (match$871[1]) {
                              {
                                $r292 = true;
                                break r$292;
                              }
                            }
                            return _f(function (param$866) {
                              const match$869 = _(oc$Types$[0], [param$865[0]]);
                              switch ($t(match$869)) {
                                case 2:
                                  const match$868 = _(oc$Types$[0], [match$870[0]]);
                                  switch ($t(match$868)) {
                                    case 2:
                                      const v$203 = match$868[1];
                                      const u$202 = match$868[0];
                                      const match$867 = _(oc$Types$[0], [match$871[0]]);
                                      switch ($t(match$867)) {
                                        case 1:
                                          const x$27$205 = x1$194 + wgh1$190 * match$869[0];
                                          const y$27$206 = y1$195 + wgh1$190 * match$869[1];
                                          const a$207 = u$202 - x$27$205;
                                          const b$208 = v$203 - y$27$206;
                                          const t$27$209 = phi$196 + wgh2$191 * 2.0 * oc$Util$[0]
                                            * match$867[0];
                                          const cs$210 = Math.cos(t$27$209);
                                          const sn$211 = Math.sin(t$27$209);
                                          const r$212 = 2.0 * _(
                                            oc$Pervasives$[4], [0.0, a$207 * cs$210 + b$208 * sn$211]);
                                          return $2(u$202 - r$212 * cs$210, v$203 - r$212 * sn$211);
                                        default:
                                          throw $(Match_failure$16g, $('op.ml', 169, 24));
                                      }
                                      break;
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 168, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 167, 24));
                              }
                            });
                          }
                        }
                        if ($r292) {
                          throw $(Match_failure$16g, $('op.ml', 166, 4));
                        }
                      });
                    }));
                const dist$213 =
                  $('dist', $(2, $(2, 0)), 1,
                    _f(function (param$854) {
                      const wgh$216 =
                        _(
                          oc$Pervasives$[4],
                          [0.0, _(oc$Util$[2], [0, 0, $(-0.2), $(0.5), _(oc$Util$[14], [param$854[1]])])]);
                      const match$861 = _(oc$Util$[14], [param$854[0]]);
                      const x1$219 = (
                        1.0 - wgh$216
                      ) * match$861[0];
                      const y1$220 = (
                        1.0 - wgh$216
                      ) * match$861[1];
                      return _f(function (param$855) {
                        let $r273 = false;
                        r$273: {
                          {
                            if (!param$855) {
                              {
                                $r273 = true;
                                break r$273;
                              }
                            }
                            const match$859 = param$855[1];
                            if (!match$859) {
                              {
                                $r273 = true;
                                break r$273;
                              }
                            }
                            if (match$859[1]) {
                              {
                                $r273 = true;
                                break r$273;
                              }
                            }
                            return _f(function (param$856) {
                              const match$858 = _(oc$Types$[0], [param$855[0]]);
                              switch ($t(match$858)) {
                                case 2:
                                  const match$857 = _(oc$Types$[0], [match$859[0]]);
                                  switch ($t(match$857)) {
                                    case 2:
                                      const dx$227 = match$858[0] - x1$219 - wgh$216 * match$857[0];
                                      const dy$228 = match$858[1] - y1$220 - wgh$216 * match$857[1];
                                      return $1(Math.sqrt(2.0 * (
                                        dx$227 * dx$227 + dy$228 * dy$228
                                      )) - 1.0);
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 192, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 191, 24));
                              }
                            });
                          }
                        }
                        if ($r273) {
                          throw $(Match_failure$16g, $('op.ml', 190, 4));
                        }
                      });
                    }));
                const rotate$229 =
                  $('rotate', $(2, $(2, $(1, 0))), 2,
                    _f(function (param$842) {
                      const s$230 = param$842[1];
                      const wgh1$232 =
                        _(
                          oc$Pervasives$[4],
                          [0.0, _(oc$Util$[2], [0, 0, $(-0.5), $(0.3), _(oc$Util$[14], [s$230])])]);
                      const wgh2$233 =
                        _(
                          oc$Pervasives$[4],
                          [0.0, _(oc$Util$[2], [0, 0, $(-0.5), $(0.3), _(oc$Util$[14], [s$230])])]);
                      const match$851 = _(oc$Util$[14], [param$842[0]]);
                      const x1$236 = (
                        1.0 - wgh1$232
                      ) * match$851[0];
                      const y1$237 = (
                        1.0 - wgh1$232
                      ) * match$851[1];
                      const phi$238 = (
                        1.0 - wgh2$233
                      ) * 2.0 * oc$Util$[0] * _(oc$Util$[14], [s$230]);
                      return _f(function (param$843) {
                        let $r259 = false;
                        r$259: {
                          {
                            if (!param$843) {
                              {
                                $r259 = true;
                                break r$259;
                              }
                            }
                            const match$848 = param$843[1];
                            if (!match$848) {
                              {
                                $r259 = true;
                                break r$259;
                              }
                            }
                            const match$849 = match$848[1];
                            if (!match$849) {
                              {
                                $r259 = true;
                                break r$259;
                              }
                            }
                            if (match$849[1]) {
                              {
                                $r259 = true;
                                break r$259;
                              }
                            }
                            return _f(function (param$844) {
                              const match$847 = _(oc$Types$[0], [param$843[0]]);
                              switch ($t(match$847)) {
                                case 2:
                                  const match$846 = _(oc$Types$[0], [match$848[0]]);
                                  switch ($t(match$846)) {
                                    case 2:
                                      const match$845 = _(oc$Types$[0], [match$849[0]]);
                                      switch ($t(match$845)) {
                                        case 1:
                                          const x$27$247 = x1$236 + wgh1$232 * match$847[0];
                                          const y$27$248 = y1$237 + wgh1$232 * match$847[1];
                                          const a$249 = match$846[0] - x$27$247;
                                          const b$250 = match$846[1] - y$27$248;
                                          const t$27$251 = phi$238 + wgh2$233 * 2.0 * oc$Util$[0]
                                            * match$845[0];
                                          const cs$252 = Math.cos(t$27$251);
                                          const sn$253 = Math.sin(t$27$251);
                                          return $2(
                                            x$27$247 + cs$252 * a$249 + sn$253 * b$250,
                                            y$27$248 - sn$253 * a$249 + cs$252 * b$250);
                                        default:
                                          throw $(Match_failure$16g, $('op.ml', 214, 24));
                                      }
                                      break;
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 213, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 212, 24));
                              }
                            });
                          }
                        }
                        if ($r259) {
                          throw $(Match_failure$16g, $('op.ml', 211, 4));
                        }
                      });
                    }));
                const discretize$254 =
                  $('discretize', $(2, $(2, 0)), 2,
                    _f(function (param$832) {
                      const match$839 = _(oc$Util$[14], [param$832[0]]);
                      const t$259 =
                        _(
                          oc$Pervasives$[4],
                          [0.0, _(oc$Util$[2], [0, 0, $(-0.1), $(0.8), _(oc$Util$[14], [param$832[1]])])]);
                      const a$260 = 0.1 * (
                        1.0 - t$259
                      ) * match$839[0];
                      const b$261 = 0.1 * (
                        1.0 - t$259
                      ) * match$839[1];
                      return _f(function (param$833) {
                        let $r241 = false;
                        r$241: {
                          {
                            if (!param$833) {
                              {
                                $r241 = true;
                                break r$241;
                              }
                            }
                            const match$837 = param$833[1];
                            if (!match$837) {
                              {
                                $r241 = true;
                                break r$241;
                              }
                            }
                            if (match$837[1]) {
                              {
                                $r241 = true;
                                break r$241;
                              }
                            }
                            return _f(function (param$834) {
                              const match$836 = _(oc$Types$[0], [param$833[0]]);
                              switch ($t(match$836)) {
                                case 2:
                                  const match$835 = _(oc$Types$[0], [match$837[0]]);
                                  switch ($t(match$835)) {
                                    case 2:
                                      const a$27$268 = match$835[0] * t$259 + a$260;
                                      const b$27$269 = match$835[1] * t$259 + b$261;
                                      return $2(
                                        a$27$268 * Math.floor(match$836[0] / a$27$268),
                                        b$27$269 * Math.floor(match$836[1] / b$27$269));
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 236, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 235, 24));
                              }
                            });
                          }
                        }
                        if ($r241) {
                          throw $(Match_failure$16g, $('op.ml', 234, 4));
                        }
                      });
                    }));
                const pplus$270 =
                  $('pplus', $(2, $(2, 0)), 2,
                    _f(function (param$824, param$825) {
                      let $r233 = false;
                      r$233: {
                        {
                          if (!param$825) {
                            {
                              $r233 = true;
                              break r$233;
                            }
                          }
                          const match$829 = param$825[1];
                          if (!match$829) {
                            {
                              $r233 = true;
                              break r$233;
                            }
                          }
                          if (match$829[1]) {
                            {
                              $r233 = true;
                              break r$233;
                            }
                          }
                          return _f(function (param$826) {
                            const match$828 = _(oc$Types$[0], [param$825[0]]);
                            switch ($t(match$828)) {
                              case 2:
                                const match$827 = _(oc$Types$[0], [match$829[0]]);
                                switch ($t(match$827)) {
                                  case 2:
                                    return $2(0.5 * (
                                      match$828[0] + match$827[0]
                                    ), 0.5 * (
                                      match$828[1] + match$827[1]
                                    ));
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 250, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 249, 20));
                            }
                          });
                        }
                      }
                      if ($r233) {
                        throw $(Match_failure$16g, $('op.ml', 248, 20));
                      }
                    }));
                const fplus$277 =
                  $('fplus', $(1, $(1, 0)), 1,
                    _f(function (param$816, param$817) {
                      let $r227 = false;
                      r$227: {
                        {
                          if (!param$817) {
                            {
                              $r227 = true;
                              break r$227;
                            }
                          }
                          const match$821 = param$817[1];
                          if (!match$821) {
                            {
                              $r227 = true;
                              break r$227;
                            }
                          }
                          if (match$821[1]) {
                            {
                              $r227 = true;
                              break r$227;
                            }
                          }
                          return _f(function (param$818) {
                            const match$820 = _(oc$Types$[0], [param$817[0]]);
                            switch ($t(match$820)) {
                              case 1:
                                const match$819 = _(oc$Types$[0], [match$821[0]]);
                                switch ($t(match$819)) {
                                  case 1:
                                    return $1(0.5 * (
                                      match$820[0] + match$819[0]
                                    ));
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 260, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 259, 20));
                            }
                          });
                        }
                      }
                      if ($r227) {
                        throw $(Match_failure$16g, $('op.ml', 258, 20));
                      }
                    }));
                const ftimes$282 =
                  $('ftimes', $(1, $(1, 0)), 1,
                    _f(function (param$805) {
                      const match$812 = _(oc$Util$[14], [param$805[0]]);
                      return _f(function (param$806) {
                        let $r220 = false;
                        r$220: {
                          {
                            if (!param$806) {
                              {
                                $r220 = true;
                                break r$220;
                              }
                            }
                            const match$810 = param$806[1];
                            if (!match$810) {
                              {
                                $r220 = true;
                                break r$220;
                              }
                            }
                            if (match$810[1]) {
                              {
                                $r220 = true;
                                break r$220;
                              }
                            }
                            return _f(function (param$807) {
                              const match$809 = _(oc$Types$[0], [param$806[0]]);
                              switch ($t(match$809)) {
                                case 1:
                                  const match$808 = _(oc$Types$[0], [match$810[0]]);
                                  switch ($t(match$808)) {
                                    case 1:
                                      return $1((
                                        match$809[0] + match$812[0]
                                      ) * (
                                        match$808[0] + match$812[1]
                                      ));
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 272, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 271, 24));
                              }
                            });
                          }
                        }
                        if ($r220) {
                          throw $(Match_failure$16g, $('op.ml', 270, 18));
                        }
                      });
                    }));
                const fmix$290 =
                  $('fmix', $(1, $(1, $(1, 0))), 1,
                    _f(function (param$795, param$796) {
                      let $r214 = false;
                      r$214: {
                        {
                          if (!param$796) {
                            {
                              $r214 = true;
                              break r$214;
                            }
                          }
                          const match$801 = param$796[1];
                          if (!match$801) {
                            {
                              $r214 = true;
                              break r$214;
                            }
                          }
                          const match$802 = match$801[1];
                          if (!match$802) {
                            {
                              $r214 = true;
                              break r$214;
                            }
                          }
                          if (match$802[1]) {
                            {
                              $r214 = true;
                              break r$214;
                            }
                          }
                          return _f(function (param$797) {
                            const match$800 = _(oc$Types$[0], [param$796[0]]);
                            switch ($t(match$800)) {
                              case 1:
                                const match$799 = _(oc$Types$[0], [match$801[0]]);
                                switch ($t(match$799)) {
                                  case 1:
                                    const match$798 = _(oc$Types$[0], [match$802[0]]);
                                    switch ($t(match$798)) {
                                      case 1:
                                        const u$297 = Math.abs(
                                          _(oc$Util$[3], [$(0.0), $(1.0), match$800[0]]));
                                        return $1(u$297 * match$799[0] + (
                                          1.0 - u$297
                                        ) * match$798[0]);
                                      default:
                                        throw $(Match_failure$16g, $('op.ml', 283, 20));
                                    }
                                    break;
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 282, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 281, 20));
                            }
                          });
                        }
                      }
                      if ($r214) {
                        throw $(Match_failure$16g, $('op.ml', 280, 20));
                      }
                    }));
                const pmix$298 =
                  $('pmix', $(2, $(2, $(1, 0))), 2,
                    _f(function (param$785, param$786) {
                      let $r206 = false;
                      r$206: {
                        {
                          if (!param$786) {
                            {
                              $r206 = true;
                              break r$206;
                            }
                          }
                          const match$791 = param$786[1];
                          if (!match$791) {
                            {
                              $r206 = true;
                              break r$206;
                            }
                          }
                          const match$792 = match$791[1];
                          if (!match$792) {
                            {
                              $r206 = true;
                              break r$206;
                            }
                          }
                          if (match$792[1]) {
                            {
                              $r206 = true;
                              break r$206;
                            }
                          }
                          return _f(function (param$787) {
                            const match$790 = _(oc$Types$[0], [param$786[0]]);
                            switch ($t(match$790)) {
                              case 2:
                                const match$789 = _(oc$Types$[0], [match$791[0]]);
                                switch ($t(match$789)) {
                                  case 2:
                                    const match$788 = _(oc$Types$[0], [match$792[0]]);
                                    switch ($t(match$788)) {
                                      case 1:
                                        const t$307 = Math.abs(_(oc$Util$[2], [0, 0, 0, 0, match$788[0]]));
                                        return $2(
                                          t$307 * match$790[0] + (
                                            1.0 - t$307
                                          ) * match$789[0],
                                          t$307 * match$790[1] + (
                                            1.0 - t$307
                                          ) * match$789[1]);
                                      default:
                                        throw $(Match_failure$16g, $('op.ml', 295, 20));
                                    }
                                    break;
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 294, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 293, 20));
                            }
                          });
                        }
                      }
                      if ($r206) {
                        throw $(Match_failure$16g, $('op.ml', 292, 20));
                      }
                    }));
                const fatan$308 =
                  $('fatan', $(1, 0), 1,
                    _f(function (param$774) {
                      let $r198 = false;
                      r$198: {
                        {
                          const match$779 = _(oc$Util$[15], [2, param$774[1]]);
                          if (!match$779) {
                            {
                              $r198 = true;
                              break r$198;
                            }
                          }
                          const match$780 = match$779[1];
                          if (!match$780) {
                            {
                              $r198 = true;
                              break r$198;
                            }
                          }
                          if (match$780[1]) {
                            {
                              $r198 = true;
                              break r$198;
                            }
                          }
                          const a$312 = _(oc$Util$[2], [0, 0, $(0.1), $(10.0), match$779[0]]);
                          return _f(function (param$775) {
                            let $r196 = false;
                            r$196: {
                              {
                                if (!param$775) {
                                  {
                                    $r196 = true;
                                    break r$196;
                                  }
                                }
                                if (param$775[1]) {
                                  {
                                    $r196 = true;
                                    break r$196;
                                  }
                                }
                                return _f(function (param$776) {
                                  const match$777 = _(oc$Types$[0], [param$775[0]]);
                                  switch ($t(match$777)) {
                                    case 1:
                                      return $1(Math.atan((
                                        match$777[0] - match$780[0]
                                      ) / a$312) * 2.0 / oc$Util$[0]);
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 308, 24));
                                  }
                                });
                              }
                            }
                            if ($r196) {
                              throw $(Match_failure$16g, $('op.ml', 307, 18));
                            }
                          });
                        }
                      }
                      if ($r198) {
                        throw $(Match_failure$16g, $('op.ml', 305, 6));
                      }
                    }));
                const fsin$315 =
                  $('fsin', $(1, 0), 1,
                    _f(function (param$766) {
                      const f$317 = 10.0 * oc$Util$[0] * _(oc$Util$[14], [param$766[1]]);
                      return _f(function (param$767) {
                        let $r190 = false;
                        r$190: {
                          {
                            if (!param$767) {
                              {
                                $r190 = true;
                                break r$190;
                              }
                            }
                            if (param$767[1]) {
                              {
                                $r190 = true;
                                break r$190;
                              }
                            }
                            return _f(function (param$768) {
                              const match$769 = _(oc$Types$[0], [param$767[0]]);
                              switch ($t(match$769)) {
                                case 1:
                                  return $1(Math.sin(f$317 * match$769[0]));
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 319, 24));
                              }
                            });
                          }
                        }
                        if ($r190) {
                          throw $(Match_failure$16g, $('op.ml', 318, 18));
                        }
                      });
                    }));
                const sqrt$320 =
                  $('sqrt', $(1, 0), 1,
                    _f(function (param$760, param$761) {
                      let $r185 = false;
                      r$185: {
                        {
                          if (!param$761) {
                            {
                              $r185 = true;
                              break r$185;
                            }
                          }
                          if (param$761[1]) {
                            {
                              $r185 = true;
                              break r$185;
                            }
                          }
                          return _f(function (param$762) {
                            const match$763 = _(oc$Types$[0], [param$761[0]]);
                            switch ($t(match$763)) {
                              case 1:
                                return $1(2.0 * Math.sqrt(Math.abs(match$763[0])) - 1.0);
                              default:
                                throw $(Match_failure$16g, $('op.ml', 328, 20));
                            }
                          });
                        }
                      }
                      if ($r185) {
                        throw $(Match_failure$16g, $('op.ml', 327, 20));
                      }
                    }));
                const fabs$323 =
                  $('abs', $(1, 0), 1,
                    _f(function (param$754, param$755) {
                      let $r180 = false;
                      r$180: {
                        {
                          if (!param$755) {
                            {
                              $r180 = true;
                              break r$180;
                            }
                          }
                          if (param$755[1]) {
                            {
                              $r180 = true;
                              break r$180;
                            }
                          }
                          return _f(function (param$756) {
                            const match$757 = _(oc$Types$[0], [param$755[0]]);
                            switch ($t(match$757)) {
                              case 1:
                                return $1(2.0 * Math.abs(match$757[0]) - 1.0);
                              default:
                                throw $(Match_failure$16g, $('op.ml', 339, 20));
                            }
                          });
                        }
                      }
                      if ($r180) {
                        throw $(Match_failure$16g, $('op.ml', 338, 20));
                      }
                    }));
                const fmax$326 =
                  $('max', $(1, $(1, 0)), 1,
                    _f(function (param$746, param$747) {
                      let $r175 = false;
                      r$175: {
                        {
                          if (!param$747) {
                            {
                              $r175 = true;
                              break r$175;
                            }
                          }
                          const match$751 = param$747[1];
                          if (!match$751) {
                            {
                              $r175 = true;
                              break r$175;
                            }
                          }
                          if (match$751[1]) {
                            {
                              $r175 = true;
                              break r$175;
                            }
                          }
                          return _f(function (param$748) {
                            const match$750 = _(oc$Types$[0], [param$747[0]]);
                            switch ($t(match$750)) {
                              case 1:
                                const match$749 = _(oc$Types$[0], [match$751[0]]);
                                switch ($t(match$749)) {
                                  case 1:
                                    return $1(_(oc$Pervasives$[4], [match$750[0], match$749[0]]));
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 350, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 349, 20));
                            }
                          });
                        }
                      }
                      if ($r175) {
                        throw $(Match_failure$16g, $('op.ml', 348, 20));
                      }
                    }));
                const cmix$331 =
                  $('cmix', $(1, $(3, $(3, 0))), 3,
                    _f(function (param$736, param$737) {
                      let $r169 = false;
                      r$169: {
                        {
                          if (!param$737) {
                            {
                              $r169 = true;
                              break r$169;
                            }
                          }
                          const match$742 = param$737[1];
                          if (!match$742) {
                            {
                              $r169 = true;
                              break r$169;
                            }
                          }
                          const match$743 = match$742[1];
                          if (!match$743) {
                            {
                              $r169 = true;
                              break r$169;
                            }
                          }
                          if (match$743[1]) {
                            {
                              $r169 = true;
                              break r$169;
                            }
                          }
                          return _f(function (param$738) {
                            const match$741 = _(oc$Types$[0], [param$737[0]]);
                            switch ($t(match$741)) {
                              case 1:
                                const match$740 = _(oc$Types$[0], [match$742[0]]);
                                switch ($t(match$740)) {
                                  case 3:
                                    const match$739 = _(oc$Types$[0], [match$743[0]]);
                                    switch ($t(match$739)) {
                                      case 3:
                                        return $3(
                                          _(oc$Util$[28], [match$741[0], match$740[0], match$739[0]]));
                                      default:
                                        throw $(Match_failure$16g, $('op.ml', 361, 20));
                                    }
                                    break;
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 360, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 359, 20));
                            }
                          });
                        }
                      }
                      if ($r169) {
                        throw $(Match_failure$16g, $('op.ml', 358, 20));
                      }
                    }));
                const inrange$338 =
                  $('negative', $(1, 0), 0,
                    _f(function (param$725) {
                      let $r162 = false;
                      r$162: {
                        {
                          const match$730 = _(oc$Util$[15], [2, param$725[1]]);
                          if (!match$730) {
                            {
                              $r162 = true;
                              break r$162;
                            }
                          }
                          const match$731 = match$730[1];
                          if (!match$731) {
                            {
                              $r162 = true;
                              break r$162;
                            }
                          }
                          if (match$731[1]) {
                            {
                              $r162 = true;
                              break r$162;
                            }
                          }
                          const b$341 = match$731[0];
                          const a$342 = _(oc$Pervasives$[3], [match$730[0], b$341]);
                          const b$343 = _(oc$Pervasives$[4], [a$342, b$341]);
                          return _f(function (param$726) {
                            let $r159 = false;
                            r$159: {
                              {
                                if (!param$726) {
                                  {
                                    $r159 = true;
                                    break r$159;
                                  }
                                }
                                if (param$726[1]) {
                                  {
                                    $r159 = true;
                                    break r$159;
                                  }
                                }
                                return _f(function (param$727) {
                                  const match$728 = _(oc$Types$[0], [param$726[0]]);
                                  switch ($t(match$728)) {
                                    case 1:
                                      const x$345 = match$728[0];
                                      return $(a$342 < x$345 && x$345 < b$343);
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 374, 24));
                                  }
                                });
                              }
                            }
                            if ($r159) {
                              throw $(Match_failure$16g, $('op.ml', 373, 18));
                            }
                          });
                        }
                      }
                      if ($r162) {
                        throw $(Match_failure$16g, $('op.ml', 370, 6));
                      }
                    }));
                const negative$346 =
                  $('negative', $(1, 0), 0,
                    _f(function (param$719, param$720) {
                      let $r154 = false;
                      r$154: {
                        {
                          if (!param$720) {
                            {
                              $r154 = true;
                              break r$154;
                            }
                          }
                          if (param$720[1]) {
                            {
                              $r154 = true;
                              break r$154;
                            }
                          }
                          return _f(function (param$721) {
                            const match$722 = _(oc$Types$[0], [param$720[0]]);
                            switch ($t(match$722)) {
                              case 1:
                                return $(match$722[0] < 0.0);
                              default:
                                throw $(Match_failure$16g, $('op.ml', 383, 20));
                            }
                          });
                        }
                      }
                      if ($r154) {
                        throw $(Match_failure$16g, $('op.ml', 382, 20));
                      }
                    }));
                const fless$349 =
                  $('fless', $(1, $(1, 0)), 0,
                    _f(function (param$711, param$712) {
                      let $r149 = false;
                      r$149: {
                        {
                          if (!param$712) {
                            {
                              $r149 = true;
                              break r$149;
                            }
                          }
                          const match$716 = param$712[1];
                          if (!match$716) {
                            {
                              $r149 = true;
                              break r$149;
                            }
                          }
                          if (match$716[1]) {
                            {
                              $r149 = true;
                              break r$149;
                            }
                          }
                          return _f(function (param$713) {
                            const match$715 = _(oc$Types$[0], [param$712[0]]);
                            switch ($t(match$715)) {
                              case 1:
                                const match$714 = _(oc$Types$[0], [match$716[0]]);
                                switch ($t(match$714)) {
                                  case 1:
                                    return $(match$715[0] < match$714[0]);
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 394, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 393, 20));
                            }
                          });
                        }
                      }
                      if ($r149) {
                        throw $(Match_failure$16g, $('op.ml', 392, 20));
                      }
                    }));
                const even$354 =
                  $('even', $(1, $(1, 0)), 0,
                    _f(function (param$701) {
                      const s$355 = param$701[1];
                      const v$356 = _(
                        oc$Pervasives$[4],
                        [0.0, _(oc$Util$[2], [0, 0, $(-0.5), $(2.0), _(oc$Util$[14], [s$355])])]);
                      const w$357 = _(oc$Util$[2], [0, 0, $(2.0), $(20.0), _(oc$Util$[14], [s$355])]);
                      return _f(function (param$702) {
                        let $r141 = false;
                        r$141: {
                          {
                            if (!param$702) {
                              {
                                $r141 = true;
                                break r$141;
                              }
                            }
                            const match$706 = param$702[1];
                            if (!match$706) {
                              {
                                $r141 = true;
                                break r$141;
                              }
                            }
                            if (match$706[1]) {
                              {
                                $r141 = true;
                                break r$141;
                              }
                            }
                            return _f(function (param$703) {
                              const match$705 = _(oc$Types$[0], [param$702[0]]);
                              switch ($t(match$705)) {
                                case 1:
                                  const match$704 = _(oc$Types$[0], [match$706[0]]);
                                  switch ($t(match$704)) {
                                    case 1:
                                      const y$361 = match$704[0];
                                      return $((
                                        v$356 * y$361 * y$361 * y$361 + w$357 * match$705[0] >> 0
                                      ) % 2 === 0);
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 407, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 406, 24));
                              }
                            });
                          }
                        }
                        if ($r141) {
                          throw $(Match_failure$16g, $('op.ml', 405, 18));
                        }
                      });
                    }));
                const close$362 =
                  $('close', $(2, $(2, 0)), 0,
                    _f(function (param$691) {
                      const r$364 = _(oc$Util$[14], [param$691[1]]);
                      const r2$365 = r$364 * r$364;
                      return _f(function (param$692) {
                        let $r133 = false;
                        r$133: {
                          {
                            if (!param$692) {
                              {
                                $r133 = true;
                                break r$133;
                              }
                            }
                            const match$696 = param$692[1];
                            if (!match$696) {
                              {
                                $r133 = true;
                                break r$133;
                              }
                            }
                            if (match$696[1]) {
                              {
                                $r133 = true;
                                break r$133;
                              }
                            }
                            return _f(function (param$693) {
                              const match$695 = _(oc$Types$[0], [param$692[0]]);
                              switch ($t(match$695)) {
                                case 2:
                                  const match$694 = _(oc$Types$[0], [match$696[0]]);
                                  switch ($t(match$694)) {
                                    case 2:
                                      const a$372 = match$695[0] - match$694[0];
                                      const b$373 = match$695[1] - match$694[1];
                                      return $(a$372 * a$372 + b$373 * b$373 < r2$365);
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 420, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 419, 24));
                              }
                            });
                          }
                        }
                        if ($r133) {
                          throw $(Match_failure$16g, $('op.ml', 418, 4));
                        }
                      });
                    }));
                const pfoci$374 =
                  $('pfoci', $(2, $(2, $(2, 0))), 2,
                    _f(function (param$675) {
                      const s$376 = param$675[1];
                      const f$375 = param$675[0];
                      const n$377 = _(oc$Pervasives$[3], [_(oc$List$[0], [f$375]), _(oc$List$[0], [s$376])]);
                      const k$378 = _(oc$Util$[5], [2, n$377]);
                      const p$379 = _(
                        oc$Pervasives$[4],
                        [0.0, _(oc$Util$[2], [0, 0, $(-0.05), $(0.5), _(oc$Util$[14], [s$376])])]);
                      const fs$380 =
                        function () {
                          const xs$381 = _(oc$Util$[15], [k$378, f$375]);
                          const ys$382 = _(oc$Util$[15], [k$378, s$376]);
                          return _(
                            oc$List$[36],
                            [
                              xs$381, _(oc$List$[10], [
                              _f(function (r$383) {
                                return 0.1 * r$383 * r$383;
                              }), ys$382
                            ])
                            ]);
                        }();
                      return _f(function (param$676) {
                        let $r118 = false;
                        r$118: {
                          {
                            if (!param$676) {
                              {
                                $r118 = true;
                                break r$118;
                              }
                            }
                            const match$686 = param$676[1];
                            if (!match$686) {
                              {
                                $r118 = true;
                                break r$118;
                              }
                            }
                            const match$687 = match$686[1];
                            if (!match$687) {
                              {
                                $r118 = true;
                                break r$118;
                              }
                            }
                            if (match$687[1]) {
                              {
                                $r118 = true;
                                break r$118;
                              }
                            }
                            return _f(function (param$677) {
                              const match$685 = _(oc$Types$[0], [param$676[0]]);
                              switch ($t(match$685)) {
                                case 2:
                                  const y$388 = match$685[1];
                                  const x$387 = match$685[0];
                                  const t$389 = _(oc$Types$[0], [match$686[0]]);
                                  const match$684 = _(oc$Types$[0], [match$687[0]]);
                                  switch ($t(match$684)) {
                                    case 2:
                                      try {
                                        const match$681 =
                                          _(
                                            oc$List$[25],
                                            [
                                              _f(function
                                                (param$679) {
                                                const match$680 = param$679[0];
                                                const a$397 = x$387 - match$680[0] - p$379 * match$684[0];
                                                const b$398 = y$388 - match$680[1] - p$379 * match$684[1];
                                                return a$397 * a$397 + b$398 * b$398 < param$679[1];
                                              }),
                                              fs$380
                                            ]);
                                        const match$682 = match$681[0];
                                        return $2(x$387 - match$682[0], y$388 - match$682[1]);
                                      }
                                      catch (exn$678) {
                                        if (exn$678[0] === Not_found$20g) {
                                          return t$389;
                                        }
                                        throw exn$678;
                                      }
                                      break;
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 441, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 439, 24));
                              }
                            });
                          }
                        }
                        if ($r118) {
                          throw $(Match_failure$16g, $('op.ml', 438, 4));
                        }
                      });
                    }));
                const pclosestmax$399 =
                  $('pclosestmax', $(2, $(1, 0)), 2,
                    _f(function (param$663) {
                      const f$400 = param$663[0];
                      const n$401 = _(oc$List$[0], [f$400]);
                      const ps$402 = _(oc$Util$[15], [_(oc$Util$[5], [n$401 / 2 >> 0, n$401]), f$400]);
                      return _f(function (param$664) {
                        let $r104 = false;
                        r$104: {
                          {
                            if (!param$664) {
                              {
                                $r104 = true;
                                break r$104;
                              }
                            }
                            const match$670 = param$664[1];
                            if (!match$670) {
                              {
                                $r104 = true;
                                break r$104;
                              }
                            }
                            if (match$670[1]) {
                              {
                                $r104 = true;
                                break r$104;
                              }
                            }
                            return _f(function (param$665) {
                              const match$669 = _(oc$Types$[0], [param$664[0]]);
                              switch ($t(match$669)) {
                                case 2:
                                  const match$668 = _(oc$Types$[0], [match$670[0]]);
                                  switch ($t(match$668)) {
                                    case 1:
                                      const t$407 = match$668[0];
                                      const match$667 =
                                        _(
                                          oc$Util$[31],
                                          [
                                            _f(function (param$666) {
                                              return __
                                              (
                                                oc$Pervasives$[4],
                                                [
                                                  t$407 * param$666[0] - match$669[0],
                                                  t$407 * param$666[1] - match$669[1]
                                                ]);
                                            }),
                                            ps$402
                                          ]);
                                      return $2(match$667[0], match$667[1]);
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 465, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 464, 24));
                              }
                            });
                          }
                        }
                        if ($r104) {
                          throw $(Match_failure$16g, $('op.ml', 463, 4));
                        }
                      });
                    }));
                const fclosest$412 =
                  $('fclosest', $(1, $(1, 0)), 1,
                    _f(function (param$653) {
                      const s$413 = param$653[1];
                      const n$414 = _(oc$List$[0], [s$413]);
                      const ss$415 = _(oc$Util$[15], [_(oc$Util$[5], [n$414 / 2 >> 0, n$414]), s$413]);
                      return _f(function (param$654) {
                        let $r94 = false;
                        r$94: {
                          {
                            if (!param$654) {
                              {
                                $r94 = true;
                                break r$94;
                              }
                            }
                            const match$658 = param$654[1];
                            if (!match$658) {
                              {
                                $r94 = true;
                                break r$94;
                              }
                            }
                            if (match$658[1]) {
                              {
                                $r94 = true;
                                break r$94;
                              }
                            }
                            return _f(function (param$655) {
                              const match$657 = _(oc$Types$[0], [param$654[0]]);
                              switch ($t(match$657)) {
                                case 1:
                                  const match$656 = _(oc$Types$[0], [match$658[0]]);
                                  switch ($t(match$656)) {
                                    case 1:
                                      return $1(_(
                                        oc$Util$[31],
                                        [
                                          _f(function
                                            (u$420) {
                                            return Math.abs(u$420 * match$656[0] - match$657[0]);
                                          }),
                                          ss$415
                                        ]));
                                    default:
                                      throw $(Match_failure$16g, $('op.ml', 480, 24));
                                  }
                                  break;
                                default:
                                  throw $(Match_failure$16g, $('op.ml', 479, 24));
                              }
                            });
                          }
                        }
                        if ($r94) {
                          throw $(Match_failure$16g, $('op.ml', 478, 18));
                        }
                      });
                    }));
                const torus$421 =
                  $('torus', $(2, $(1, $(1, 0))), 2,
                    _f(function (param$643, param$644) {
                      let $r87 = false;
                      r$87: {
                        {
                          if (!param$644) {
                            {
                              $r87 = true;
                              break r$87;
                            }
                          }
                          const match$649 = param$644[1];
                          if (!match$649) {
                            {
                              $r87 = true;
                              break r$87;
                            }
                          }
                          const match$650 = match$649[1];
                          if (!match$650) {
                            {
                              $r87 = true;
                              break r$87;
                            }
                          }
                          if (match$650[1]) {
                            {
                              $r87 = true;
                              break r$87;
                            }
                          }
                          return _f(function (param$645) {
                            const match$648 = _(oc$Types$[0], [param$644[0]]);
                            switch ($t(match$648)) {
                              case 2:
                                const match$647 = _(oc$Types$[0], [match$649[0]]);
                                switch ($t(match$647)) {
                                  case 1:
                                    const a$427 = match$647[0];
                                    const match$646 = _(oc$Types$[0], [match$650[0]]);
                                    switch ($t(match$646)) {
                                      case 1:
                                        const b$428 = match$646[0];
                                        const a$27$429 = _(oc$Pervasives$[3], [a$427, b$428]) - 0.1;
                                        const b$27$430 = _(oc$Pervasives$[4], [a$427, b$428]) + 0.1;
                                        return $2(
                                          _(
                                            oc$Util$[2],
                                            [$(a$27$429), $(b$27$430), $(-1.0), $(1.0), match$648[0]]),
                                          _(
                                            oc$Util$[2],
                                            [$(a$27$429), $(b$27$430), $(-1.0), $(1.0), match$648[1]]));
                                      default:
                                        throw $(Match_failure$16g, $('op.ml', 492, 20));
                                    }
                                    break;
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 491, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 490, 20));
                            }
                          });
                        }
                      }
                      if ($r87) {
                        throw $(Match_failure$16g, $('op.ml', 489, 20));
                      }
                    }));
                const bor$431 =
                  $('or', $(0, $(0, 0)), 0,
                    _f(function (param$635, param$636) {
                      let $r78 = false;
                      r$78: {
                        {
                          if (!param$636) {
                            {
                              $r78 = true;
                              break r$78;
                            }
                          }
                          const match$640 = param$636[1];
                          if (!match$640) {
                            {
                              $r78 = true;
                              break r$78;
                            }
                          }
                          if (match$640[1]) {
                            {
                              $r78 = true;
                              break r$78;
                            }
                          }
                          return _f(function (param$637) {
                            const match$639 = _(oc$Types$[0], [param$636[0]]);
                            switch ($t(match$639)) {
                              case 0:
                                const match$638 = _(oc$Types$[0], [match$640[0]]);
                                switch ($t(match$638)) {
                                  case 0:
                                    return $(match$639[0] || match$638[0]);
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 505, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 504, 20));
                            }
                          });
                        }
                      }
                      if ($r78) {
                        throw $(Match_failure$16g, $('op.ml', 503, 20));
                      }
                    }));
                const band$436 =
                  $('and', $(0, $(0, 0)), 0,
                    _f(function (param$627, param$628) {
                      let $r72 = false;
                      r$72: {
                        {
                          if (!param$628) {
                            {
                              $r72 = true;
                              break r$72;
                            }
                          }
                          const match$632 = param$628[1];
                          if (!match$632) {
                            {
                              $r72 = true;
                              break r$72;
                            }
                          }
                          if (match$632[1]) {
                            {
                              $r72 = true;
                              break r$72;
                            }
                          }
                          return _f(function (param$629) {
                            const match$631 = _(oc$Types$[0], [param$628[0]]);
                            switch ($t(match$631)) {
                              case 0:
                                const match$630 = _(oc$Types$[0], [match$632[0]]);
                                switch ($t(match$630)) {
                                  case 0:
                                    return $(match$631[0] && match$630[0]);
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 515, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 514, 20));
                            }
                          });
                        }
                      }
                      if ($r72) {
                        throw $(Match_failure$16g, $('op.ml', 513, 20));
                      }
                    }));
                const fif$441 =
                  $('fif', $(0, $(1, $(1, 0))), 1,
                    _f(function (param$619, param$620) {
                      let $r66 = false;
                      r$66: {
                        {
                          if (!param$620) {
                            {
                              $r66 = true;
                              break r$66;
                            }
                          }
                          const match$623 = param$620[1];
                          if (!match$623) {
                            {
                              $r66 = true;
                              break r$66;
                            }
                          }
                          const match$624 = match$623[1];
                          if (!match$624) {
                            {
                              $r66 = true;
                              break r$66;
                            }
                          }
                          if (match$624[1]) {
                            {
                              $r66 = true;
                              break r$66;
                            }
                          }
                          return _f(function (param$621) {
                            const match$622 = _(oc$Types$[0], [param$620[0]]);
                            switch ($t(match$622)) {
                              case 0:
                                const u$446 = _(oc$Types$[0], [match$623[0]]);
                                const v$447 = _(oc$Types$[0], [match$624[0]]);
                                if (match$622[0]) {
                                  return u$446;
                                }
                                return v$447;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 524, 20));
                            }
                          });
                        }
                      }
                      if ($r66) {
                        throw $(Match_failure$16g, $('op.ml', 523, 20));
                      }
                    }));
                const cif$448 =
                  $('cif', $(0, $(3, $(3, 0))), 3,
                    _f(function (param$611, param$612) {
                      let $r59 = false;
                      r$59: {
                        {
                          if (!param$612) {
                            {
                              $r59 = true;
                              break r$59;
                            }
                          }
                          const match$615 = param$612[1];
                          if (!match$615) {
                            {
                              $r59 = true;
                              break r$59;
                            }
                          }
                          const match$616 = match$615[1];
                          if (!match$616) {
                            {
                              $r59 = true;
                              break r$59;
                            }
                          }
                          if (match$616[1]) {
                            {
                              $r59 = true;
                              break r$59;
                            }
                          }
                          return _f(function (param$613) {
                            const match$614 = _(oc$Types$[0], [param$612[0]]);
                            switch ($t(match$614)) {
                              case 0:
                                const u$453 = _(oc$Types$[0], [match$615[0]]);
                                const v$454 = _(oc$Types$[0], [match$616[0]]);
                                if (match$614[0]) {
                                  return u$453;
                                }
                                return v$454;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 535, 20));
                            }
                          });
                        }
                      }
                      if ($r59) {
                        throw $(Match_failure$16g, $('op.ml', 534, 20));
                      }
                    }));
                const pif$455 =
                  $('pif', $(0, $(2, $(2, 0))), 2,
                    _f(function (param$603, param$604) {
                      let $r52 = false;
                      r$52: {
                        {
                          if (!param$604) {
                            {
                              $r52 = true;
                              break r$52;
                            }
                          }
                          const match$607 = param$604[1];
                          if (!match$607) {
                            {
                              $r52 = true;
                              break r$52;
                            }
                          }
                          const match$608 = match$607[1];
                          if (!match$608) {
                            {
                              $r52 = true;
                              break r$52;
                            }
                          }
                          if (match$608[1]) {
                            {
                              $r52 = true;
                              break r$52;
                            }
                          }
                          return _f(function (param$605) {
                            const match$606 = _(oc$Types$[0], [param$604[0]]);
                            switch ($t(match$606)) {
                              case 0:
                                const u$460 = _(oc$Types$[0], [match$607[0]]);
                                const v$461 = _(oc$Types$[0], [match$608[0]]);
                                if (match$606[0]) {
                                  return u$460;
                                }
                                return v$461;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 546, 20));
                            }
                          });
                        }
                      }
                      if ($r52) {
                        throw $(Match_failure$16g, $('op.ml', 545, 20));
                      }
                    }));
                const hsl$462 =
                  $('hsl', $(2, $(1, 0)), 3,
                    _f(function (param$594, param$595) {
                      let $r45 = false;
                      r$45: {
                        {
                          if (!param$595) {
                            {
                              $r45 = true;
                              break r$45;
                            }
                          }
                          const match$600 = param$595[1];
                          if (!match$600) {
                            {
                              $r45 = true;
                              break r$45;
                            }
                          }
                          if (match$600[1]) {
                            {
                              $r45 = true;
                              break r$45;
                            }
                          }
                          return _f(function (param$596) {
                            const match$599 = _(oc$Types$[0], [param$595[0]]);
                            switch ($t(match$599)) {
                              case 2:
                                const match$598 = _(oc$Types$[0], [match$600[0]]);
                                switch ($t(match$598)) {
                                  case 1:
                                    const h$468 = _(oc$Util$[2], [0, 0, $(0.0), $(1.0), match$599[0] / 2.0]);
                                    const s$469 = _(oc$Util$[2], [0, 0, $(0.0), $(1.0), match$598[0]]);
                                    const l$470 = _(oc$Util$[2], [0, 0, $(0.0), $(1.0), match$599[1]]);
                                    const match$597 = _(oc$Util$[22], [h$468, s$469, l$470]);
                                    return $3(_(
                                      oc$Util$[20],
                                      [
                                        2.0 * match$597[0] - 1.0, 2.0 * match$597[1] - 1.0,
                                        2.0 * match$597[2] - 1.0
                                      ]));
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 558, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 557, 20));
                            }
                          });
                        }
                      }
                      if ($r45) {
                        throw $(Match_failure$16g, $('op.ml', 556, 20));
                      }
                    }));
                const bw$474 =
                  $('bw', $(1, 0), 3,
                    _f(function (param$588, param$589) {
                      let $r35 = false;
                      r$35: {
                        {
                          if (!param$589) {
                            {
                              $r35 = true;
                              break r$35;
                            }
                          }
                          if (param$589[1]) {
                            {
                              $r35 = true;
                              break r$35;
                            }
                          }
                          return _f(function (param$590) {
                            const match$591 = _(oc$Types$[0], [param$589[0]]);
                            switch ($t(match$591)) {
                              case 1:
                                const x$476 = match$591[0];
                                return $3(_(oc$Util$[20], [x$476, x$476, x$476]));
                              default:
                                throw $(Match_failure$16g, $('op.ml', 575, 20));
                            }
                          });
                        }
                      }
                      if ($r35) {
                        throw $(Match_failure$16g, $('op.ml', 574, 20));
                      }
                    }));
                const rgb$477 =
                  $('rgb', $(1, $(1, $(1, 0))), 3,
                    _f(function (param$578, param$579) {
                      let $r30 = false;
                      r$30: {
                        {
                          if (!param$579) {
                            {
                              $r30 = true;
                              break r$30;
                            }
                          }
                          const match$584 = param$579[1];
                          if (!match$584) {
                            {
                              $r30 = true;
                              break r$30;
                            }
                          }
                          const match$585 = match$584[1];
                          if (!match$585) {
                            {
                              $r30 = true;
                              break r$30;
                            }
                          }
                          if (match$585[1]) {
                            {
                              $r30 = true;
                              break r$30;
                            }
                          }
                          return _f(function (param$580) {
                            const match$583 = _(oc$Types$[0], [param$579[0]]);
                            switch ($t(match$583)) {
                              case 1:
                                const match$582 = _(oc$Types$[0], [match$584[0]]);
                                switch ($t(match$582)) {
                                  case 1:
                                    const match$581 = _(oc$Types$[0], [match$585[0]]);
                                    switch ($t(match$581)) {
                                      case 1:
                                        return $3(
                                          _(oc$Util$[20], [match$583[0], match$582[0], match$581[0]]));
                                      default:
                                        throw $(Match_failure$16g, $('op.ml', 586, 20));
                                    }
                                    break;
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 585, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 584, 20));
                            }
                          });
                        }
                      }
                      if ($r30) {
                        throw $(Match_failure$16g, $('op.ml', 583, 20));
                      }
                    }));
                const rgbv$484 =
                  $('rgbv', $(2, $(2, 0)), 3,
                    _f(function (param$570, param$571) {
                      let $r23 = false;
                      r$23: {
                        {
                          if (!param$571) {
                            {
                              $r23 = true;
                              break r$23;
                            }
                          }
                          const match$575 = param$571[1];
                          if (!match$575) {
                            {
                              $r23 = true;
                              break r$23;
                            }
                          }
                          if (match$575[1]) {
                            {
                              $r23 = true;
                              break r$23;
                            }
                          }
                          return _f(function (param$572) {
                            const match$574 = _(oc$Types$[0], [param$571[0]]);
                            switch ($t(match$574)) {
                              case 2:
                                const match$573 = _(oc$Types$[0], [match$575[0]]);
                                switch ($t(match$573)) {
                                  case 2:
                                    const v$490 = match$573[1];
                                    return $3(_(
                                      oc$Util$[20],
                                      [match$574[0] * v$490, match$574[1] * v$490, match$573[0] * v$490]));
                                  default:
                                    throw $(Match_failure$16g, $('op.ml', 596, 20));
                                }
                                break;
                              default:
                                throw $(Match_failure$16g, $('op.ml', 595, 20));
                            }
                          });
                        }
                      }
                      if ($r23) {
                        throw $(Match_failure$16g, $('op.ml', 594, 20));
                      }
                    }));
                return $(palette_f$89, palette_p$95, palette_pf$105, palette_pp$120, saturate$137,
                  scalar$149, pmult$160, protfold$174,
                  fold$187, dist$213, rotate$229, discretize$254, pplus$270, fplus$277, ftimes$282,
                  fmix$290, pmix$298, fatan$308,
                  fsin$315, sqrt$320, fabs$323, fmax$326, cmix$331, inrange$338, negative$346, fless$349,
                  even$354, close$362,
                  pfoci$374, pclosestmax$399, fclosest$412, torus$421, bor$431, band$436, fif$441, cif$448,
                  pif$455, hsl$462,
                  bw$474, rgb$477, rgbv$484);
              }();
            const ops$492 =
              $(
                O$491[4],
                $(
                  O$491[2],
                  $(
                    O$491[3],
                    $(
                      O$491[5],
                      $(
                        O$491[6],
                        $(
                          O$491[7],
                          $(
                            O$491[9],
                            $(
                              O$491[10],
                              $(
                                O$491[8],
                                $(
                                  O$491[12],
                                  $(
                                    O$491[13],
                                    $(
                                      O$491[14],
                                      $(
                                        O$491[15],
                                        $(
                                          O$491[16],
                                          $(
                                            O$491[17],
                                            $(
                                              O$491[21],
                                              $(
                                                O$491[22],
                                                $(
                                                  O$491[25],
                                                  $(
                                                    O$491[24],
                                                    $(
                                                      O$491[11],
                                                      $(
                                                        O$491[23],
                                                        $(
                                                          O$491[28],
                                                          $(
                                                            O$491[29],
                                                            $(
                                                              O$491[30],
                                                              $(
                                                                O$491[31],
                                                                $(
                                                                  O$491[32],
                                                                  $(
                                                                    O$491[33],
                                                                    $(
                                                                      O$491[34],
                                                                      $(
                                                                        O$491[35],
                                                                        $(
                                                                          O$491[36], $(
                                                                            O$491[40],
                                                                            $(O$491[37], $(
                                                                              O$491[38],
                                                                              0)))))))))))))))))))))))))))))))));
            const ops_sort$493 =
              _f(function (s$494) {
                return __(oc$List$[26], [
                  _f(function (f$495) {
                    return caml_equal(f$495[2], s$494);
                  }), ops$492
                ]);
              });
            const string_of_op$496 = _f(function (f$497) {
              return f$497[0];
            });
            const op_of_string$498 = _f(function (n$499) {
              return __(oc$List$[25], [n$499, ops$492]);
            });
            const args$500 = _f(function (f$501) {
              return f$501[1];
            });
            const result$502 = _f(function (f$503) {
              return f$503[2];
            });
            const name$504 = _f(function (f$505) {
              return f$505[0];
            });
            const func$506 = _f(function (f$507) {
              return f$507[3];
            });
            const reduce$508 =
              _f(function (fs$509) {
                const n$510 = _(oc$List$[0], [fs$509]);
                return __(
                  oc$Util$[15], [
                    _(oc$Util$[5], [
                      1 + (
                        n$510 / 5 >> 0
                      ), n$510
                    ]), fs$509
                  ]);
              });
            return $(op_scalar$83, op_pt$86, O$491, ops$492, ops_sort$493, string_of_op$496,
              op_of_string$498, args$500, result$502,
              name$504, func$506, reduce$508);
          }();
        const oc$Gene$ =
          function () {
            const op$82 = _f(function (l$83) {
              return l$83[0];
            });
            const connectors$84 = _f(function (l$85) {
              return l$85[1];
            });
            const link_x$86 = _f(function (x$87) {
              return $(_(oc$Op$[0], ['x', x$87]), 0);
            });
            const link_y$88 = _f(function (y$89) {
              return $(_(oc$Op$[0], ['y', y$89]), 0);
            });
            const link_t$90 = _f(function (t$91) {
              return $(_(oc$Op$[0], ['t', t$91]), 0);
            });
            const link_pt$92 = _f(function (x$93, y$94) {
              return $(_(oc$Op$[1], [x$93, y$94]), 0);
            });
            const get_sort$95 =
              _f(function (s$96, lst$97) {
                return __(oc$List$[26], [
                  _f(function (l$98) {
                    return caml_equal(_(oc$Op$[8], [l$98[0]]), s$96);
                  }), lst$97
                ]);
              });
            const connectible$99 =
              _f(function (f$100, gene$101) {
                return __(
                  oc$List$[19],
                  [
                    _f(function (s$102) {
                      return __(
                        oc$List$[20],
                        [
                          _f(function (param$227) {
                            return caml_equal(s$102, _(oc$Op$[8], [param$227[0]]));
                          }),
                          gene$101
                        ]);
                    }),
                    _(oc$Op$[7], [f$100])
                  ]);
              });
            const random_foci$104 =
              _f(function (n$105) {
                return __(
                  oc$Util$[11],
                  [
                    _f(function (param$226) {
                      const x$106 = _(oc$Util$[6], [-1.0, 1.0]);
                      const y$107 = _(oc$Util$[6], [-1.0, 1.0]);
                      return $(x$106, y$107);
                    }),
                    1,
                    n$105
                  ]);
              });
            const random_scalars$108 =
              _f(function (n$109) {
                return __(oc$Util$[11], [
                  _f(function (param$225) {
                    return __(oc$Util$[6], [-1.0, 1.0]);
                  }), 1, n$109
                ]);
              });
            const random_palette$110 =
              _f(function (n$111) {
                const p$112 = _(oc$Util$[11], [
                  _f(function (param$224) {
                    return __(oc$Util$[23], [0]);
                  }), 1, n$111
                ]);
                const k$113 = _(oc$Util$[5], [-15, 15]);
                // console.log(p$112, k$113);
                const h$114 = 0.1;
                return __(
                  oc$Util$[9],
                  [
                    _f(function (p$115) {
                      return __(
                        oc$List$[10],
                        [
                          _f(function (c$119) {
                            const match$223 = _(oc$Util$[25], [c$119, p$115]);
                            return $(
                              c$119[0] + h$114 * match$223[0],
                              c$119[1] + h$114 * match$223[1],
                              c$119[2] + h$114 * match$223[2]);
                          }),
                          p$115
                        ]);
                    }),
                    p$112,
                    k$113
                  ]);
              });
            const connect$123 =
              _f(function (f$124, lst$125) {
                return $(
                  f$124,
                  _(
                    oc$List$[10],
                    [
                      _f(function (s$126) {
                        return __(oc$Util$[12], [0.2, _(get_sort$95, [s$126, lst$125])]);
                      }),
                      _(oc$Op$[7], [f$124])
                    ]));
              });
            const random_gene$127 =
              _f(function (ops$128, seed$129, res$130, k$131) {
                const make$132 =
                  _f(function (j$133, lst$134, lst1$135) {
                    if (j$133 <= 1) {
                      {
                        const ops1$136 =
                          _(oc$List$[26], [
                            _f(function (f$137) {
                              return __(connectible$99, [f$137, lst1$135]);
                            }), ops$128
                          ]);
                        const fs$139 =
                          _(
                            oc$List$[26],
                            [
                              _f(function (f$138) {
                                return __(oc$List$[23], [_(oc$Op$[8], [f$138]), res$130]);
                              }), ops1$136
                            ]);
                        if (fs$139) {
                          return $(
                            _(connect$123, [_(oc$Util$[14], [fs$139]), lst1$135]), lst$134);
                        }
                        if (j$133 < -k$131 - 5) {
                          return __(
                            oc$Pervasives$[21],
                            [_(random_gene$127, [oc$Op$[3], lst1$135, res$130, j$133]), lst$134]);
                        }
                        const lnk$140 = _(connect$123, [_(oc$Util$[14], [ops1$136]), lst1$135]);
                        return __(make$132, [j$133 - 1, $(lnk$140, lst$134), $(lnk$140, lst1$135)]);
                      }
                    }
                    const f$141 = _(oc$Util$[14], [ops$128]);
                    if (_(connectible$99, [f$141, lst1$135])) {
                      {
                        const lnk$142 = _(connect$123, [f$141, lst1$135]);
                        return __(make$132, [j$133 - 1, $(lnk$142, lst$134), $(lnk$142, lst1$135)]);
                      }
                    }
                    const match$220 =
                      _(
                        oc$List$[13],
                        [
                          _f(function (param$217, param$218) {
                            const g$154 = _(
                              random_gene$127, [ops$128, lst1$135, $(param$217[0], 0), param$217[1]]);
                            if (g$154) {
                              return $(param$218[0] - _(oc$List$[0], [g$154]),
                                $(g$154[0], param$218[1]), _(oc$Pervasives$[21], [g$154, param$218[2]]),
                                _(oc$Pervasives$[21], [g$154, param$218[3]]));
                            }
                            throw $(Match_failure$16g, $('gene.ml', 101, 7));
                          }),
                          _(
                            oc$List$[36],
                            [
                              _(oc$Op$[7], [f$141]),
                              _(
                                oc$Util$[10],
                                [_(oc$Util$[5], [1, j$133 - 1]), _(oc$List$[0], [_(oc$Op$[7], [f$141])])])
                            ]),
                          $(j$133, 0, lst$134, lst1$135)
                        ]);
                    const c$155 = $(f$141, match$220[1]);
                    return __(make$132, [match$220[0], $(c$155, match$220[2]), $(c$155, match$220[3])]);
                  });
                return __(make$132, [k$131, 0, seed$129]);
              });
            const random_dna$156 =
              _f(function (ops$157, seed$158, res$159, k$160, n$161) {
                const reduce$162 =
                  _f(function (ts$163, param$215) {
                    if (param$215) {
                      {
                        const ls$165 = param$215[1];
                        const l$164 = param$215[0];
                        const t$166 = _(oc$Op$[8], [l$164[0]]);
                        if ((
                          t$166 !== 1 && t$166 !== 2 || _(oc$List$[23], [t$166, ts$163])
                        ) && _(oc$Util$[4], [0]) < 0.5)
                        {
                          return __(reduce$162, [ts$163, ls$165]);
                        }
                        return $(l$164, _(reduce$162, [$(t$166, ts$163), ls$165]));
                      }
                    }
                    return 0;
                  });
                if (n$161 <= 1) {
                  return __(random_gene$127, [ops$157, seed$158, res$159, k$160]);
                }
                const g1$168 = _(random_gene$127, [ops$157, seed$158, $(0, $(1, $(2, $(3, 0)))), k$160]);
                if (g1$168) {
                  {
                    const l1$167 = g1$168[0];
                    const g2$170 = _(random_gene$127, [ops$157, seed$158, $(0, $(1, $(2, $(3, 0)))), k$160]);
                    if (g2$170) {
                      {
                        const l2$169 = g2$170[0];
                        const s$171 =
                          $(
                            l1$167,
                            $(
                              l2$169, _(reduce$162, [
                                $(_(oc$Op$[8], [l1$167[0]]), $(_(oc$Op$[8], [l2$169[0]]), 0)), seed$158
                              ])));
                        return __(
                          oc$Pervasives$[21],
                          [
                            _(random_dna$156, [ops$157, s$171, res$159, k$160, n$161 - 2]),
                            _(oc$Pervasives$[21], [g1$168, g2$170])
                          ]);
                      }
                    }
                    throw $(Match_failure$16g, $('gene.ml', 128, 10));
                  }
                }
                throw $(Match_failure$16g, $('gene.ml', 127, 10));
              });
            const optimize$172 =
              _f(function (g$173) {
                const coll$174 =
                  _f(function (acc$176, param$212) {
                    if (param$212) {
                      {
                        const cs$178 = param$212[1];
                        const c$177 = param$212[0];
                        if (_(oc$List$[24], [c$177, acc$176])) {
                          return __(coll$174, [acc$176, cs$178]);
                        }
                        return __(coll$174, [_(collect$175, [acc$176, c$177]), cs$178]);
                      }
                    }
                    return acc$176;
                  });
                const collect$175 =
                  _f(function (acc$179, lnk$180) {
                    return __(coll$174, [_(oc$Util$[18], [lnk$180, acc$179]), _(connectors$84, [lnk$180])]);
                  });
                const used$181 = _(collect$175, [0, _(oc$List$[1], [g$173])]);
                return __(oc$List$[26], [
                  _f(function (l$182) {
                    return __(oc$List$[24], [l$182, used$181]);
                  }), g$173
                ]);
              });
            const string_of_gene$183 =
              _f(function (g$184) {
                const h$185 = _(oc$Util$[17], [g$184]);
                return __(
                  oc$String$[5],
                  [
                    '\n',
                    _(
                      oc$List$[10],
                      [
                        _f(function (param$211) {
                          const l$186 = param$211[0];
                          return __(
                            oc$Pervasives$[15],
                            [
                              _(oc$Pervasives$[19], [param$211[1]]),
                              _(
                                oc$Pervasives$[15],
                                [
                                  ':',
                                  _(
                                    oc$Pervasives$[15],
                                    [
                                      '[',
                                      _(
                                        oc$Pervasives$[15],
                                        [
                                          _(oc$Op$[5], [l$186[0]]),
                                          _(
                                            oc$Pervasives$[15],
                                            [
                                              ', (',
                                              _(
                                                oc$Pervasives$[15],
                                                [
                                                  _(
                                                    oc$String$[5],
                                                    [
                                                      ',',
                                                      _
                                                      (
                                                        oc$List$[10],
                                                        [
                                                          _f
                                                          (function
                                                            (c$188) {
                                                            return __
                                                            (
                                                              oc$Pervasives$[19],
                                                              [_(oc$List$[30], [c$188, h$185])]);
                                                          }),
                                                          l$186[1]
                                                        ])
                                                    ]),
                                                  ')]'
                                                ])
                                            ])
                                        ])
                                    ])
                                ])
                            ]);
                        }),
                        h$185
                      ])
                  ]);
              });
            return $(op$82, connectors$84, link_x$86, link_y$88, link_t$90, link_pt$92, get_sort$95,
              connectible$99, random_foci$104,
              random_scalars$108, random_palette$110, connect$123, random_gene$127, random_dna$156,
              optimize$172,
              string_of_gene$183);
          }();
        const oc$Compute$ =
          function () {
            const default_color$74 = _(oc$Util$[20], [0.0, 0.0, 0.0]);
            const default$75 =
              _f(function (param$145) {
                switch (param$145) {
                  case 0:
                    return $(false);
                  case 1:
                    return $1(0.7);
                  case 2:
                    return $2(0.2, 0.3);
                  case 3:
                    return $3(default_color$74);
                  default:
                    return null;
                }
              });
            const make_cell$76 =
              _f(function (cells$77, f$78, env$79) {
                return $($(_(default$75, [_(oc$Op$[8], [f$78])])), _(oc$Op$[10], [f$78, env$79, cells$77]));
              });
            const compile$80 =
              _f(function (rna$81, env$82) {
                const cmpl$83 =
                  _f(function (param$142) {
                    if (param$142) {
                      {
                        const l$84 = param$142[0];
                        const match$143 = _(cmpl$83, [param$142[1]]);
                        const asc$87 = match$143[1];
                        const c$88 =
                          _(
                            make_cell$76,
                            [
                              _(
                                oc$List$[10],
                                [
                                  _f(function (r$89) {
                                    return __(oc$List$[30], [r$89, asc$87]);
                                  }), _(oc$Gene$[1], [l$84])
                                ]),
                              _(oc$Gene$[0], [l$84]),
                              env$82
                            ]);
                        return $($(c$88, match$143[0]), $($(l$84, c$88), asc$87));
                      }
                    }
                    return $(0, 0);
                  });
                return _(cmpl$83, [rna$81])[0];
              });

            /*var random_picture$90a =
               _f(function (str$91) {
                  var match$141 = _(oc$Util$[8], [ str$91 ]);
                  var x$94 = $(0.0);
                  var y$95 = $(0.0);
                  var t$96 = $(-1.0);
                  _(oc$Util$[36], [ match$141[0] ]);
                  var scalars$97 = _(oc$Gene$[9], [ 10 ]);
                  var foci$98 = _(oc$Gene$[8], [ _(oc$Util$[5], [ 5, 20 ]) ]);
                  var palette$99 =
                    $(_(oc$Util$[20], [ -1.0, -1.0, -1.0 ]),
                      $(_(oc$Util$[20], [ 1.0, 0.0, 1.0 ]), _(oc$Gene$[10], [ _(oc$Util$[5], [ 2, 10 ]) ])));
                  var env$100 = $(foci$98, scalars$97, palette$99);
                  _(oc$Util$[36], [ match$141[1] ]);
                  var n$101 = _(oc$Util$[5], [ 120, 200 ]);
                  var ops$102 = _(oc$Op$[11], [ oc$Op$[3] ]);
                  var seed$103 = $(_(oc$Gene$[5], [ x$94, y$95 ]), $(_(oc$Gene$[4], [ t$96 ]), 0));
                  var g$104 =
                    _(oc$Gene$[14], [ _(oc$Pervasives$[21], [ _(oc$Gene$[12], [ ops$102, seed$103, $(3, 0), n$101 ]), seed$103 ]) ]);
                  var dna$105 = _(compile$80, [ g$104, env$100 ]);
                  return _f(function (t$27$106, x$27$107, y$27$108) {
                     x$94[0] = x$27$107;
                     y$95[0] = y$27$108;
                     t$96[0] = t$27$106;
                     return dna$105;
                  });
               });*/

              /*
              Original algorithm with some logging tweaks
               */
            const random_picture$90 =
              _f(function (str$91) {
                const match$141 = _(oc$Util$[8], [str$91]);
                console.log(match$141[0], match$141[1]);
                const x$94 = $(0.0);
                const y$95 = $(0.0);
                const t$96 = $(-1.0);
                _(oc$Util$[36], [match$141[0]]);
                const scalars$97 = _(oc$Gene$[9], [10]);
                const foci$98 = _(oc$Gene$[8], [_(oc$Util$[5], [5, 20])]);
                const palette$99 =
                  $(
                    _(oc$Util$[20], [-1.0, -1.0, -1.0]),
                    $(_(oc$Util$[20], [1.0, 0.0, 1.0]), _(oc$Gene$[10], [_(oc$Util$[5], [2, 10])])));
                const env$100 = $(foci$98, scalars$97, palette$99);
                /*
                console.log('Foci:', util.inspect(foci$98, 20, 20, 20));
                console.log('Scalars:', util.inspect(scalars$97, 20, 20, 20));
                console.log('Palette:', util.inspect(palette$99, 20, 20, 20));
                */
                _(oc$Util$[36], [match$141[1]]);
                const n$101 = _(oc$Util$[5], [120, 200]);
                const ops$102 = _(oc$Op$[11], [oc$Op$[3]]);
                const seed$103 = $(_(oc$Gene$[5], [x$94, y$95]), $(_(oc$Gene$[4], [t$96]), 0));
                const g$104 =
                  _(
                    oc$Gene$[14], [
                      _(
                        oc$Pervasives$[21],
                        [_(oc$Gene$[12], [ops$102, seed$103, $(3, 0), n$101]), seed$103])
                    ]);
                const dna$105 = _(compile$80, [g$104, env$100]);
                return _f(function (t$27$106, x$27$107, y$27$108) {
                  x$94[0] = x$27$107;
                  y$95[0] = y$27$108;
                  t$96[0] = t$27$106;
                  return dna$105;
                });
              });

              /*
              Original algorithm with alternate inputs
               */
            const random_picture$2 =
              _f(function (na$91, na$92) {
                const r$122 = new oc$$ms(na$92);
                const r$132 = new oc$$ms(na$91);
                const match$141 = [r$122, r$132];
                // const match$141 = _(oc$Util$[8], [str$91]);
                 console.log('Orig Given Prefix:', na$91, match$141[0]);
                 console.log('Orig Family Suffix:', na$92, match$141[1]);
                const x$94 = $(0.0);
                const y$95 = $(0.0);
                const t$96 = $(-1.0);
                _(oc$Util$[36], [match$141[0]]);
                const scalars$97 = _(oc$Gene$[9], [10]);
                const foci$98 = _(oc$Gene$[8], [_(oc$Util$[5], [5, 20])]);
                const palette$99 = $(
                  _(oc$Util$[20], [-1.0, -1.0, -1.0]),
                  $(_(oc$Util$[20], [1.0, 0.0, 1.0]), _(oc$Gene$[10], [_(oc$Util$[5], [2, 10])])));
                const env$100 = $(foci$98, scalars$97, palette$99);
                /*
                console.log('Orig Foci (5-20):', util.inspect(foci$98, 25, 25, 25));
                console.log('Orig Scalars:', util.inspect(scalars$97, 10, 10, 10));
                console.log('Orig Palette (-1,-1,-1; 1,0,1; 2-10):', util.inspect(palette$99, 10, 10, 10));
                */
                _(oc$Util$[36], [match$141[1]]);
                const n$101 = _(oc$Util$[5], [120, 200]);
                const ops$102 = _(oc$Op$[11], [oc$Op$[3]]);
                const seed$103 = $(_(oc$Gene$[5], [x$94, y$95]), $(_(oc$Gene$[4], [t$96]), 0));
                const g$104 = _(
                  oc$Gene$[14], [
                    _(oc$Pervasives$[21], [_(oc$Gene$[12], [ops$102, seed$103, $(3, 0), n$101]), seed$103])
                  ]);
                const dna$105 = _(compile$80, [g$104, env$100]);
                /*
                console.log('Orig N (120-200):', n$101);
                console.log('Orig Ops:', util.inspect(ops$102, 180, 180, 180));
                */
                // console.log('Seed:', util.inspect(seed$103, 200, 200, 200));
                // console.log('G:', util.inspect(g$104, 200, 200, 200));
                // console.log('DNA:', util.inspect(dna$105, 200, 200, 200));
                return _f(function (t$27$106, x$27$107, y$27$108) {
                  x$94[0] = x$27$107;
                  y$95[0] = y$27$108;
                  t$96[0] = t$27$106;
                  return dna$105;
                });
              });

            /*
            Original algorithm, tuned settings, alt input
             */
            const random_picture$3 =
              _f(function (na$91, na$92) {
                const r$122 = new oc$$ms(na$92);
                const r$132 = new oc$$ms(na$91);
                const match$141 = [r$122, r$132];
                // const match$141 = _(oc$Util$[8], [str$91]);
                console.log('Novel Given Prefix:', na$92, match$141[0]);
                console.log('Novel Family Suffix:', na$91, match$141[1]);
                const x$94 = $(0.0);
                const y$95 = $(0.0);
                const t$96 = $(-1.0);
                _(oc$Util$[36], [match$141[0]]);
                const scalars$97 = _(oc$Gene$[9], [12]);
                const foci$98 = _(oc$Gene$[8], [_(oc$Util$[5], [4, 25])]);
                const palette$99 = $(
                  _(oc$Util$[20], [-1.0, 0, -1.0]),
                  $(_(oc$Util$[20], [1.0, 1.0, 1.0]), _(oc$Gene$[10], [_(oc$Util$[5], [3, 12])])));
                const env$100 = $(foci$98, scalars$97, palette$99);
                /*
                console.log('Novel Foci (4-25):', util.inspect(foci$98, 25, 25, 25));
                console.log('Novel Scalars (12):', util.inspect(scalars$97, 12, 12, 12));
                console.log('Novel Palette (-1,0,-1; 1,1,1; 3-12):', util.inspect(palette$99, 10, 10, 10));
                */
                _(oc$Util$[36], [match$141[1]]);
                const n$101 = _(oc$Util$[5], [110, 185]);
                const ops$102 = _(oc$Op$[11], [oc$Op$[3]]);
                const seed$103 = $(_(oc$Gene$[5], [x$94, y$95]), $(_(oc$Gene$[4], [t$96]), 0));
                const g$104 = _(
                  oc$Gene$[14], [
                    _(oc$Pervasives$[21], [_(oc$Gene$[12], [ops$102, seed$103, $(3, 0), n$101]), seed$103])
                  ]);
                const dna$105 = _(compile$80, [g$104, env$100]);
                /*
                console.log('Novel N (110-185):', n$101);
                console.log('Novel Ops:', util.inspect(ops$102, 180, 180, 180));
                */
                // console.log('Seed:', util.inspect(seed$103, 200, 200, 200));
                // console.log('G:', util.inspect(g$104, 200, 200, 200));
                // console.log('DNA:', util.inspect(dna$105, 200, 200, 200));
                return _f(function (t$27$106, x$27$107, y$27$108) {
                  x$94[0] = x$27$107;
                  y$95[0] = y$27$108;
                  t$96[0] = t$27$106;
                  return dna$105;
                });
              });

            const run$109 =
              _f(function (param$139) {
                if (param$139) {
                  {
                    const c$110 = param$139[0];
                    _(run$109, [param$139[1]]);
                    return c$110[0][0] = _(c$110[1], [0]);
                  }
                }
                return 0;
              });
            const eval$112 =
              _f(function (rna$113, t$114, x$115, y$116) {
                const prog$117 = _(rna$113, [t$114, x$115, y$116]);
                const match$138 = (
                  _(run$109, [prog$117]), _(oc$Types$[0], [_(oc$List$[1], [prog$117])])
                );
                switch ($t(match$138)) {
                  case 3:
                    return __(oc$Util$[21], [match$138[0]]);
                  default:
                    return __(oc$Pervasives$[1], ['The result is not a color']);
                }
              });
            const compute_line$119 =
              _f(function (rna$120, res$121, t$122, j$123, line$124) {
                const d$125 = 2.0 / res$121;
                for (let i$126 = 0; i$126 <= res$121 - 1; i$126++) {
                  (
                    function (i$126) {
                      const prog$127 = _(
                        rna$120, [
                          t$122, d$125 * (
                            0.5 + i$126
                          ) - 1.0, d$125 * (
                            0.5 + j$123
                          ) - 1.0
                        ]);
                      const match$137 = (
                        _(run$109, [prog$127]), _(oc$Types$[0], [_(oc$List$[1], [prog$127])])
                      );
                      switch ($t(match$137)) {
                        case 3:
                          oc$$asets(line$124, i$126, match$137[0]);
                          break;
                        default:
                          _(oc$Pervasives$[1], ['The result is not a color']);
                      }
                    }(i$126)
                  );
                }
              });

            return $(
              default_color$74, default$75, make_cell$76, compile$80, random_picture$90, run$109, eval$112,
              compute_line$119, random_picture$2, random_picture$3);
          }();
        const oc$Genjs$ =
          (
            ocaml_register(
              'word_to_seed',
              _(_f(function (callable, param) {
                return caml_callback(callable, param);
              }), [oc$Util$[8]])), (
              ocaml_register(
                'new_picture',
                _(_f(function (callable, array$1, array$2) {
                  return caml_callback2(callable, array$1, array$2);
                }), [oc$Compute$[8]])), (
                ocaml_register(
                  'new_new_picture',
                  _(_f(function (prim$72, array$71, array$70) {
                    return caml_callback2(prim$72, array$71, array$70);
                  }), [oc$Compute$[9]])), (
                  ocaml_register(
                    'old_picture',
                    _(_f(function (prim$72, param) {
                      return caml_callback(prim$72, param);
                    }), [oc$Compute$[4]])), (
                    ocaml_register(
                      'full_eval',
                      _(_f(function (prim$0, model$1, zero$2, x$3, y$4) {
                        return caml_callback4(prim$0, model$1, zero$2, x$3, y$4);
                      }), [oc$Compute$[6]])), (
                    ocaml_register(
                      'partial_eval',
                      _(_f(function (prim$0, model$1) {
                        return caml_callback2(prim$0, model$1, 0);
                      }), [oc$Compute$[6]])), (
                      ocaml_register(
                        'compute_pixel',
                        _(
                          _f(function (prim$69, prim$68, prim$67, prim$66) {
                            return caml_callback3(prim$69, prim$68, prim$67, prim$66);
                          }),
                          [
                            _f(function (rna$59, x$60, y$61) {
                              const match$70 = _(oc$Compute$[6], [rna$59, 0.0, x$60, y$61]);
                              console.log(match$70);
                              return __(
                                oc$Pervasives$[15],
                                [
                                  'rgb(',
                                  _(
                                    oc$Pervasives$[15],
                                    [
                                      _(oc$Pervasives$[19], [match$70[0]]),
                                      _(
                                        oc$Pervasives$[15],
                                        [
                                          ',',
                                          _(
                                            oc$Pervasives$[15],
                                            [
                                              _(oc$Pervasives$[19], [match$70[1]]),
                                              _(
                                                oc$Pervasives$[15],
                                                [
                                                  ',',
                                                  _(
                                                    oc$Pervasives$[15],
                                                    [_(oc$Pervasives$[19], [match$70[2]]), ')'])
                                                ])
                                            ])
                                        ])
                                    ])
                                ]);
                            })
                          ])), $()
                    )
                  )
                )
              )
            )
            )
          );
        const oc$Std_exit$ = (
          _(oc$Pervasives$[80], [0]), $()
        );

        console.log(oc$Genjs$);
        console.log(oc$Std_exit$);
        return caml_named_value;
      }
    )();
  }
)(module.exports);
