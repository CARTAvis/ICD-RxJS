Sample Images
~~~~~~~~~~~~~

The following data files are used across the performance tests:

.. list-table::
   :header-rows: 1
   :widths: 40 20 20 20

   * - File
     - X (px)
     - Y (px)
     - Z (channels)
   * - ``cube_B_06400_z00100.<fits|image|hdf5>``
     - 6400
     - 6400
     - 100
   * - ``cube_B_03200_z01000.<fits|image|hdf5>``
     - 3200
     - 3200
     - 1000
   * - ``h_m51_b_s05_drz_sci.fits``
     - 8600
     - 12200
     - 1 (2D)
   * - ``S255_IR_sci.spw25.cube.I.pbcor.<fits|image|hdf5>``
     - 1920
     - 1920
     - 480

The synthetic cube files follow a naming convention:

.. code-block:: text

   cube_B_<NNNNN>_z<MMMMM>

where ``B_<NNNNN>`` is the spatial dimension per axis in pixels (square image) and
``z<MMMMM>`` is the number of spectral channels. For example, ``cube_B_06400_z00100``
is a 6400 x 6400 pixel cube with 100 channels.
