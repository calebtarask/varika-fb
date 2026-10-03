A='M1102.5 202.4C1096 205.5 1094.9 206.7 1083.8 225L906.8 511.2C907.7 511.6 928.6 511.9 953.1 511.9H997.8L1113.4 327.3L1225.5 512H1268C1291.4 512 1312.9 511.7 1315.7 511.4L1321 510.7L1146.8 229.7C1133.8 208.6 1130.7 204.7 1124.6 201.9C1118.6 199.2 1108.9 199.4 1102.5 202.4Z'
T='M1114 378.6L1031.2 510.8C1034.3 511.4 1190.4 512 1191.9 511.1L1114 378.6Z'
R='M1346 203V512H1437V417H1492.7L1580.4 512H1687.8L1586.9 403.7L1598.2 400C1614.4 394.7 1619.4 392.5 1628.9 386.8C1652.8 372.3 1668.2 351.6 1673.6 326.6C1676 315.6 1675.8 294.6 1673.2 283.7C1668.7 265.4 1659.9 250 1646.7 237.3C1628.3 219.6 1607.6 210.1 1575.6 204.5C1568 203.2 1551.2 203 1456.4 203H1346ZM1437 270.6H1551.5L1557.9 273C1566.1 276.2 1572.7 282.1 1577.1 290.2C1580.4 296.3 1580.5 296.8 1580.5 307.5C1580.4 316.7 1580.1 319.3 1578.2 323.4C1574.9 330.6 1570.6 335.5 1564.1 339.4C1553.4 345.9 1552.7 346 1491.8 346H1437V270.6Z'
I='M410 203H502.3V512H410V203Z'
K='M1464 203H1556V330L1696 203H1826L1644 362L1834 512H1704L1576 405L1556 424V512H1464V203Z'
W='#f3f3f5';V='#a528ff'
LOGO=f'''<svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="40 170 2480 380" fill="none">
<g><path transform="matrix(1 0 0 -1 -829.8 715)" d="{A}" fill="{W}"/></g>
<g transform="translate(-25 0)"><path transform="translate(-395.8 0)" d="{A}" fill="{V}"/><path transform="translate(-395.8 0)" d="{T}" fill="{W}"/></g>
<g transform="translate(35 0)"><path transform="translate(-396.0 0)" d="{R}" fill="{W}"/></g>
<g transform="translate(95 0)"><path transform="translate(922.0 0)" d="{I}" fill="{W}"/></g>
<g transform="translate(155 0)"><path d="{K}" fill="{W}"/></g>
<g transform="translate(215 0)"><path transform="translate(942.2 0)" d="{A}" fill="{W}"/><path transform="translate(942.2 0)" d="{T}" fill="{W}"/></g></svg>'''
ICON=lambda c,s: f'<svg width="{s}" height="{s}" viewBox="1841 141 430 430" fill="none"><path transform="translate(942.2 0)" d="{A}" fill="{c}"/><path transform="translate(942.2 0)" d="{T}" fill="{c}"/></svg>'
CSS='''*{margin:0;box-sizing:border-box}body{width:1080px;height:1080px;font-family:Figtree,sans-serif;color:#f3f3f5;overflow:hidden;
background:radial-gradient(700px 420px at 12% 20%, rgba(165,40,255,.55), transparent 70%),radial-gradient(640px 420px at 92% 85%, rgba(165,40,255,.40), transparent 70%),linear-gradient(135deg,#1c1b25 0%,#24262d 55%,#1e1a2a 100%);
display:flex;flex-direction:column;align-items:center;justify-content:center;padding:96px;text-align:center;position:relative}
body:before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1.5px,transparent 1.5px);background-size:28px 28px}
.ring{position:absolute;border:2px solid rgba(165,40,255,.35);border-radius:50%}
.logo{width:300px;position:absolute;top:90px}
h1{font-weight:700;font-size:76px;line-height:1.12;letter-spacing:-1px;position:relative}
h1 em{font-style:normal;color:#ba7aff}
.sub{margin-top:28px;font-size:34px;color:#979baa;font-weight:400;position:relative}
.pills{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;margin-top:52px;position:relative}
.pill{display:flex;align-items:center;gap:14px;padding:14px 26px 14px 14px;border-radius:999px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.14);font-weight:600;font-size:28px}
.dot{width:46px;height:46px;border-radius:50%;background:#a528ff;display:flex;align-items:center;justify-content:center;font-size:24px}
.foot{position:absolute;bottom:90px;font-weight:600;font-size:24px;letter-spacing:4px;color:#98ffb5;display:flex;align-items:center;gap:20px}
.foot:before,.foot:after{content:"";width:70px;height:2px;background:#98ffb5;opacity:.6}
.small{position:absolute;bottom:84px}'''
HEAD='<!doctype html><html><head><meta charset="utf-8"><style>'+open("figtree.css").read()+CSS+'</style></head><body><div class="ring" style="width:700px;height:700px;right:-380px;top:-300px"></div><div class="ring" style="width:520px;height:520px;left:-300px;bottom:-260px"></div>'
pill=lambda ic,t: f'<div class="pill"><span class="dot">{ic}</span>{t}</div>'
pages={
'post1-presentation':LOGO+'<h1>La crypto simple,<br><em>pensée pour Madagascar</em></h1><div class="pills">'+pill('⇄','Échanger sans gas')+pill('₮','USDT ⇄ Ariary en P2P')+pill('$','Épargner en dollars')+'</div><div class="foot">BIENTÔT DISPONIBLE</div>',
'post2-regle-or':'<div style="position:absolute;top:90px">'+ICON(V,90)+'</div><h1>Ta phrase de récupération<br>ne se partage <em>jamais</em></h1><div class="sub">Ni à un ami, ni au « support », ni à Varika.</div><div class="pills">'+pill('🔑','Phrase de récupération')+pill('🗝','Clé privée')+pill('🔒','Mot de passe')+pill('✉','Code SMS')+'</div><div class="small">'+LOGO.replace('class="logo"','class="logo" style="position:static;width:200px"')+'</div>',
'post3-sondage':'<div style="position:absolute;top:90px">'+ICON(V,90)+'</div><h1>Et toi, tu utilises<br><em>quel</em> Mobile Money ?</h1><div class="sub">Réponds en commentaire avec un chiffre</div><div class="pills">'+pill('1','MVola')+pill('2','Orange Money')+pill('3','Airtel Money')+pill('4','Plusieurs')+pill('5','Aucun')+'</div><div class="small">'+LOGO.replace('class="logo"','class="logo" style="position:static;width:200px"')+'</div>',
}
for k,v in pages.items(): open(k+'.html','w').write(HEAD+v+'</body></html>')
