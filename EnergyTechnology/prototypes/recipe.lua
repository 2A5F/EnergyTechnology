local extend = require'utils'.ExtendAll(function(v) return v.recipe end)

local coal = require 'prototypes.items.powder.coal'
local milling_machine = require 'prototypes.entitys.milling_machine'

extend {
   coal,
   milling_machine
}