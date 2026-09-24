"""Refresh static profile links and verbatim additions from the supplied Word file.

Run from the repository root with Python 3. No third-party packages required.
Existing page content outside the marked additions is preserved.
"""
from pathlib import Path
from html import escape
import re
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(ROOT / 'Github Update_Gazi Fahad.docx') as archive:
    document = ET.fromstring(archive.read('word/document.xml'))
paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', NS)).strip()
              for p in document.findall('.//w:p', NS)]
paragraphs = [p for p in paragraphs if p]

PROFILES = [
    ('Mail', 'mailto:fahad@mbstu.ac.bd'),
    ('Google Scholar', 'https://scholar.google.com/citations?user=ajp1suMAAAAJ&hl=en&oi=ao'),
    ('LinkedIn', 'https://www.linkedin.com/in/gazifahad/'),
    ('Twitter', 'https://x.com/gazifahadbd'),
    ('ResearchGate', 'https://www.researchgate.net/profile/Gazi-Mohd-Shakil-Imtiaz-Fahad'),
    ('Office Portal', 'https://eng.mbstu.ac.bd/teacher/gazi-mohd-shakil-imtiaz-fahad'),
    ('ORCID', 'https://orcid.org/0009-0002-5443-1271'),
    ('Academia', 'https://univdhaka.academia.edu/gazifahad'),
    ('Web of Science', 'https://www.webofscience.com/wos/author/record/OEN-2984-2025'),
    ('SciProfiles', 'https://sciprofiles.com/profile/gazifahad'),
    ('Figshare', 'https://figshare.com/authors/Gazi_Fahad/23660632'),
    ('Self', 'https://www.self.so/gazifahad'),
    ('About Me', 'https://about.me/gazifahad'),
    ('Loop', 'https://loop.frontiersin.org/people/3453332/'),
    ('Canvas', 'https://canvas.instructure.com/eportfolios/4019039'),
    ('WhatsApp', 'http://wa.me/+8801538189339'),
    ('Tumblr', 'https://www.tumblr.com/blog/gazi-fahad'),
]

# Preserve the original five brand icons. Additional icons are inline SVGs,
# including service monograms, so no external icon service or font is needed.
original = (SITE / 'conferences/index.html').read_text(encoding='utf-8')
social_pattern = r'(<div class="social-icons\b[^>]*>).*?</div>'
first_social = re.search(social_pattern, original, re.S).group()
existing_icons = re.findall(r'<svg\b.*?</svg>', first_social, re.S)[:5]

def svg(body):
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false">' + body + '</svg>'

def monogram(text, size=15):
    return svg(f'<text x="12" y="17" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="{size}">{text}</text>')

icons = existing_icons + [
    svg('<path d="M2 8 12 2l10 6v2H2zm2 3h3v8H4zm7 0h3v8h-3zm7 0h3v8h-3zM2 20h20v2H2z"/>'),
    svg('<circle cx="12" cy="12" r="11" fill="none" stroke="currentColor"/><circle cx="6.5" cy="6.5" r="1.2"/><path fill-rule="evenodd" d="M5.5 9h2v10h-2zm4-4h4a7 7 0 0 1 0 14h-4zm2 2v10h2a5 5 0 0 0 0-10z"/>'),
    monogram('A', 22),
    svg('<path d="m2 5 9-3-3 5 8 4-5 3L2 9zm20 5v6l-9 6-5-3 9-6z"/>'),
    monogram('SP', 13),
    svg('<path d="m5 7 7 5m0 0 7-5m-7 5v8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="5" cy="6" r="4"/><circle cx="19" cy="6" r="4"/><circle cx="12" cy="19" r="4"/>'),
    monogram('s.', 22),
    monogram('me', 13),
    svg('<path d="M9 7H7a5 5 0 0 0 0 10h2l6-10h2a5 5 0 0 1 0 10h-2L9 7Z" fill="none" stroke="currentColor" stroke-width="2.5"/>'),
    svg('<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/>' + ''.join(f'<circle cx="12" cy="3" r="2" transform="rotate({a} 12 12)"/>' for a in range(0,360,45))),
    svg('<path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2Zm0 2a8 8 0 1 1-4.3 14.7l-.4-.2-2.5.7.7-2.5-.3-.4A8 8 0 0 1 12 4Zm-3 3c-.5-.4-1.5.1-1.7 1-.8 3.4 3.3 7.6 6.7 8 .9.1 2-.8 2-1.6l-2.6-1.3-1 1c-1.6-.6-2.6-1.6-3.2-3l1-1z"/>'),
    monogram('t', 23),
]

