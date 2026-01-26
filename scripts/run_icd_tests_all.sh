#!/bin/bash

# --------------------------------------------------------------------------------------------------
# ls ../ICD_test_stages
#
# animator.tests            file_browser.tests        pv_generator.tests        resume.tests
# catalog.tests             image_fitting.tests       raster_tiles.tests        vector_overlay.tests
# close_file.tests          match.tests               region_manipulation.tests
# cube_histogram.tests      moment.tests              region_statistics.tests
# --------------------------------------------------------------------------------------------------

./run_icd_tests_stage.sh animator
./run_icd_tests_stage.sh catalog
./run_icd_tests_stage.sh close_file
./run_icd_tests_stage.sh cube_histogram
./run_icd_tests_stage.sh file_browser
./run_icd_tests_stage.sh image_fitting
./run_icd_tests_stage.sh match
./run_icd_tests_stage.sh moment
./run_icd_tests_stage.sh pv_generator
./run_icd_tests_stage.sh raster_tiles
./run_icd_tests_stage.sh region_manipulation
./run_icd_tests_stage.sh region_statistics
./run_icd_tests_stage.sh resume
./run_icd_tests_stage.sh vector_overlay
