import re, sys, pathlib
B = pathlib.Path('/tmp/build')
head = (B/'head.html').read_text(encoding='utf-8')
css  = (B/'osr.css').read_text(encoding='utf-8')
schema = '''
<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"GovernmentOrganization",
  "name":"Office of the Student Regent, Bulacan State University",
  "alternateName":"BulSU OSR",
  "url":"https://bulsuosr.netlify.app/",
  "email":"bulsusg1983@gmail.com",
  "telephone":"+63 44 796 3817",
  "address":{
    "@type":"PostalAddress",
    "streetAddress":"Student Government (SG) Office, BulSU Main Campus, Guinhawa",
    "addressLocality":"City of Malolos",
    "addressRegion":"Bulacan",
    "addressCountry":"PH"
  },
  "parentOrganization":{"@type":"CollegeOrUniversity","name":"Bulacan State University","url":"https://www.bul su.edu.ph/".replace(" ","")},
  "areaServed":"Bulacan State University students"
}
</script>
'''
body = ''.join((B/f'body{i}.html').read_text(encoding='utf-8') for i in range(1,6))
scripts = '\n'.join('<script>\n'+pathlib.Path(f'/tmp/js/block{i}.js').read_text(encoding='utf-8').strip()+'\n</script>' for i in range(1,5))
out = head + css + '\n</style>\n' + schema + '</head>\n' + body + '\n' + scripts + '\n<script src="/js/cms-integration.js"></script>\n</body>\n</html>\n'
(B/'index-assembled.html').write_text(out, encoding='utf-8')
print('assembled', len(out), 'chars')
# sanity
import html as H
markup = re.sub(r'<script[\s\S]*?</script>','',re.sub(r'<style[\s\S]*?</style>','',out))
print('  inline styles in markup:', len(re.findall(r'style="', markup)))
ids = re.findall(r'\sid="([^"]+)"', markup)
dupes = sorted({i for i in ids if ids.count(i)>1})
print('  ids:', len(ids), '| duplicates:', dupes or 'none')
print('  heading seq:', ''.join(re.findall(r'<h([1-6])', markup)))