def social(match):
    links = []
    for (label, href), icon in zip(PROFILES, icons):
        if 'aria-hidden' not in icon:
            icon = icon.replace('<svg ', '<svg aria-hidden="true" focusable="false" ', 1)
        links.append(f'<a class="social-icons__link" data-v-7a627136="" href="{escape(href, quote=True)}" target="_blank" rel="noopener noreferrer" aria-label="{label}" title="{label}">{icon}</a>')
    return match[1] + ''.join(links) + '</div>'

def section(title, body, key):
    return f'<section class="portfolio-additions" id="{key}"><div class="portfolio-additions__inner"><h2>{escape(title)}</h2>{body}</div></section>'

def article(title, body):
    return '<article><h3>' + escape(title) + '</h3>' + ''.join('<p>' + escape(p) + '</p>' for p in body) + '</article>'

def mark(content):
    return '<!-- portfolio-additions:start -->' + content + '<!-- portfolio-additions:end -->'

home_start = paragraphs.index('Home Page')
research_start = paragraphs.index('Research Page (Both First and Second)')
conference_start = paragraphs.index('International Conference Page')
pub_start = paragraphs.index('Publications: 5 (Web of Science Indexed)', research_start)
review_start = paragraphs.index('In Review', research_start)
publication_body = ''.join(article(paragraphs[i], [paragraphs[i+1]]) for i in range(pub_start+1, review_start, 2))
publications = section(paragraphs[pub_start], publication_body, 'publications')

def groups(start, end, is_heading):
    indices = [i for i in range(start, end) if is_heading(i)] + [end]
    return ''.join(article(paragraphs[a], paragraphs[a+1:b]) for a,b in zip(indices, indices[1:]))

funding = section('Funding (Research Grant)', groups(research_start+2, pub_start, lambda i: paragraphs[i].startswith('Project:')), 'research-funding')
review = section('In Review', groups(review_start+1, conference_start, lambda i: i+1 < conference_start and paragraphs[i+1] == 'Executive Summary:'), 'research-in-review')
conference_body = groups(conference_start+2, len(paragraphs), lambda i: (i+1 < len(paragraphs) and paragraphs[i+1].startswith('Research Title:')) or bool(re.match(r'\d+\. ', paragraphs[i])))
conferences = section('International Conferences', conference_body, 'international-conferences')

for path in SITE.rglob('*.html'):
    page = path.read_text(encoding='utf-8')
    page = re.sub(r'<!-- portfolio-additions:start -->.*?<!-- portfolio-additions:end -->', '', page, flags=re.S)
    page = re.sub(social_pattern, social, page, flags=re.S)
    if '/assets/styles/portfolio-updates.css' not in page:
        page = page.replace('</head>', '<link rel="stylesheet" href="/assets/styles/portfolio-updates.css"></head>')
    relative = path.relative_to(SITE).as_posix()
    if relative in ('research/index.html', 'research-gazi-fahad/index.html'):
        # Add before dissertations while retaining every original research entry.
        anchor = next(m.start() for m in re.finditer(r'<section\b.*?</section>', page, re.S) if '>Dissertations<' in m.group())
        page = page[:anchor] + mark(funding + publications + review) + page[anchor:]
    elif relative == 'index.html':
        research_section = next(m for m in re.finditer(r'<section\b.*?</section>', page, re.S) if re.search(r'>Research</', m.group()))
        anchor = research_section.end()
        page = page[:anchor] + mark(publications) + page[anchor:]
    elif relative == 'conferences/index.html':
        anchor = page.index('<section')
        heading = section('National Conferences', '', 'national-conferences')
        page = page[:anchor] + mark(heading) + page[anchor:]
        anchor = page.index('<section id="zZBPeT"')
        page = page[:anchor] + mark(conferences) + page[anchor:]
    path.write_text(page, encoding='utf-8')
print('Updated header/footer profiles on all pages and added document content.')
