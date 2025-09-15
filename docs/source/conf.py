# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

import os
import sys

sys.path.insert(0, os.path.abspath('.'))

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'CARTA ICD Tests'
copyright = '2025, Cheng-Chin Chiang'
author = 'Cheng-Chin Chiang'
release = '0.0'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    'sphinxcontrib.plantuml',    # Support PlantUML
    'sphinx.ext.autodoc',        # Auto-documentation from docstrings
    'sphinx.ext.autosummary',    # Generate autodoc summaries
    'sphinx.ext.viewcode',       # Add links to highlighted source code
    'sphinx.ext.napoleon',       # Support for NumPy and Google style docstrings
    'sphinx.ext.intersphinx',    # Link to other project's documentation
    'sphinx.ext.todo',           # Support for todo items
    'sphinx.ext.coverage',       # Coverage checker for documentation
    'sphinx.ext.ifconfig',       # Include content based on configuration
]

plantuml = 'plantuml'
plantuml_output_format = 'svg'

# templates_path = ['_templates']
exclude_patterns = []

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_css_files = ["custom.css"]

rst_prolog = """
.. role:: red-text(emphasis)
    :class: red-text
"""
