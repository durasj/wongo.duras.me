import json,zipfile,xml.etree.ElementTree as E,re,math
from pathlib import Path
root=Path(__file__).resolve().parents[1];ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
man=json.loads((root/'public/downloads/bambu/plate-manifest.json').read_text()); meshes=json.loads((root/'public/downloads/pieces/manifest.json').read_text())
allplates=[]
for plate in man['plates']:
 with zipfile.ZipFile(root/'public/downloads/bambu'/plate['file']) as z:
  model=E.fromstring(z.read('3D/3dmodel.model'));resources={int(o.attrib['id']):o for o in model.find('m:resources',ns)}
  for item,record in zip(model.find('m:build',ns),plate['objects'],strict=True):
   obj=resources[int(item.attrib['objectid'])];mid=int(obj.find('m:components/m:component',ns).attrib['objectid']);mesh=resources[mid].find('m:mesh',ns)
   verts=[tuple(float(v.attrib[c]) for c in ['x','y','z']) for v in mesh.find('m:vertices',ns)]
   tris=[tuple(verts[int(t.attrib[c])] for c in ['v1','v2','v3']) for t in mesh.find('m:triangles',ns)]
   piece=next(p for p in meshes['pieces'] if p['id']==record['pieceId'])
   nums=[tuple(map(float,m)) for m in re.findall(r'vertex\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)',(root/'public/downloads/pieces'/piece['filename']).read_text())]
   w,d,_=piece['dimensionsMm']
   for _ in range(record['rotation']):nums=[(round(d-y,8),x,z) for x,y,z in nums];w,d=d,w
   def signature(triangles):return sorted(tuple(tuple(round(c,6) for c in v) for v in t) for t in triangles)
   assert signature(tris)==signature([nums[i:i+3] for i in range(0,len(nums),3)])
   transform=list(map(float,item.attrib['transform'].split()));assert transform[:9]==[1,0,0,0,1,0,0,0,1];assert transform[9:]==[record['x'],record['y'],0]
 print(plate['file'], 'validated exact rotated STL triangles and translations for',len(plate['objects']),'objects')
