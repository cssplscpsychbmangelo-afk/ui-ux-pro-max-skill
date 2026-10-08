import pathlib, re, sys
ds = pathlib.Path('/tmp/build/design-system.html'); html = ds.read_text(encoding='utf-8')
css = pathlib.Path('/tmp/build/osr.css').read_text(encoding='utf-8')
marker = '\n</style>\n<style>\n/* ── only what a specimen page needs'
i = html.index(marker)
start = html.index('@font-face{font-family:"Bricolage Grotesque"')
head = html[:start]
tail = html[i:]
out = head + css + tail
ds.write_text(out, encoding='utf-8')
print('design-system.html refreshed with the current osr.css:', len(out), 'chars')
