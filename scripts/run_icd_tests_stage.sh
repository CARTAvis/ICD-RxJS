#!/bin/bash

# --------------------------------------------------------------------------------------------------
# ls ../ICD_test_stages
#
# animator.tests            file_browser.tests        pv_generator.tests        resume.tests
# catalog.tests             image_fitting.tests       raster_tiles.tests        vector_overlay.tests
# close_file.tests          match.tests               region_manipulation.tests
# cube_histogram.tests      moment.tests              region_statistics.tests
# --------------------------------------------------------------------------------------------------

# --------------------------------------------------------------------------------------------------
# Example:
# ./run_icd_tests_stage.sh animator
# --------------------------------------------------------------------------------------------------

TEST_CLASS=$1

for test_file in $(cat ../ICD_test_stages/$TEST_CLASS.tests); do
    # echo $test_file
    npm test $test_file
    # sleep 3 && pgrep carta_backend
done
