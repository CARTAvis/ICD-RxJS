Image Fitting
-------------

.. uml::

    skinparam style strictuml
    hide footbox
    title Image Fitting workflow

    actor User

    box "Client-side" #EDEDED
            participant Frontend
    end box

    box "Server-side" #lightblue
        participant Backend
    end box

    User -> Frontend: Open image
    activate Frontend
    Frontend -> Backend : 1. OPEN_FILE
    activate Backend
    Frontend <-- Backend : 2. OPEN_FILE_ACK
    Frontend -> Backend : 3. ADD_REQUIRED_TILES
    Frontend -> Backend : 4. SET_CURSOR
    Frontend <-- Backend : 5. RASTER_TILE_DATA
    Frontend <-- Backend : 5. SPATIAL_PROFILE_DATA
    deactivate Backend
    User <-- Frontend: Displays image
    deactivate Frontend

    User -> Frontend: Request Gaussian fitting
    activate Frontend
    Frontend -> Backend : 6. FITTING_REQUEST
    activate Backend
    Frontend <-- Backend : 7. FITTING_PROGRESS (stream)
    Frontend <--[#red] Backend : <font color="red">8. FITTING_RESPONSE [Check]</font>
    deactivate Backend
    User <-- Frontend: Displays fitting results
    deactivate Frontend

IMAGE_FITTING_FITS
~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/IMAGE_FITTING_FITS.test.ts>`__.

This test verifies Gaussian image fitting on FITS files, covering various configurations: without field of view (FoV), with FoV using different solvers (Cholesky, QR, SVD), creating model and residual images, region-based fitting, and fitting with background flux offset.

.. note::

   Every case also checks the integrated flux and the background offset returned in the
   FITTING_RESPONSE. ``integrated_flux_values`` and ``integrated_flux_errors`` were added by
   `carta-backend PR #1294 <https://github.com/CARTAvis/carta-backend/pull/1294>`__, which adopted
   the error calculation of Condon (1997). They are only reported for images in ``Jy/beam`` or
   ``Jy/pixel``; this image is ``Jy/beam`` and carries a beam, so one value is returned per fitted
   component.

   All of the reported errors, integrated flux included, scale with the noise estimate the backend
   derives from the median absolute deviation of the residuals over the pixels which take part in
   the fit. Restricting the fit to a field of view or a region therefore raises every error by the
   same factor, roughly 58 for the values below, because a far larger fraction of the included
   pixels contains source signal. The flux values themselves are compared with a coarser precision
   than the other parameters, since they are of order 3.7e3.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex-channel0-addOneGaussian.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

4. Frontend sends: **ADD_REQUIRED_TILES** (``AddRequiredTiles``)

   .. code-block:: protobuf

     file_id = 0
     compression_quality = 11
     compression_type = ZFP
     tiles = [0]

5. Frontend sends: **SET_CURSOR** (``SetCursor``)

   .. code-block:: protobuf

     file_id = 0
     point = {x: 1, y: 1}

6. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

:red-text:`Check 2:` the RASTER_TILE_DATA stream should satisfy:

   - Total length = 3 (RasterTileSync start + 1 tile + RasterTileSync end)

**Case 1: Image fitting without FoV**

7. Frontend sends: **FITTING_REQUEST** (``FittingRequest``)

   .. code-block:: protobuf

     file_id = 0
     create_model_image = false
     create_residual_image = false
     fixed_params = [false, false, false, false, false, false, true]
     fov_info = null
     region_id = -1
     initial_values = [{amp: 10, center: {x: 320, y: 400}, fwhm: {x: 100, y: 50}, pa: 135}]

8. Backend returns: **FITTING_PROGRESS** (stream) and **FITTING_RESPONSE** (``FittingResponse``)

:red-text:`Check 3:` the FITTING_RESPONSE should satisfy:

   .. code-block:: protobuf

     success = true
     result_values[0].center = {x: 319.50, y: 399.50}
     result_values[0].amp = 10.00
     result_values[0].fwhm = {x: 170.64, y: 41.48}
     result_values[0].pa = 142.16
     integrated_flux_values = [3684.61]
     integrated_flux_errors = [0.384]
     offset_value = 0
     offset_error = 0
     log contains "Gaussian fitting with 1 component"

   - resultErrors should be close to zero

**Case 2-1: Image fitting with FoV (solver = Cholesky)**

9. Frontend sends: **FITTING_REQUEST** (``FittingRequest``)

   .. code-block:: protobuf

     file_id = 0
     create_model_image = false
     create_residual_image = false
     fixed_params = [false, false, false, false, false, false, true]
     fov_info = {control_points: [{x: 319.5, y: 399.5}, {x: 216.71, y: 200.0}], region_type: RECTANGLE, rotation: 0}
     region_id = 0
     initial_values = [{amp: 10, center: {x: 320, y: 400}, fwhm: {x: 100, y: 50}, pa: 135}]
     solver = Cholesky

10. Backend returns: **FITTING_RESPONSE** (``FittingResponse``)

:red-text:`Check 4:` the FITTING_RESPONSE should satisfy:

   .. code-block:: protobuf

     success = true
     result_values[0].center = {x: 319.50, y: 399.50}
     result_values[0].amp = 10.00
     result_values[0].fwhm = {x: 170.64, y: 41.48}
     result_values[0].pa = 142.16
     integrated_flux_values = [3684.61]
     integrated_flux_errors = [22.43]
     offset_value = 0
     offset_error = 0

   The flux error here is 22.43 rather than the 0.384 of Case 1. The fitted values are unchanged,
   so this is the noise estimate rising when the fit is restricted to the field of view; every
   other error in this response is larger by the same factor.

**Case 2-2: Image fitting with FoV (solver = QR)**

11. Frontend sends: **FITTING_REQUEST** with solver = QR

12. Backend returns: **FITTING_RESPONSE** (``FittingResponse``)

:red-text:`Check 5:` the FITTING_RESPONSE should match Case 2-1 results

**Case 2-3: Image fitting with FoV (solver = SVD)**

13. Frontend sends: **FITTING_REQUEST** with solver = SVD

14. Backend returns: **FITTING_RESPONSE** (``FittingResponse``)

:red-text:`Check 6:` the FITTING_RESPONSE should match Case 2-1 results

**Case 3: Image fitting creating model image**

15. Frontend sends: **FITTING_REQUEST** (``FittingRequest``)

    .. code-block:: protobuf

      file_id = 0
      create_model_image = true
      create_residual_image = false
      fixed_params = [false, false, false, false, false, false, true]
      fov_info = null
      region_id = -1
      initial_values = [{amp: 10, center: {x: 320, y: 400}, fwhm: {x: 100, y: 50}, pa: 135}]

16. Backend returns: **FITTING_RESPONSE** and **REGION_HISTOGRAM_DATA** (for model image)

:red-text:`Check 7:` the FITTING_RESPONSE should satisfy:

    - FITTING_RESPONSE.success = True
    - the fitted values, errors, integrated flux and offset match Case 1, since creating a model
      image does not change the fit
    - REGION_HISTOGRAM_DATA.fileId = 1 (model image)

17. Frontend sends: **ADD_REQUIRED_TILES** for model image (file_id = 1)

18. Backend returns: **RASTER_TILE_DATA** for model image

:red-text:`Check 8:` all RASTER_TILE_DATA should have fileId = 1

**Case 4: Image fitting creating model and residual images**

19. Frontend sends: **FITTING_REQUEST** (``FittingRequest``)

    .. code-block:: protobuf

      file_id = 0
      create_model_image = true
      create_residual_image = true
      region_id = -1

20. Backend returns: **FITTING_RESPONSE** and 2 **REGION_HISTOGRAM_DATA** (model + residual)

:red-text:`Check 9:` the response should satisfy:

    - FITTING_RESPONSE.success = True
    - the fitted values, errors, integrated flux and offset match Case 1
    - REGION_HISTOGRAM_DATA fileIds should contain 2 and 3

**Case 5: Image fitting with region, model and residual images**

21. Frontend sends: **SET_REGION** (``SetRegion``)

    .. code-block:: protobuf

      file_id = 0
      region_id = 1
      region_type = RECTANGLE
      control_points = [{x: 319.5, y: 399.5}, {x: 216.71, y: 200.0}]
      rotation = 0

22. Backend returns: **SET_REGION_ACK** (``SetRegionAck``)

:red-text:`Check 10:` SET_REGION_ACK.success = True and regionId = 1

23. Frontend sends: **FITTING_REQUEST** (``FittingRequest``)

    .. code-block:: protobuf

      file_id = 0
      create_model_image = true
      create_residual_image = true
      region_id = 1
      solver = Cholesky
      offset = 0

24. Backend returns: **FITTING_RESPONSE** and 2 **REGION_HISTOGRAM_DATA**

:red-text:`Check 11:` the FITTING_RESPONSE should satisfy:

    - FITTING_RESPONSE.success = True
    - the fitted values, errors, integrated flux and offset match Case 2-1, because the region has
      the same control points as the field of view used there
    - REGION_HISTOGRAM_DATA fileIds should contain 4 and 5

**Case 6: Image fitting with background flux offset**

25. Frontend sends: **CLOSE_FILE** and opens a different file:

    .. code-block:: protobuf

      file = "M17_SWex-channel0-addOneGaussian-addBackgroundFlux.fits"
      file_id = 0

26. Frontend sends: **SET_REGION** and **FITTING_REQUEST** with offset = 9

27. Backend returns: **FITTING_RESPONSE**

:red-text:`Check 12:` the FITTING_RESPONSE should satisfy:

    .. code-block:: protobuf

      success = true
      result_values[0].center = {x: 319.50, y: 399.50}
      result_values[0].amp = 10.00
      integrated_flux_values = [3684.45]
      integrated_flux_errors = [22.43]
      offset_value = 10.00
      offset_error = 0.0021
      log contains "Gaussian fitting with 1 component"

    This is the only case where the background offset is a free parameter, so it is the only one
    where ``offset_value`` and ``offset_error`` are non-zero. The offset error is calculated from
    the covariance matrix, which PR #1294 changed; the other errors in this response come from the
    Condon (1997) formulae.

IMAGE_FITTING_CASA
~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/IMAGE_FITTING_CASA.test.ts>`__.

This test is identical in structure to IMAGE_FITTING_FITS, but uses CASA image files (.image) instead of FITS files. It verifies that Gaussian image fitting produces the same results regardless of file format.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex-channel0-addOneGaussian.image"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3-27. Same workflow as IMAGE_FITTING_FITS (Cases 1-6), using ``.image`` files

:red-text:`Checks 2-12:` same assertions as IMAGE_FITTING_FITS

IMAGE_FITTING_HDF5
~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/IMAGE_FITTING_HDF5.test.ts>`__.

This test is identical in structure to IMAGE_FITTING_FITS, but uses HDF5 image files (.hdf5) instead of FITS files. It verifies that Gaussian image fitting produces the same results regardless of file format.

1. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex-channel0-addOneGaussian.hdf5"
     file_id = 0
     render_mode = RASTER

2. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

3-27. Same workflow as IMAGE_FITTING_FITS (Cases 1-6), using ``.hdf5`` files

:red-text:`Checks 2-12:` same assertions as IMAGE_FITTING_FITS

IMAGE_FITTING_BAD
~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/IMAGE_FITTING_BAD.test.ts>`__.

This test verifies error handling in image fitting, including cases where the solver exceeds the maximum number of iterations and where the fit does not converge.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "ThreeComponent-inclined-2d-gaussian.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

4. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR**

5. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

**Case 1: Exceeded maximum number of iterations**

6. Frontend sends: **FITTING_REQUEST** (``FittingRequest``) with a 2-component Gaussian

   .. code-block:: protobuf

     file_id = 0
     create_model_image = false
     create_residual_image = false
     fixed_params = [false, false, false, false, false, false, false, false, false, false, false, false, true]
     region_id = -1
     initial_values = [{amp: 1, center: {x: 164, y: 280}, fwhm: {x: 100, y: 5}, pa: 270},
                       {amp: 1, center: {x: 220, y: 270}, fwhm: {x: 30, y: 100}, pa: 45}]
     solver = Cholesky
     offset = 0

7. Backend returns: **FITTING_RESPONSE** (``FittingResponse``)

:red-text:`Check 2:` the FITTING_RESPONSE should satisfy:

   - FITTING_RESPONSE.log contains iteration exceeded message
   - FITTING_RESPONSE.message contains warning about exceeded iterations
   - Result values and errors should still be returned (platform-dependent)
   - ``integrated_flux_values`` and ``integrated_flux_errors`` are empty, and ``offset_value`` and
     ``offset_error`` are zero

.. note::

   This image carries neither a brightness unit nor a beam, so the backend reports no integrated
   flux at all. That makes the check platform independent, unlike the fitted values above, which
   need a separate expected result for each operating system this test runs on.

**Case 2: Fit did not converge**

8. Frontend sends: **FITTING_REQUEST** (``FittingRequest``) with intentionally bad initial values

   .. code-block:: protobuf

     file_id = 0
     create_model_image = false
     create_residual_image = false
     fixed_params = [false, false, false, false, false, false, true]
     region_id = -1
     initial_values = [{amp: 10, center: {x: 1000, y: 280}, fwhm: {x: 100, y: 5}, pa: 270}]
     solver = Cholesky
     offset = 0

9. Backend returns: **FITTING_RESPONSE** (``FittingResponse``)

:red-text:`Check 3:` the FITTING_RESPONSE should satisfy:

   - The request should throw an error with a "did not converge" message

IMAGE_FITTING_CANCEL
~~~~~~~~~~~~~~~~~~~~

See the `source code <https://github.com/CARTAvis/ICD-RxJS/blob/dev/src/test/IMAGE_FITTING_CANCEL.test.ts>`__.

This test verifies that an in-progress image fitting request can be cancelled via STOP_FITTING, and that a subsequent fitting request still succeeds.

1. Frontend sends: **CLOSE_FILE** (``CloseFile``)

   .. code-block:: protobuf

     file_id = -1

2. Frontend sends: **OPEN_FILE** (``OpenFile``)

   .. code-block:: protobuf

     directory = "set_QA"
     file = "M17_SWex-channel0-addOneGaussian.fits"
     hdu = "0"
     file_id = 0
     render_mode = RASTER

3. Backend returns: **OPEN_FILE_ACK** (``OpenFileAck``) and **REGION_HISTOGRAM_DATA**

:red-text:`Check 1:` the OPEN_FILE_ACK should satisfy:

   - OPEN_FILE_ACK.success = True

4. Frontend sends: **ADD_REQUIRED_TILES** and **SET_CURSOR**

5. Backend returns: **RASTER_TILE_DATA** and **SPATIAL_PROFILE_DATA**

6. Frontend sends: **SET_REGION** (``SetRegion``)

   .. code-block:: protobuf

     file_id = 0
     region_id = 1
     region_type = RECTANGLE
     control_points = [{x: 324, y: 398}, {x: 270, y: 270}]
     rotation = 0

:red-text:`Check 2:` SET_REGION_ACK.success = True and regionId = 1

**Step 1: Request fitting, then cancel**

7. Frontend sends: **FITTING_REQUEST** (``FittingRequest``)

   .. code-block:: protobuf

     file_id = 0
     create_model_image = false
     create_residual_image = false
     fixed_params = [false, false, false, false, false, false, true]
     region_id = 1
     initial_values = [{amp: 10, center: {x: 320, y: 400}, fwhm: {x: 100, y: 50}, pa: 135}]
     solver = Cholesky
     offset = 0

8. Backend streams: **FITTING_PROGRESS** (``FittingProgress``)

9. After receiving 10 progress updates, Frontend sends: **STOP_FITTING** (``StopFitting``)

   .. code-block:: protobuf

     file_id = 0

:red-text:`Check 3:` the FITTING_RESPONSE error should contain "task cancelled"

**Step 2: Request fitting again and let it complete**

10. Frontend sends: **FITTING_REQUEST** (same as step 7)

11. Backend returns: **FITTING_RESPONSE** (``FittingResponse``)

:red-text:`Check 4:` the FITTING_RESPONSE should satisfy:

    .. code-block:: protobuf

      success = true
      result_values[0].center = {x: 319.50, y: 399.50}
      result_values[0].amp = 10.00
      result_values[0].fwhm = {x: 170.64, y: 41.48}
      result_values[0].pa = 142.16
      integrated_flux_values = [3684.63]
      integrated_flux_errors = [2.51]
      offset_value = 0
      offset_error = 0
      log contains "Gaussian fitting with 1 component"

    - All resultErrors should be close to zero

    The region used here is larger than the one in IMAGE_FITTING_FITS, so the flux error falls
    between the whole-image and field-of-view values of that test.
