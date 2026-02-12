import itertools 
import secrets
import random
import math

def find_g_for_p(p, e=1):
    if p <= 2:
        raise "Prime must be 3 or greater"
    pm1 = (p - 1) * pow(p, e-1)
    pe = pow(p, e)
    retval = []
    for ii in range(pe - 1, 0, -1):
        x = 1
        g = ii
        v = set()
        while x not in v:
            v.add(x)
            # print(f" ** {x}")
            x = (x * g) % pe
        b = len(v)
        # print(f"{ii} -> {b}")
        if b == pm1:
            retval.append(ii)
    return retval

# This optimization is heuristic.   The rule about generators being gcd(g, n) for all n
# in a factorization applies to the factors of (p-1).   Applying the test to the generators
# of p generates a lot of good guesses, but its neither complete more accurate...
def find_g_for_p_e(p, e=1):
    if p <= 2:
        raise "Prime must be 3 or greater"
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
    candidates = []
    pe = pow(p, e)
    pem1 = pe - 1
    pm1pem1 = pow(p, e - 1) * (p - 1)
    for ii in range(pem1, p + 1, -1):
        is_candidate = True
        for jj in retval:
            gcd = math.gcd(ii, jj)
            if gcd != 1:
                # print(f"{ii} -> gcd({ii}, {jj}) = {gcd}")
                is_candidate = False
                break
        if is_candidate:
            # print(f"{ii} -> all GCD = 1")
            candidates.append(ii)
    for ii in candidates:
        x = 1
        g = ii
        v = set()
        while x not in v:
            v.add(x)
            # print(f" ** {x}")
            x = (x * g) % pe
        b = len(v)
        # print(f"{ii} -> {b}")
        if b == pm1pem1:
            retval.append(ii)
    return retval

 
def wind_g_for_p_to_e(g, p, e, x2=False):
    """
    Use this when you are certain that g is a generator for p and thereof of p^e, excluding multiples of p.
    In order to be efficient, this sequence generator does not actively detect cycles.  It calculates the expected
    field order assuming that two things hold true: 

    1) p is definitely a prime
    2) g is definitely a generator for p^1

    If either condition is not true, there will be cycles in the resulting sequence before it runs out.

    Call test_g_for_p() for a cycle-detecting routine that validates (2).  Primality is left up to the caller to verify.
    """
    if p <= 2:
        raise "Prime must be 3 or greater"
    order = pow(p, e -1) * (p - 1) if e > 1 else p - 1
    p_to_e = pow(p, e) * (2 if x2 else 1)
    x = g
    yield 1
    yield g
    for ii in range(2, order):
        x = (x * g) % p_to_e
        yield x
 

def _test_g_for_p_test_primality(g, p, e=1):
    v = set()
    for x in wind_g_for_p_to_e(g, p, e):
        if x in v:
            print(f"Early cycle detected after {len(v)} iterations, halting on {x}")

            if x != 1:
                print(f"{p} must not be prime!")
            return (False, v)
        v.add(x)
        if len(v) % p == 0:
            print(f"Still good as of {x}")
    return (True, v)


def _test_g_for_p_trust_primality(g, p, e=1):
    z = p
    n = p
    for x in wind_g_for_p_to_e(g, p, e):
        if x <= z:
            if z == p:
                if x != 1:
                    raise "All sequences must start with 1!!"
                z = 1
            else:
                return (False,)
        n = n - 1
        if n == 0:
            print(f"Still good at {x}")
            n = p
    return (True, set({ii for ii in range(1, pow(p, e)) if (ii % p) != 0}))


def test_g_for_p(g, p, trust_prime=False):
    if p <= 2:
        raise "Prime must be 3 or greater"
    return _test_g_for_p_trust_primality(g, p) if trust_prime else _test_g_for_p_test_primality(g, p)


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
    If p is prime, GF(p^2) will return (p)*(p-1) values, accounting for all ordered pairs without replacement from GF(p^2)
    If p is a prime power of q (q is prime), q^n, then there will be (q^(2n-1)) * (q-1) values returned without replacement from p values.
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

def is_miller_rabin_passed(n):
    """
    Miller-Rabin primality test.
    Returns True if n is probably prime, False if it's composite.
    """
    # Simple checks
    if n < 2: return False
    if n == 2 or n == 3: return True
    if n % 2 == 0: return False

    # Write n-1 as 2^r * d
    r, d = 0, n - 1
    while d % 2 == 0:
        r += 1
        d //= 2

    # Perform 40 rounds of Miller-Rabin
    for _ in range(40):
        a = random.randrange(2, n - 1)
        x = pow(a, d, n)  # Fast modular exponentiation (a^d % n)
        if x == 1 or x == n - 1:
            continue
        for _ in range(r - 1):
            x = pow(x, 2, n)
            if x == n - 1:
                break
        else:
            return False
    return True

def generate_large_prime(nbits=1024):
    """
    Generates a large prime number of approximately nbits.
    """
    while True:
        # Generate a random odd number
        p = secrets.randbits(nbits)
        p |= (1 << nbits - 1) | 1  # Ensure the high bit and low bit are set

        if is_miller_rabin_passed(p):
            return p

