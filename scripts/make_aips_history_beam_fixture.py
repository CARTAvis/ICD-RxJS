"""Generate the AIPS-history-beam FITS fixture for ICD issue #33.

The image carries no BMAJ/BMIN/BPA keywords and no BEAMS table; the beam exists
only in HISTORY cards. Two cards are written: an earlier decoy and the real one,
so the test also pins down that the backend keeps the *last* history beam.

The card format matters. casacore recovers a history beam in
FITSImage::crackHeader -> ImageInfo::getRestoringBeam(LoggerHolder&), which
splits the line on whitespace and requires BMAJ, BMIN and BPA tokens each
followed by a value token in degrees. Without that, ImageInfo::hasBeam() stays
false and carta-backend's FitsLoader::ResetImageBeam never fires. The
`RESTOR Beam = 2.0 x 1.5 arcsec, pa = 30 degrees` form that
ParseHistoryBeamHeader also accepts is NOT recognised by casacore, so it cannot
be used for an uncompressed FITS fixture.
"""

import gzip
import os
import shutil
import sys

import numpy as np
from astropy.io import fits

USAGE = 'usage: {} <set_QA directory> <set_compressed_fits directory>'.format(os.path.basename(sys.argv[0]))

if len(sys.argv) != 3:
    sys.exit(USAGE)

QA_DIR = sys.argv[1]
COMPRESSED_DIR = sys.argv[2]

for directory in (QA_DIR, COMPRESSED_DIR):
    if not os.path.isdir(directory):
        sys.exit('{}\nnot a directory: {}'.format(USAGE, directory))

BASENAME = 'aips_history_beam.fits'

# Beam the backend must report: 2.0" x 1.5", pa 30 deg. Deliberately
# non-circular so that a BMAJ/BMIN mix-up is detectable.
BMAJ_DEG = 2.0 / 3600.0
BMIN_DEG = 1.5 / 3600.0
BPA_DEG = 30.0

# An earlier, different beam. casacore picks up the *first* history beam; the
# backend must strip it and use the *last* one instead.
DECOY_BMAJ_DEG = 4.0 / 3600.0
DECOY_BMIN_DEG = 3.0 / 3600.0
DECOY_BPA_DEG = 10.0

CARD = 'AIPS   CLEAN BMAJ=  {:.6E} BMIN=  {:.6E} BPA=  {:.2f}'
HISTORY_CARDS = [
    CARD.format(DECOY_BMAJ_DEG, DECOY_BMIN_DEG, DECOY_BPA_DEG),
    CARD.format(BMAJ_DEG, BMIN_DEG, BPA_DEG),
]


def make_data(nx=128, ny=128):
    y, x = np.mgrid[0:ny, 0:nx]
    g = 5.0 * np.exp(-(((x - 64.0) / 12.0) ** 2 + ((y - 64.0) / 8.0) ** 2) / 2.0)
    rng = np.random.default_rng(20230803)
    return (g + rng.normal(0.0, 0.1, (ny, nx))).astype(np.float32)


hdu = fits.PrimaryHDU(make_data())
h = hdu.header
h['BUNIT'] = ('Jy/beam', 'Brightness unit')
h['CTYPE1'] = 'RA---SIN'
h['CRVAL1'] = 275.0
h['CDELT1'] = -0.0002777777777778
h['CRPIX1'] = 64.0
h['CUNIT1'] = 'deg'
h['CTYPE2'] = 'DEC--SIN'
h['CRVAL2'] = -16.0
h['CDELT2'] = 0.0002777777777778
h['CRPIX2'] = 64.0
h['CUNIT2'] = 'deg'
h['RADESYS'] = 'FK5'
h['EQUINOX'] = 2000.0
h['TELESCOP'] = 'ALMA'
h['OBJECT'] = 'AIPS_HISTORY_BEAM_TEST'
for card in HISTORY_CARDS:
    h.add_history(card)

fits_path = os.path.join(QA_DIR, BASENAME)
fits.HDUList([hdu]).writeto(fits_path, overwrite=True)

gz_path = os.path.join(COMPRESSED_DIR, BASENAME + '.gz')
with open(fits_path, 'rb') as src, gzip.open(gz_path, 'wb') as dst:
    shutil.copyfileobj(src, dst)

for path in (fits_path, gz_path):
    print('{}  ({} bytes)'.format(path, os.path.getsize(path)))
header = fits.getheader(fits_path)
for card in header['HISTORY']:
    print('   HISTORY', card)
for key in ('BMAJ', 'BMIN', 'BPA'):
    assert key not in header, 'fixture must not carry a %s keyword' % key
assert len(fits.open(fits_path)) == 1, 'fixture must have no extensions'
print('   no BMAJ/BMIN/BPA keywords, no extensions: OK')
