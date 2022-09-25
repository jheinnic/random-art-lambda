import itertools 
import math

def find_g_for_p(p):
     m = 0
     w = 0
     pm1 = p - 1
     retval = []
     for ii in range(pm1, 0, -1):
         x = 1
         g = ii
         v = set()
         while x not in v:
             v.add(x)
             # print(f" ** {x}")
             x = (x * g) % p
         b = len(v)
         # print(f"{ii} -> {b}")
         if b == pm1:
             retval.append(ii)
     return retval

 
def wind_g_for_p_to_e(g, p, e):
    """
    Use this when you are certain that g is a generator for p and thereof of p^e, excluding multiples of p.
    In order to be efficient, this sequence generator does not actively detect cycles.  It calculates the expected
    field order assuming that two things hold true: 

    1) p is definitely a prime
    2) g is definitely a generator for p^1

    If either condition is not true, there will be cycles in the resulting sequence before it runs out.

    Call test_g_for_p() for a cycle-detecting routine that validates (2).  Primality is left up to the caller to verify.
    """
    end = p - 1
    for ii in range(1, e):
        end = end * p
    x = 1
    p_to_e = pow(p, e)
    for ii in range(1, end + 1):
        yield x
        x = (x * g) % p_to_e
        # if (ii % 5000) == 4999:
        #     print(f"So far, len(v) = {ii}\n")
 

def test_g_for_p(g, p):
    v = set()
    for x in wind_g_for_p_to_e(g, p, 1):
        print(x)
        if x in v:
            print(f"Early cycle detected after {len(v)} iterations, halting on {x}")

            if x != 1:
                print(f"{p} must not be prime!")
            return (False, v)
        v.add(x)
    return (True, v)


def pick_a_prime(target):
    with open("primes.dat", "r") as fd:
        primes = fd.read().split("\n")
    candiK = iter(range(100, 0, -1))
    kObj = { 'k': next(candiK), 'candiK': candiK }
    hits = [*itertools.chain(*(optimizeK(kObj, int(prime), target) for prime in primes[100:-1]))]
    return hits


def optimizeK(kObj, prime, target):
    (k, candiK) = (kObj[i] for i in ('k', 'candiK'))
    current = pow(prime, k)
    current2 = current * 2
    print([k, prime, target, current, current2])
    while current > target:
        print([k, target, current, current2])
        k = next(candiK)
        current = current / prime
        current2 = current2 / prime
    k2 = k
    while current2 > target:
        print([k2, target, current2])
        k2 = k2 - 1
        current2 = current2 / prime
    kObj['k'] = k
    print([k, target-current, k2, target-current2])
    return [[prime, k, 1, target-current], [prime, k2, 2, target-current2]]


def mul_mod(a, b, m):
   if (not ((a | b) & (0xFFFFFFFF << 32))):
       return a * b % m
   i = 0
   d = 0
   mp2 = m >> 1
   if (a >= m): a %= m
   if (b >= m): b %= m
   while i < 64:
       if (d > mp2):
           d = (d << 1) - m
       else:
           d = d << 1
       if (a & 0x8000000000000000):
           d += b
       if (d >= m):
           d -= m
       a <<= 1
       i = i + 1
   return d


def order_pairs(g, p):
    """
    If p is n, there will be (p)*(p-1) values returned, accounting for all ordered pairs without replacement from p values.
    If p is a prime power, p^n, then there will be (p^n) * ((p^n) - (p^(n-1))) values returned without replacement from p values.
    -- There will be more gaps than just the self-paired diagonal when n > 1 because the underlying sequence must skip every
       multiple the base prime.
    """
    p2 = p * p
    pm1 = p - 1
    yield([0, 1])
    i = g
    while i != 1:
        # i_norm = i - (math.floor(i / p))
        x = math.floor(i / p)
        y = i - (x * p)
        if y <= x:
            y = y - 1
        yield([x, y])
        i = (i * g) % p2


def dense_wind_g_for_p_to_e(g, p, e):
    outer = [p]
    inner = [p-1]
    for index in range(0, e - 1):
        outer.append(outer[index] * p)
        inner.append(inner[index] * p)
    for x in wind_g_for_p_to_e(g, p, e):
        i = e - 1
        adj_x = 0
        remainder = 0
        while i >= 0:
            remainder = x % outer[i]
            adj_x = adj_x + (((x - remainder) / outer[i]) * inner[i])
            x = remainder
            i = i - 1
        yield int(adj_x + remainder)

