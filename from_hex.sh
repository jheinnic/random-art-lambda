#!/bin/sh

src="${1}"

python -c "import math; v='${src}'; print('00000000: ' + ' '.join([v[4*i:4*(i+1)] for i in range(0, math.ceil(len(v) / 4))]))" | xxd -r
