"""Construit le site de démo anonyme (dossier + zip) à déposer sur Netlify.

Usage : python3 tools/build_site.py <dossier_de_sortie>
- enveloppe index.html dans une page complète ;
- active le mode site (vrais appels, vocaux et messages entre testeurs, liens YouTube) ;
- retire le code propre à l'aperçu claude.ai ;
- copie les images et la librairie d'appels, puis vérifie qu'aucun nom personnel ne reste.
"""
import os, re, shutil, sys, zipfile
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'dist'))
site = os.path.join(out, 'pulse-site')
shutil.rmtree(site, ignore_errors=True)
os.makedirs(site)
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
start = html.index('try{if(window.claude&&window.claude.use){')
end = html.index('}}catch(e){}', start) + len('}}catch(e){}')
html = html[:start] + html[end:]
html = html.replace('/* ---------- Capacités de la page (si le lecteur les offre) ---------- */', '')
head = ('<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="theme-color" content="#0A0520"><meta name="description" content="PULSE — Ta voix, ton univers.">'
        '<style>*{box-sizing:border-box}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>'
        '<script>window.PULSE_SITE=true</script><script src="vendor/peerjs.min.js"></script></head><body>\n')
page = head + html + '\n</body></html>\n'
bad = re.findall(r'(?i)kelly|claude|anthropic|piraux', page)
if bad:
    sys.exit('Mentions personnelles trouvées : %s' % set(bad))
open(os.path.join(site, 'index.html'), 'w', encoding='utf-8').write(page)
shutil.copytree(os.path.join(root, 'assets'), os.path.join(site, 'assets'))
os.makedirs(os.path.join(site, 'vendor'))
shutil.copy(os.path.join(root, 'vendor', 'peerjs-1.5.4.min.js'), os.path.join(site, 'vendor', 'peerjs.min.js'))
z = os.path.join(out, 'pulse-site.zip')
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as f:
    for d, _, files in os.walk(site):
        for n in files:
            full = os.path.join(d, n)
            f.write(full, os.path.relpath(full, out))
print('OK :', z)
