# Copyright 2010 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
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


PROJECT_PKG = '//testing/chronos/bite/extension/src/project/'

css_library(name = 'base_css',
            srcs = [
                'default.css',
                PROJECT_PKG + 'styles:explore.css',
                PROJECT_PKG + 'styles:detail.css',
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
