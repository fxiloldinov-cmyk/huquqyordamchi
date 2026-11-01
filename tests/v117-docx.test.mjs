// v11.7: DOCX — uslub orqali berilgan shrift, sarlavha, raqamlash, interval; jadval, kolontitul, footnote, bir nechta bo'lim;
// namunadagi shaxsiy matn va yashirin ma'lumot (kolontitul, izoh, mualliflar, customXml, eskiz, shablon yo'li, rasm) eksportga o'tmasligi.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const { writeZip, readZip } = await import('../netlify/shared/zip.mjs');
const docx = await import('../netlify/shared/docx.mjs');
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const SECRET = 'Aliyev';

export function richTemplate() {
  const f = readZip(docx.defaultTemplate());
  f.set('word/styles.xml', Buffer.from(`${X}<w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>`
    + `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria"/><w:sz w:val="28"/></w:rPr></w:style>`
    + `<w:style w:type="paragraph" w:styleId="MyBody"><w:name w:val="My Body"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="both"/><w:ind w:firstLine="709"/></w:pPr></w:style>`
    + `<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>`
    + `<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/></w:rPr></w:style></w:styles>`));
  f.set('word/numbering.xml', Buffer.from(`${X}<w:numbering ${W}><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`));
  const body = `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>KAZUS YECHIMI</w:t></w:r></w:p>`
    + `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Faktlar</w:t></w:r></w:p>`
    + `<w:p><w:pPr><w:pStyle w:val="MyBody"/></w:pPr><w:r><w:t>${SECRET} Botir qo‘shnisidan qarz oldi va muddatida qaytarmadi, bu holat sudgacha yetdi.</w:t></w:r><w:r><w:footnoteReference w:id="1"/></w:r></w:p>`
    + `<w:p><w:pPr><w:pStyle w:val="MyBody"/></w:pPr><w:r><w:t xml:space="preserve">${SECRET}ning manzili va telefoni yashirin </w:t></w:r><w:r><w:rPr><w:vanish/></w:rPr><w:t>+998901234567 maxfiy</w:t></w:r></w:p>`
    + `<w:p><w:pPr><w:pStyle w:val="MyBody"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Birinchi normativ asos</w:t></w:r></w:p>`
    + `<w:tbl><w:tr><w:tc><w:p><w:r><w:t>${SECRET} jadvali</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`
    + `<w:p><w:pPr><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:pPr></w:p>`
    + `<w:p><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"/></w:drawing></w:r></w:p>`
    + `<w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="851" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>`;
  f.set('word/document.xml', Buffer.from(`${X}<w:document ${W}><w:body>${body}</w:body></w:document>`));
  f.set('word/header1.xml', Buffer.from(`${X}<w:hdr ${W}><w:p><w:r><w:t>${SECRET} B. — kurs ishi, 3-guruh</w:t></w:r></w:p></w:hdr>`));
  f.set('word/footnotes.xml', Buffer.from(`${X}<w:footnotes ${W}><w:footnote w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:footnote><w:footnote w:id="1"><w:p><w:r><w:t>${SECRET} shaxsiy izohi</w:t></w:r></w:p></w:footnote></w:footnotes>`));
  f.set('word/people.xml', Buffer.from(`${X}<w15:people xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"><w15:person w15:author="${SECRET} Botir"/></w15:people>`));
  f.set('customXml/item1.xml', Buffer.from(`${X}<b:Sources xmlns:b="http://schemas.openxmlformats.org/officeDocument/2006/bibliography"><b:Source><b:Author>${SECRET}</b:Author></b:Source></b:Sources>`));
  f.set('word/settings.xml', Buffer.from(`${X}<w:settings ${W}><w:attachedTemplate r:id="rIdT"/><w:rsids><w:rsidRoot w:val="00A1B2C3"/></w:rsids><w:defaultTabStop w:val="708"/></w:settings>`));
  f.set('word/_rels/settings.xml.rels', Buffer.from(`${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdT" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/attachedTemplate" Target="file:///C:/Users/${SECRET.toLowerCase()}/Shablon.dotx" TargetMode="External"/></Relationships>`));
  f.set('docProps/thumbnail.jpeg', Buffer.from(`JPEG ${SECRET} sahifa eskizi`));
  f.set('_rels/.rels', Buffer.from(f.get('_rels/.rels').toString().replace('</Relationships>', '<Relationship Id="rIdThumb" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="docProps/thumbnail.jpeg"/></Relationships>')));
  f.set('word/media/image1.png', Buffer.from(`PNG ${SECRET} imzo skani`));
  const dr = f.get('word/_rels/document.xml.rels').toString();
  f.set('word/_rels/document.xml.rels', Buffer.from(dr.replace('</Relationships>', '<Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/><Relationship Id="rIdH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/></Relationships>')));
  return writeZip(f);
}

