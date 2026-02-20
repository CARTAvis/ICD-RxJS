Match Spatial
-------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Spatial/Spectral Matching workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open reference image
    activate Frontend
    Frontend -> Backend : 1. OPEN_FILE
    activate Backend
    Frontend <-- Backend : 2. OPEN_FILE_ACK
    deactivate Backend
    deactivate Frontend

    User -> Frontend: Open matched image
    activate Frontend
    Frontend -> Backend : 3. OPEN_FILE
    activate Backend
    Frontend <-- Backend : 4. OPEN_FILE_ACK
    deactivate Backend
    deactivate Frontend

    User -> Frontend: Set cursor / region
    activate Frontend
    Frontend -> Backend : 5. SET_CURSOR / SET_REGION
    activate Backend
    Frontend -> Backend : 6. SET_SPATIAL_REQUIREMENTS / SET_STATS_REQUIREMENTS
    Frontend <--[#red] Backend : <font color="red">7. SPATIAL_PROFILE_DATA / REGION_STATS_DATA [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Displays matched results
    deactivate Frontend

MATCH_SPATIAL
~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_SPATIAL.test.ts>`__.

This test verifies cursor value and spatial profile consistency with spatially matched images across 4 related image files.

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for 4 images

   .. code-block:: protobuf

     file = "HD163296_CO_2_1.fits", file_id = 100
     file = "HD163296_13CO_2-1.fits", file_id = 101
     file = "HD163296_C18O_2-1.fits", file_id = 102
     file = "HD163296_CO_2_1.image", file_id = 103

2. Frontend sends: **SET_CURSOR** (``SetCursor``) at (200.0, 200.0)

3. Frontend sends: **SET_SPATIAL_REQUIREMENTS** (``SetSpatialRequirements``) for x and y coordinates

4. Backend returns: **SPATIAL_PROFILE_DATA** (``SpatialProfileData``) for all images

:red-text:`Check 1:` the spatial profile data should satisfy:

   - Cursor value for fileId 100 = -0.0023265306372195482

   - Spatial profile data matches across all 4 images with 4 decimal precision

   - x coordinate raw profile values at indices [0, 500, 1000, 1500] = [36, 242, 86, 48]

   - y coordinate raw profile values at indices [0, 500, 1000, 1500] = [84, 163, 231, 66]

   - Profiles array has end = 432 for both x and y

