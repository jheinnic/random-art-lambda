import secrets
import math

class PrimeFieldGenerator:
    def __init__(self, bit_length=32):
        self.bit_length = bit_length
        self.p = self._generate_large_prime()
        print("Using prime = ", self.p)
        self.factors_of_p_minus_1 = self._factorize_p_minus_1()
        print("Factors to = ", self.factors_of_p_minus_1)
        self.generator = self._find_primitive_root()
        print("Generator = ", self.generator)

    def _is_miller_rabin_passed(self, n, k=40):
        if n < 2: return False
        if n == 2 or n == 3: return True
        if n % 2 == 0: return False

        r, d = 0, n - 1
        while d % 2 == 0:
            r += 1
            d //= 2

        for _ in range(k):
            a = secrets.randbelow(n - 4) + 2
            x = pow(a, d, n)
            if x == 1 or x == n - 1:
                continue
            for _ in range(r - 1):
                x = pow(x, 2, n)
                if x == n - 1:
                    break
            else:
                return False
        return True

    def _generate_large_prime(self):
        """Generates a random prime of the specified bit length."""
        while True:
            p = secrets.randbits(self.bit_length)
            p |= (1 << (self.bit_length - 1)) | 1
            if self._is_miller_rabin_passed(p):
                return p

    def _prime_gen(self):
        """Infinite generator using a dictionary-based sieve."""
        yield 2
        D = {}
        q = 3
        while True:
            if q not in D:
                yield q
                D[q * q] = 2 * q
            else:
                p = D.pop(q)
                x = q + p
                while x in D: x += p
                D[x] = p
            q += 2

    def _factorize_p_minus_1(self):
        """Factors p-1 using the shrinking-bound sieve generator."""
        n = self.p - 1
        factors = set()
        limit = math.isqrt(n)
        difficulty_limit = 10000000
        multi_difficult = difficulty_limit * 2
        hard_difficult = difficulty_limit * 10
        mr_shortcut = False
        
        for p in self._prime_gen():
            if p > limit:
                break
            if n % p == 0:
                factors.add(p)
                while n % p == 0:
                    n //= p
                limit = math.isqrt(n)
                print("Found factor: ", p)
                print("-- Remaining term: ", n)
                print("-- New limit: ", limit)
                print("")
                if limit > difficulty_limit:
                    if self._is_miller_rabin_passed(n):
                        print("** Miller-rabin passed with limit > ", difficulty_limit)
                        mr_shortcut = True
                        break
                    else:
                        print("** Miller-rabin failed with limit > ", difficulty_limit)
            elif p > hard_difficult:
                print("** Error: P has reached ", p)
                print("!! Resorting to an approximate generator!")
                multi_difficult = multi_difficult + difficulty_limit
                break
            elif p > multi_difficult:
                print("** Warning: P has reached ", p)
                multi_difficult = multi_difficult + difficulty_limit
        
        if p < limit and n > p:
            print("** Continue search without a seive...")
            while p < limit:
                p = p + 2
                if n % p == 0:
                    factors.add(p)
                    n //= p
                    while n % p == 0:
                        n //= p
                    limit = math.isqrt(n)
                    print("Found factor: ", p)
                    print("-- Remaining term: ", n)
                    print("-- New limit: ", limit)
                    print("")
                    if self._is_miller_rabin_passed(n):
                        print("** Miller-rabin passed with limit > ", difficulty_limit)
                        mr_shortcut = True
                        break
                    else:
                        print("** Miller-rabin failed with limit > ", difficulty_limit)
                elif p > multi_difficult:
                    print("** Warning: P has reached ", p)
                    multi_difficult = multi_difficult + difficulty_limit

        if p > limit and n > 1:
            factors.add(n)
        else:
            print("Search over with p = ", p, "; limit = ", limit, "; n = ", n)
        return factors

    def _find_primitive_root(self):
        """Searches for a generator using the p-1 factor test."""
        phi = self.p - 1
        # In a large prime field, ~30-50% of numbers are generators.
        # We'll find one quickly.
        while True:
            g = secrets.randbelow(self.p - 3) + 2
            # Check if g^(phi/q) != 1 for all factors q
            if all(pow(g, phi // q, self.p) != 1 for q in self.factors_of_p_minus_1):
                return g
            else:
                print("Not a generator: ", g)

# --- Usage ---
field = PrimeFieldGenerator(bit_length=40) # 40-bit for speed, can go higher
print(f"Prime (p): {field.p}")
print(f"Factors of p-1: {field.factors_of_p_minus_1}")
print(f"Generator (g): {field.generator}")

# Generate a non-sequential sequence
print("\nFirst 5 values of the sequence (g^i mod p):")
for i in range(1, 6):
    print(f"Index {i}: {pow(field.generator, i, field.p)}")