test('style-defined font, size and spacing are resolved through the style chain; headings and numbering are detected', () => {
  const info = docx.inspectDocx(richTemplate());
  assert.equal(info.format.font, 'Cambria', 'shrift Normal uslubidan (to‘g‘ridan-to‘g‘ri formatsiz)');
  assert.equal(info.format.sizePt, 14); assert.equal(info.format.lineSpacing, 1.5);
  assert.equal(info.format.align, 'both'); assert.equal(info.format.firstLineMm, 12.5);
  assert.deepEqual(info.format.headingLevels, [1, 2]); assert.equal(info.format.numberedList, true);
});

test('unsupported formatting is stated, never promised as preserved: table, header/footer, footnote, several sections, drawings', () => {
  const w = docx.inspectDocx(richTemplate()).warnings.join(' | ');
  for (const re of [/jadval/i, /footnote/i, /bir nechta bo‘lim/, /Kolontitul/, /Rasm/]) assert.match(w, re);
  assert.ok(!/aynan saqlandi/i.test(w));
});

test('export keeps the format but carries no personal or hidden data from the sample', () => {
  const md = '# Kazus yechimi\n\n## Faktlar\nQarz beruvchi pulni qaytarishni talab qildi.\n\n1. FK 735-modda 2-qism.\n2. FK 150-modda.';
  const { buffer } = docx.buildDocx(richTemplate(), md, { title: 'Test' });
  const files = readZip(buffer);
  for (const [name, buf] of files) assert.ok(!buf.toString('utf8').toLowerCase().includes(SECRET.toLowerCase()), `${name} ichida namuna ma’lumoti qolmasin`);
  assert.ok(!files.has('docProps/thumbnail.jpeg') && !/thumbnail/.test(files.get('_rels/.rels').toString()), 'eskiz o‘chiriladi');
  assert.ok(!files.has('word/media/image1.png'), 'tana ishlatmaydigan rasm o‘chiriladi');
  assert.match(files.get('word/footnotes.xml').toString(), /w:type="separator"/, 'ajratuvchi qoladi (paket yaroqli)');
  assert.ok(!/rsid/.test(files.get('word/settings.xml').toString()));
  const doc = files.get('word/document.xml').toString();
  assert.match(doc, /<w:pStyle w:val="MyBody"\/>/, 'asosiy matn namunaning uslubi bilan');
  assert.match(doc, /<w:numId w:val="1"\/>[\s\S]*FK 735/, 'raqamli ro‘yxat namunaning raqamlashi bilan');
  assert.match(doc, /<w:pgMar w:top="1134" w:right="851" w:bottom="1134" w:left="1701"/);
  assert.ok(!/headerReference/.test(doc), 'matnli kolontitul ulanmaydi');
  assert.match(files.get('word/_rels/document.xml.rels').toString(), /Target="numbering\.xml"/, 'raqamlash hujjatga ulangan');
  assert.match(files.get('[Content_Types].xml').toString(), /PartName="\/word\/numbering\.xml"/);
});

test('export is written to disk for visual rendering check (tests/out/)', () => {
  fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
  const md = '# Kazus yechimi\n\n## 1. Faktlar\nXodim kasallik davrida ishdan bo‘shatildi; ish beruvchi ogohlantirmagan.\n\n## 2. Normalar\n1. MK 163-modda.\n2. MK 165-modda.\n\n## 3. Xulosa\nBo‘shatish **qonunga zid** bo‘lishi mumkin; tahrir sanasini tekshiring.';
  fs.writeFileSync(new URL('./out/namuna-format.docx', import.meta.url), docx.buildDocx(richTemplate(), md, { title: 'Vizual tekshiruv' }).buffer);
  fs.writeFileSync(new URL('./out/standart-format.docx', import.meta.url), docx.buildDocx(null, md, { title: 'Vizual tekshiruv' }).buffer);
});
