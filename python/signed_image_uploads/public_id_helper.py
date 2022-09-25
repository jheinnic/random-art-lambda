
import re
import math
import random
from enum import Enum
from typing import Tuple
from base64 import b32decode, b32encode
from uuid import getnode, uuid1, UUID

MAX_CLOCK_SEQ = math.pow(2, 14) - 1
MAX_CHUNK_RESERVE = 1536
CLOCK_SEQ_ROTATE = MAX_CLOCK_SEQ - MAX_CHUNK_RESERVE
B32_ENCODING_SUFFIX = '======'


def W(sep_char, count_seq):
    return sep_char.join([
        f'([A-Z0-9]{{{n}}})' for n in count_seq
    ])


def Wn(sep_char, count_seq):
    return sep_char.join([
        f'([A-Z0-9]{{{n}}})([0123])' for n in count_seq
    ])


DIR_SPLIT_PATTERN = re.compile(W('', [2, 2, 2, 2]))
PARSE_PATH_PATTERN = re.compile(
    '/'.join((
        Wn('/', [2, 2, 2, 2]),
        W('/', [8, 8]),
    ))
)
PARSE_URL_PATTERN = re.compile(
    '-'.join((
        Wn('', [2, 2]),
        Wn('', [2, 2]),
        W('-', [8, 8]),
    ))
)

PARSE_TEST_DIR = re.compile(
    W('', [4, 2, 2, 4, 6, 6])
)
PARSE_TEST_URL = re.compile(
    W('', [6, 6, 6, 6])
)
        
    
class IdFormat(Enum):
    PATH = 0;
    URL_TOKEN = 1;
    UUID = 2;


class PublicIdHelper():
    def __init__(self, node_id: int = getnode()):
        self._node_id = node_id & 0xffffffffffff
        self._clock_seq = round(random.uniform(0, CLOCK_SEQ_ROTATE))
        self._time_hi_water = uuid1().time

    def get_new_id(self, is_series: bool = False, *, fmt: IdFormat = IdFormat.PATH) -> str:
        if is_series:
            latest_uuid = uuid1(node=self._node_id, clock_seq=0)
        else:
            latest_uuid = uuid1(node=self._node_id)
        return self._uuid_to_public_id(latest_uuid, fmt)

    def get_next_id(self, latest_public_id: str, *, fmt: IdFormat = IdFormat.PATH) -> str:
        latest_uuid: UUID = self._public_id_to_uuid(latest_public_id, fmt)
        if latest_uuid.node != self._node_id:
            raise RuntimeError(
                f"Public ID given is from node id {latest_uuid.node}, service is authoritative for {self._node_id}")
        latest_fields = latest_uuid.fields
        if latest_uuid.clock_seq >= 0xfff:
            raise RuntimeError(
                f"May only allocate 4096 consecutive ID's from a single public ID series: {latest_uuid}")
        elif latest_fields[4] < 255:
            latest_fields: Tuple[int, int, int, int, int, int] = \
                (*latest_fields[0:4], latest_fields[4] + 1, latest_fields[5])
        else:
            latest_fields: Tuple[int, int, int, int, int, int] = \
                (*latest_fields[0:3], latest_fields[3] + 1, 0, latest_fields[5])
        latest_uuid = UUID(fields=latest_fields)
        return self._uuid_to_public_id(latest_uuid, fmt)

    def url_token_to_path(self, public_id: str) -> str:
        return self._uuid_to_public_id(
            self._public_id_to_uuid(public_id, IdFormat.URL_TOKEN),
            IdFormat.PATH
        )

    def path_to_url_token(self, public_id: str) -> str:
        return self._uuid_to_public_id(
            self._public_id_to_uuid(public_id, IdFormat.PATH),
            IdFormat.URL_TOKEN
        )

    @classmethod
    def _uuid_to_public_id(cls, src_uuid: UUID, fmt: IdFormat) -> str:
        all_bits = src_uuid.int
        time_hi  = ((all_bits >> 64) & 0x0fff) << 48
        time_mid = ((all_bits >> 80) & 0xffff) << 32
        time_part = time_hi + time_mid + (all_bits >> 96)
        node_part = all_bits & 0xffffffffffff
        clock = (all_bits >> 48) & 0x3ff
        nib = str((all_bits >> 60) & 0x3)
        base_bytes = (
            (time_part << 60) + (node_part << 12) + clock
        ).to_bytes(15, 'big')
        b32_str = b32encode(base_bytes).decode('utf8')
        if fmt == IdFormat.PATH:
            dirs = PARSE_TEST_DIR.fullmatch(b32_str).groups()
            public_id = '/'.join((*dirs[0:5], dirs[5] + nib))
        elif fmt == IdFormat.URL_TOKEN:
            dirs = PARSE_TEST_URL.fullmatch(b32_str).groups()
            public_id = '-'.join((dirs[0], dirs[1], dirs[2], dirs[3] + nib))
        else:
            raise RuntimeError(f'{format} is not a recognized Id token format')
        return public_id

    @classmethod
    def _public_id_to_uuid(cls, src_public_id: str, fmt: IdFormat) -> UUID:
        if fmt == IdFormat.PATH:
            tokens = PARSE_PATH_PATTERN.fullmatch(src_public_id)
        elif fmt == IdFormat.URL_TOKEN:
            tokens = PARSE_URL_PATTERN.fullmatch(src_public_id)
        else:
            raise RuntimeError(f'{fmt} is not a recognized Id token format')
        if not tokens:
            raise ValueError(f'{src_public_id} is not a validly formatted id path')
        tokens = tokens.groups()
        dirs = [tokens[x] for x in (6, 4, 2, 0)]
        pad_byte = sum([int(tokens[x]) << (x-1) for x in (7, 5, 3, 1)]).to_bytes(1, 'little')
        words = [b32decode(x.encode()) for x in (''.join(dirs), tokens[9], tokens[8])]
        tokens = [words[0], pad_byte, words[1], words[2]]
        bytes_uuid = b''.join(tokens)
        return UUID(bytes_le=bytes_uuid)

