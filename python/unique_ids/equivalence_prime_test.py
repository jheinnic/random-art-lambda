from networkx.algorithms.minors import equivalence_classes
from itertools import chain

def _mk_rel(g, p):
    def rel(aa, bb):
        a1, a2 = aa
        b1, b2 = bb
        return (a1 == b2) or (a2 == b1)
    return rel


def _mk_pack(g, p):
    def pack(run):
        # reverse_map = {
        #    ((ii[0] * g) % p) if (len(ii) == 1) else ((ii[1] * g) % p): ii[0] for ii in {*chain(run)}
        # }
        local_map = {
            # ii[0]: ((ii[0] * g) % p) if (len(ii) == 1) else ((ii[1] * g) % p) for ii in {*chain(run)}
            # ii[0]: ((ii[1] * g) % p) for ii in {*chain(run)}
            ii[0]: ii[1] for ii in {*chain(run)}
        }
        inputs = set(local_map.keys())
        outputs = set(local_map.values())
        heads = [*inputs.difference(outputs)]
        tails = [*outputs.difference(inputs)]
        # print("Source: " + str(heads) + " and " + str(tails) + " for " + str(run) + " from " + str(inputs) + " to " + str(outputs) + " through " + str(local_map))
        if len(heads) != len(tails):
            print("Hydra! " + str(heads), str(tails), str(run))
        # else:
        #    print("Ok? " + str(heads) + " to " + str(tails) + " through " + str(local_map))
        retval = [_follow(head, local_map) for head in heads]
        # print(str(run) + " ...to... " + str(retval))
        return retval
    return pack

def _follow(head, local_map):
    step = head
    while True:
        tail = local_map[step]
        if tail in local_map:
            step = tail
        else:
            break
    return (head, tail)

def test_g_for_p(g, p):
    rel = _mk_rel(g, p)
    pack = _mk_pack(g, p)
    runs = {(ii,(ii*g) % p) for ii in range(2, p)}
    print("0: " + str(runs))
    next_len = len(runs)
    last_len = next_len + 1
    counter = 0
    while next_len > 1 and next_len < last_len:
        classes = [*equivalence_classes(runs, rel)]
        print(str(runs) + " to " + str(classes))
        classes = [pack(run) for run in equivalence_classes(runs, rel)]
        if len([empty_run for empty_run in classes if len(empty_run) == 0]) > 0:
            print("Found a collapse cycle not inclusive of 1!  Not a generator!")
            return False
        runs = [*chain(*[pack(run) for run in equivalence_classes(runs, rel)])]
        runs.sort()
        last_len = next_len
        next_len = len(runs)
        counter = counter + 1
        print(str(counter) + ": " + str(last_len) + " to " + str(next_len) + ", " + str(runs))
    return True

