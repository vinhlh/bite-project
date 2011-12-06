# Copyright 2011 Google Inc.  All Rights Reserved.
# Author: jasonstredwick@google.com (Jason Stredwick)
#
# Common build definitions for packages within BITE's client code base.


subinclude('//javascript/externs/builddefs:BUILD');
subinclude('//javascript/closure/builddefs:BUILD');

DEBUG_COMPILER_DEFS = CLOSURE_COMPILER_FLAGS_UNOBFUSCATED + [
    '--generate_exports',
]

OPTIMIZED_COMPILER_DEFS = CLOSURE_COMPILER_FLAGS_STRICT + [
    '--generate_exports',
]

COMPILER_DEFS = DEBUG_COMPILER_DEFS + [
    '--aggressive_var_check_level=ERROR',
    '--check_global_names_level=ERROR',
    '--check_provides=ERROR',
    '--jscomp_error=accessControls',
    '--jscomp_error=checkRegExp',
    '--jscomp_error=checkTypes',
    '--jscomp_error=checkVars',
    '--jscomp_error=deprecated',
    '--jscomp_error=fileoverviewTags',
    '--jscomp_error=invalidCasts',
    '--jscomp_error=missingProperties',
    '--jscomp_error=nonStandardJsDocs',
    '--jscomp_error=strictModuleDepCheck',
    '--jscomp_error=undefinedVars',
    '--jscomp_error=unknownDefines',
    '--jscomp_error=visibility',
    '--strict',
]

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
    '--eliminate_dead_styles',
]

