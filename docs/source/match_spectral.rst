Match Spectral
--------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Match Spectral workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open matched images
    activate Frontend
    Frontend -> Backend : 1. OPEN_FILE (x4)
    activate Backend
    Frontend <-- Backend : 2. OPEN_FILE_ACK (x4)
    deactivate Backend
    User <-- Frontend: Images loaded
    deactivate Frontend

    User -> Frontend: Set region
    activate Frontend
    Frontend -> Backend : 3. SET_REGION
    activate Backend
    Frontend <-- Backend : 4. SET_REGION_ACK
    deactivate Backend

    Frontend -> Backend : 5. SET_SPECTRAL_REQUIREMENTS (x4)
    activate Backend
    Frontend <--[#red] Backend : <font color="red">6. SPECTRAL_PROFILE_DATA (x4) [Check 1]</font>
    deactivate Backend
    User <-- Frontend: Spectral profiles displayed
    deactivate Frontend

MATCH_SPECTRAL
~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/MATCH_SPECTRAL.test.ts>`__.

This test verifies that region spectral profiles are consistent across spatially and spectrally matched images in different formats (FITS and CASA).

1. Frontend sends: **OPEN_FILE** (``OpenFile``) for four files

   File 1 (FITS CO 2-1):

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.fits"
     file_id = 100
     render_mode = RASTER

   File 2 (FITS 13CO):

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_13CO_2-1.fits"
     file_id = 101
     render_mode = RASTER

   File 3 (FITS C18O):

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_C18O_2-1.fits"
     file_id = 102
     render_mode = RASTER

   File 4 (CASA CO 2-1):

   .. code-block:: protobuf

     directory = "set_QA"
     file = "HD163296_CO_2_1.image"
     file_id = 103
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** for each file

3. Frontend sends: **SET_REGION** (``SetRegion``) on file 100

   .. code-block:: protobuf

     file_id = 100
     region_id = 1
     region_type = RECTANGLE
     control_points = [{x: 200, y: 200}, {x: 200, y: 200}]
     rotation = 0

4. Frontend sends: **SET_SPECTRAL_REQUIREMENTS** (``SetSpectralRequirements``) for each file

   .. code-block:: protobuf

     file_id = <100-103>
     region_id = 1
     spectral_profiles = [{coordinate: "z", stats_types: [Mean]}]

5. Backend returns: **SPECTRAL_PROFILE_DATA** (``SpectralProfileData``) for each file

:red-text:`Check 1:` the SPECTRAL_PROFILE_DATA should satisfy:

   - All region_id values equal 1

   - The spectral profile for file 100 (FITS) is identical to the profile for file 103 (CASA) — same data in different formats should produce the same results

**After rotating the region to 30 degrees:**

6. Frontend sends: **SET_REGION** (``SetRegion``) with updated rotation

   .. code-block:: protobuf

     file_id = 100
     region_id = 1
     region_type = RECTANGLE
     control_points = [{x: 200, y: 200}, {x: 200, y: 200}]
     rotation = 30

7. Backend returns: **SPECTRAL_PROFILE_DATA** for each file (progress = 1)

:red-text:`Check 2:` the SPECTRAL_PROFILE_DATA should satisfy:

   - All region_id values match the requirements

   - The rawValuesFp64 arrays for file 100 (FITS) and file 103 (CASA) are element-by-element identical
