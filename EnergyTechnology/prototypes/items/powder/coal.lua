local name = 'technical-item-powder-coal'
local item = {
    type = 'item',
    name = name,
    icon = '__EnergyTechnology__/graphics/icons/powder-coal.png',
    icon_size = 32,
    stack_size = 100,
    flags = { 'goes-to-main-inventory' },
    subgroup = 'raw-material',
    fuel_value = '16MJ',
    fuel_category = 'chemical',
    order = 'c[technical-item-powder-coal]',
    fuel_acceleration_multiplier = 1.35,
    fuel_top_speed_multiplier = 1.10,
}
local recipe = {
    type = 'recipe',
    name = name,
    category = 'milling',
    energy_required = 2,
    ingredients = {
        { 'coal', 1 }
    },
    result = name,
    result_count = 2,
}
return {
    item = item,
    recipe = recipe
}