# Copyright 2010 Google Inc. All Rights Reserved.
# Author: phu@google.com (Po Hu)
#
# Description:
#   Rules that create css bundles.

package(default_visibility = ['//testing/chronos/bite:bite_pkg'])

filegroup(name = 'opensource_files',
          srcs = glob(['*'], exclude=['*~']))

CSS_COMPILER_DEFS = [
    '--add_copyright',
    '--allow_unrecognized_functions',
    '--allowed_non_standard_function=color-stop',
    '--allowed_non_standard_pseudo_type=nth-child',
    '--allowed_non_standard_function=-moz-linear-gradient',
    '--allowed_non_standard_function=-webkit-gradient',
    '--allowed_non_standard_function=from',
    '--allowed_non_standard_function=to',
    '--allowed_non_standard_function=alpha',
    '--allow_ie_function_syntax',
    '--allow_unrecognized_pseudo_types',
    '--simplify_css',
    '--eliminate_dead_styles'
]

css_library(name = 'base_css',
            srcs = [
                'default.css',
                '//testing/chronos/bite/client/project:explore.css',
                '//testing/chronos/bite/client/project:detail.css',
            ],
            deps = [
                 '//javascript/closure/css:menu',
                 '//javascript/closure/css:menuitem',
                 '//javascript/closure/css:combobox',
                 '//javascript/closure/css:menubutton',
                 '//javascript/closure/css:button',
            ]
)

css_binary(name = 'base_css_ltr',
           srcs = [ ':base_css' ],
           compile = 1,
           defs = CSS_COMPILER_DEFS
)

filegroup(name = 'styles',
          srcs = glob(['*'], exclude=['*~'])
)
