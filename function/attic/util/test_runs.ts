import {ModelPlotter, CanvasWriter} from './simple_main';
import * as crypto from 'crypto';
import * as fs from 'fs';

const plotter = new ModelPlotter('./fdoc.proto');
plotter.open().then((document) => {
    let ii;
    let writer;
    for( ii=0; ii<100; ii++ ) {
        let prefixSize = 3 + crypto.randomInt(29);
        let suffixSize = 3 + crypto.randomInt(29);
	let prefixBytes = crypto.randomBytes(prefixSize);
	let suffixBytes = crypto.randomBytes(suffixSize);
	let prefixStr = prefixBytes.toString('base64');
	let suffixStr = suffixBytes.toString('base64');
	let prefix = [...prefixBytes];
	let suffix = [...suffixBytes];
	let filename = `${prefixStr}-${suffixStr}`;
	let nextFilename = filename.replace('/', '_');
	while (filename !== nextFilename) {
	    filename = nextFilename;
	    nextFilename = filename.replace('/', '_');
	}
	filename = `testrun/${filename}`;
	let sidecar = { "ints": [ prefix, suffix ], "bytes": [ prefixBytes.toString('hex'), suffixBytes.toString('hex')], "base64": [prefixStr, suffixStr], "sizes": [prefixSize, suffixSize], "min": [Math.min(...prefix), Math.min(...suffix)], "max": [Math.max(...prefix), Math.max(...suffix)] };

        writer = plotter.paint({ prefixBits: prefix, suffixBits: suffix, novel: false });
        writer.writeSync(filename + ".png");
	fs.writeFileSync(filename + ".json", JSON.stringify(sidecar) );
    }
}).catch((err) => { console.log(err); });
