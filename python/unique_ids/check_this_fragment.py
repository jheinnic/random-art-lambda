def _uuid_to_public_id(src_uuid: uuid, fmt: IdFormat) -> str:
    all_bits = src_uuid.int
    time_hi  = ((all_bits >> 64) & 0x0fff) << 48
    time_mid = ((all_bits >> 80) & 0xffff) << 32
    time_part = time_hi + time_mid + (all_bits >> 96)
    node_part = all_bits & 0xffffffffffff
    clock = (all_bits >> 48) & 0x3ff
    nib = (all_bits >> 60) & 0x3
    base_bytes = ((time_part << 60) + (node_part << 12) + clock).to_bytes(15, 'big')
    b32_str = b32encode(base_bytes).decode('utf8')
    return b32_str

def _finish_it(b32_str: str) -> str:
    if fmt == IdFormat.PATH:
        dirs = PARSE_TEST_DIR.fullmatch(b32_str).groups()
        dirs[0] = str(nib) + dirs[0]
        public_id = '/'.join(dirs)
    elif fmt == IdFormat.URL_TOKEN:
        dirs = PARSE_TEST_URL.fullmatch(b32_str).groups()
        dirs[0] = str(nib) + dirs[0]
        public_id = '-'.join(dirs)
    else:
        raise RuntimeError(f'{format} is not a recognized Id token format')
    return public_id


