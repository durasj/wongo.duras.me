"""Regenerate the two exact edition links. Requires: python3 -m pip install qrcode"""
from pathlib import Path
import qrcode,json
from qrcode.image.svg import SvgPathImage
ROOT=Path(__file__).resolve().parents[1]
for edition,config in json.loads((ROOT/'src/data/editions.json').read_text()).items():
    url=config['url']
    qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=10,border=4)
    qr.add_data(url)
    qr.make(fit=True)
    qr.make_image(image_factory=SvgPathImage).save(ROOT/f'public/art/qr-{edition}.svg')
    print(f'{edition}: {url}')
