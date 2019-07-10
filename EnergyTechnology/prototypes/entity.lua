local extend = require'utils'.ExtendAll(function(v) return v.entity end)

local milling_machine = require 'prototypes.entitys.milling_machine'

extend{milling_machine}