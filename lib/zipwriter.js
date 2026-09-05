// ZipWriter: create Zip files from blobs, and stream them to browser
// (with support for CRC32 and Zip64, 4+GiB files)
var CRC_TABLE = new Uint32Array(256);

for (let i = 0; i < 256; i++) {
	let c = i;
	for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
	CRC_TABLE[i] = c;
}

class ZipWriter {
	constructor() {
		this.e = new TextEncoder();
		this.f = [];
		this.c = [];
		this.o = 0n;
		this.x = 0;
		this.w = 0;
		this.p = [];
		this.b = 1;
	}
	addBlob(n, b) {
		this.f.push([n, b, BigInt(b.size)]);
		this.w && (this.w(), this.w = 0);
		return this;
	}
	stream() {
		this.b = 0;
		return new ReadableStream({ start: c => this.r(c) });
	}
	async close() {
		this.x = 1;
		this.w && (this.w(), this.w = 0);
		if (!this.b) return;
		await this.r({ enqueue: x => this.p.push(x), close() {} });
		return new Blob(this.p, { type: "application/zip" });
	}
	async r(t) {
		while (!this.x || this.f.length) {
			if (!this.f.length) {
				await new Promise(r => this.w = r);
				continue;
			}

			let [f, b, s] = this.f.shift(),
				n = this.e.encode(f),
				zip64 = s >= 0xFFFFFFFFn || this.o >= 0xFFFFFFFFn,
				l = new Uint8Array(30 + n.length),
				v = new DataView(l.buffer),
				k = this.o;

			v.setUint32(0, 0x04034b50, 1);
			v.setUint16(4, zip64 ? 45 : 20, 1);
			v.setUint16(6, 0x808, 1);
			v.setUint16(26, n.length, 1);
			l.set(n, 30);
			t.enqueue(l);
			this.o += BigInt(l.length);

			let crc = -1;
			for await (let chunk of b.stream()) {
				for (let i = 0; i < chunk.length; i++) {
					crc = CRC_TABLE[(crc ^ chunk[i]) & 0xFF] ^ (crc >>> 8);
				}
				t.enqueue(chunk);
			}
			crc = (crc ^ -1) >>> 0;
			this.o += s;

			let ddLen = zip64 ? 24 : 16,
				dd = new Uint8Array(ddLen),
				dv = new DataView(dd.buffer);

			dv.setUint32(0, 0x08074b50, 1);
			dv.setUint32(4, crc, 1);
			if (zip64) {
				dv.setBigUint64(8, s, 1);
				dv.setBigUint64(16, s, 1);
			} else {
				dv.setUint32(8, Number(s), 1);
				dv.setUint32(12, Number(s), 1);
			}
			t.enqueue(dd);
			this.o += BigInt(ddLen);

			let efLen = zip64 ? (s >= 0xFFFFFFFFn ? 16 : 0) + (k >= 0xFFFFFFFFn ? 8 : 0) : 0;
			if (efLen) efLen += 4;

			let cd = new Uint8Array(46 + n.length + efLen),
				cv = new DataView(cd.buffer);

			cv.setUint32(0, 0x02014b50, 1);
			cv.setUint16(4, 45, 1);
			cv.setUint16(6, zip64 ? 45 : 20, 1);
			cv.setUint16(8, 0x808, 1);
			cv.setUint32(16, crc, 1);
			cv.setUint32(20, s >= 0xFFFFFFFFn ? 0xFFFFFFFF : Number(s), 1);
			cv.setUint32(24, s >= 0xFFFFFFFFn ? 0xFFFFFFFF : Number(s), 1);
			cv.setUint16(28, n.length, 1);
			cv.setUint16(30, efLen, 1);
			cv.setUint32(42, k >= 0xFFFFFFFFn ? 0xFFFFFFFF : Number(k), 1);
			cd.set(n, 46);

			if (efLen) {
				let ef = 46 + n.length;
				cv.setUint16(ef, 0x0001, 1);
				cv.setUint16(ef + 2, efLen - 4, 1);
				let efo = ef + 4;
				if (s >= 0xFFFFFFFFn) {
					cv.setBigUint64(efo, s, 1);
					cv.setBigUint64(efo + 8, s, 1);
					efo += 16;
				}
				if (k >= 0xFFFFFFFFn) cv.setBigUint64(efo, k, 1);
			}
			this.c.push(cd);
		}

		let z = this.o, sSize = 0n, entries = this.c.length;
		for (let d of this.c) {
			sSize += BigInt(d.length);
			t.enqueue(d);
		}

		if (z >= 0xFFFFFFFFn || sSize >= 0xFFFFFFFFn || entries >= 0xFFFF) {
			let z64eocd = new Uint8Array(56), z64v = new DataView(z64eocd.buffer);
			z64v.setUint32(0, 0x06064b50, 1);
			z64v.setBigUint64(4, 44n, 1)
			z64v.setUint16(12, 45, 1);
			z64v.setUint16(14, 45, 1);
			z64v.setBigUint64(24, BigInt(entries), 1);
			z64v.setBigUint64(32, BigInt(entries), 1);
			z64v.setBigUint64(40, sSize, 1);
			z64v.setBigUint64(48, z, 1);
			t.enqueue(z64eocd);

			let z64loc = new Uint8Array(20), locv = new DataView(z64loc.buffer);
			locv.setUint32(0, 0x07064b50, 1);
			locv.setBigUint64(8, z + sSize, 1);
			locv.setUint32(16, 1, 1);
			t.enqueue(z64loc);
		}

		let e = new Uint8Array(22), ev = new DataView(e.buffer);
		ev.setUint32(0, 0x06054b50, 1);
		ev.setUint16(8, entries >= 0xFFFF ? 0xFFFF : entries, 1);
		ev.setUint16(10, entries >= 0xFFFF ? 0xFFFF : entries, 1);
		ev.setUint32(12, sSize >= 0xFFFFFFFFn ? 0xFFFFFFFF : Number(sSize), 1);
		ev.setUint32(16, z >= 0xFFFFFFFFn ? 0xFFFFFFFF : Number(z), 1);
		t.enqueue(e);
		t.close();
	}
}